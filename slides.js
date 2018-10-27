var getElementOuterDimensions = require('./getElementOuterDimensions');
var elementsCollection = require('./elementsCollection');
var slide = require('./slide');

var Slides = function(slides, viewportWidth, conf) {
    this.viewport = {}

    // Nākošā slide X pozīcija
    this.slidesCount = 0;

    this.slides = [];

    this.conf = conf;

    this.pagesCountCallback = conf.onPagesCount;

    this.slideAddCallbacks = [];
    if (this.conf && this.conf.onSlideAdd) {
        this.slideAddCallbacks.push(this.conf.onSlideAdd)
    }

    this.slidesElements = new elementsCollection(slides);

    this.setViewportWidth(viewportWidth);
    this.prepareSlides(this.slidesElements);
}

Slides.prototype = {

    prepareSlides: function(slides) {
        var mthis = this;

        /**
         * Ja ir absolūti pozicionēti elementi, visi viens virs
         * otra, tad šeit nopozicionējam vienu aiz otra
         */
        if (this.conf.positionItems) {
            this.positionItems();
        }
        

        slides.each(function(slide){
            
            mthis.push(slide)
        })

        this.balanceSlides();

        this.pagesCountCallback(this.countPages());
    },

    /**
     * @todo šito vajag uztaisīt
     * Izkārtojam absolūti pozicionētos elementis vienu aiz otra
     */
    positionItems: function() {
        var mthis = this;
        var x = 0;
        this.slidesElements.each(function(el){
            el.style.left = x+'px';

            x = x + getElementOuterDimensions(el).width + mthis.getSlidesPadding();
        })
    },

    reset: function() {
        this.slides = [];
        this.prepareSlides(this.slidesElements);
    },

    setViewportWidth: function(width) {
        this.viewport.width = width;
    },

    resize: function() {

        /**
         *
         *
         *
         * @todo Varbūt vajag kaut kā inteliģentāk pārrēķināt
         *
         *
         *
         */
        this.reset();

    },

    
    /**
     *
     *
     *
     * @todo Pārskatīt. Vai tiešām vajag skatīties pēc reālo elementu index
     *
     *
     *
     */
    showByIndex: function(index) {
        this.slides = [];

        var mthis = this;

        this.slidesElements.each(function(slide, i){
            if (i == 0) {
                mthis.pushWithIndex(slide, index)
            }
            else {
                mthis.push(slide)
            }
        })

        this.balanceSlides();
    },

    /**
     * Atgriežam slide pēc kārtas numura redzamājā daļā
     */
    getByIndex: function(index) {
        for (var i = 0; i < this.slides.length; i++) {
            if (this.slides[i].index === index) {
                return this.slides[i];
            }
        }

        return false;
    },

    /**
     * Pieeja pirmajam slide
     */
    first: function() {
        return this.slides[0];
    },

    /**
     * Pieeja pēdējam slide
     */
    last: function() {
        if (this.slidesCount > 0) {
            return this.slides[this.slidesCount-1];
        }

        return false;
    },

    nextIndex: function() {
        if (this.last()) {
            return this.last().index + 1;
        }

        return 0;
    },

    nextXReal: function() {
        if (this.last()) {
            return this.last().xReal + this.last().width + this.getSlidesPadding();
        }

        return 0;
    },

    /**
     * Saskaitām cik elementu ir ārpus viewport no labās puses
     */ 
    slidesCountAfterViewport: function() {
        var r = 0;
        for (var i = 0; i < this.slidesCount; i++) {
            if (this.slides[i].getX() > this.viewport.width) {
                r++;
            }
        }

        return r;
    },

    /**
     * Saskaitām cik elementu ir ārpus viewport no labās puses
     */ 
    slidesCountBeforeViewport: function() {
        var r = 0;
        for (var i = 0; i < this.slidesCount; i++) {
            if (this.slides[i].getX() + this.slides[i].width < 0) {
                r++;
            }
        }

        return r;
    },


    /**
     * Izmetam pirmo slaid ārā un atgriežam to
     */
    shift: function() {
        this.slidesCount--;

        return this.slides.shift();
    },

    /**
     * Izmetam pēdējo slaid ārā un atgriežam to
     */
    pop: function() {
        this.slidesCount--;

        return this.slides.pop();
    },

    /**
     * Pievienojam slide masīva sākumā
     */
    unshiftSlide: function(oldSlide) {
        var s = new slide(oldSlide.el, this.first().index - 1);
        var w = s.width + this.getSlidesPadding();

        // DOM pozīcija nemainās neatkarīgi no tā kādā secībā elementi ir masīvā
        s.xReal = oldSlide.xReal;



        s.x = (this.first().xReal - (s.xReal + w)) + this.first().x

        // Atjaunojam move xoffsetu
        s.setXOffset(oldSlide.xOffset);

        s.updateCss();

        this.slidesCount = this.slides.unshift(s);

        this.executeSlideAddCallbacks(s.index, s.el);
    },

    /**
     * Pievienojam slide masīva beigās
     */
    pushSlide: function(oldSlide) {

        var s = new slide(oldSlide.el, this.nextIndex());
        var w = this.last().width + this.getSlidesPadding();
        
        // DOM pozīcija nemainās neatkarīgi no tā kādā secībā elementi ir masīvā
        s.xReal = oldSlide.xReal;

        
        s.x = ((this.last().xReal + w) - s.xReal) + this.last().x;

        // Atjaunojam move xoffsetu
        s.setXOffset(oldSlide.xOffset);
        
        s.updateCss();


        this.slidesCount = this.slides.push(s);

        this.executeSlideAddCallbacks(s.index, s.el);
    },

    /**
     * Pievienojam elementu masīva beigās
     */
    push: function(el) {
        this.pushWithIndex(el, this.nextIndex());
    },

    pushWithIndex: function(el, index) {

        var s = new slide(el, index, {
            // Saglabājam reālo x pozīciju
            xReal: this.nextXReal()
        })
        
        this.slidesCount = this.slides.push(s);

        s.updateCss();

        this.executeSlideAddCallbacks(this.last().index, this.last().el);
    },

    /**
     * Uzsākot kustību pieglabājam katra slide startX
     */
    start: function() {
        this.slides.map(function(s){
            s.start();
        }) 
    },
    
    /**
     * Katram slide ir savs x
     * Uzliekam x offset, bet pašu x nemainām
     */
    setXOffset: function(offset) {

        for (var i = 0; i < this.slidesCount; i++) {
            this.slides[i].setXOffset(offset);
            this.slides[i].updateCss();
        }


        this.balanceSlides();
    },

    /**
     * Pārvietojam pēdējo slaidu rindā uz rindas sākumu
     */
    moveLastToFirst: function() {
        this.unshiftSlide(this.pop());
    },

    /**
     * Pārvietojam pirmo slaidu rindā uz rindas beigām
     */
    moveFirstToLast: function() {
        this.pushSlide(this.shift());
    },

    balanceSlides: function() {

        // Balansējam tikai, ja viewport.width > 0
        if (this.viewport.width <= 0) {
            return;
        }

        var b = this.slidesCountBeforeViewport();
        var a = this.slidesCountAfterViewport();

        /**
         * Aprēķinām starpību starp items pirms un pēc. Dala ar divi
         * Apaļojam uz leju
         * Atkarībā no tā vai d > 0 vai d < 0 noteiksim virzienu, kurā pārvietot slaidus
         */
        var d = Math.floor((a - b) / 2);


        // Ja nav neviena slaida, ko pārvietot, tad bail
        if (Math.abs(d) < 1) {
            return;
        }

        /**
         * Ja d < 0, tad pārvietojam no beigām uz sākumu
         * Ja d > 0, tad pārvietojam no sākuma uz beigām
         */
        var method = d < 0 ? 'moveFirstToLast' : 'moveLastToFirst';

        d = Math.abs(d);
        for (var i = 0; i < d; i++) {
            this[method]();
        }
    },

    executeSlideAddCallbacks: function() {
        for (var i = 0; i < this.slideAddCallbacks.length; i++) {
            this.slideAddCallbacks[i].apply(this, arguments);
        }
    },

    getSlidesPadding: function() {
        return this.conf.slidesPadding();
    },

    isBetweenX: function(slide, x1, x2) {
        if (slide.getX() > x1 && slide.getX() < x2) {
            return true;
        }
    },

    /**
     * Meklējam pirmo slide starp padotajām x koordinātēm
     * @searchDirection meklēšanas virziens ASC vai DESC
     */
    findBetweenX: function(x1, x2, searchDirection) {

        if (searchDirection == 'asc') {
            for (var i = 0; i < this.slides.length; i++) {
                if (this.isBetweenX(this.slides[i], x1, x2)) {
                    return this.slides[i];
                }
            }
        }
        else {
            for (var i = this.slides.length-1; i >= 0; i--) {
                if (this.isBetweenX(this.slides[i], x1, x2)) {
                    return this.slides[i];
                }
            }   
        }
        
        return undefined;
    },

    findFirstBetweenX: function(x1, x2) {
        return this.findBetweenX(x1, x2, 'asc');
    },

    findLastBetweenX: function(x1, x2) {
        return this.findBetweenX(x1, x2, 'desc');  
    },

    /**
     * Atrodam nākošo offsetX aiz norādītā x
     */
    findSlideOffsetXNextFrom: function(x) {
        var r = undefined;
        for (var i = 0; i < this.slides.length; i++) {
            if (this.slides[i].getX() > x) {
                if (typeof r == 'undefined' || this.slides[i].getX() < r) {
                    r = this.slides[i].getX();
                }
            }
        }
        return r;
    },

    countPages: function() {
        if (this.slides.length == 0) {
            return 0;
        }

        var r = 0;
        var t = 0;
        var mthis = this;
        this.slides.forEach(function(slide){
            t += (slide.width + mthis.getSlidesPadding());

            if (t >= mthis.viewport.width) {
                r++;
                t = 0;
            }
        })

        if (t >= this.viewport.width) {
            r++;
        }

        return r;
    }
}

module.exports = Slides;