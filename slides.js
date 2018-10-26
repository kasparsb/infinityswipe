var getElementOuterDimensions = require('./getElementOuterDimensions');
var elementsCollection = require('./elementsCollection');
var slide = require('./slide');

var Slides = function(slides, viewportWidth, conf) {
    this.viewport = {}

    // Nākošā slide X pozīcija
    this.slidesCount = 0;

    this.slides = [];

    this.conf = conf;

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
        if (0) {
            this.positionItems();    
        }
        

        slides.each(function(slide){
            
            mthis.push(slide)
        })

        this.balanceSlides();
    },

    /**
     * Izkārtojam absolūti pozicionētos elementis vienu aiz otra
     */
    positionItems: function() {

    },

    reset: function() {
        this.slides = [];
        this.prepareSlides(this.slidesElements);
    },

    setViewportWidth: function(width) {
        this.viewport.width = width;
    },

    resize: function() {

        return;

        // Update slides width
        for (var i = 0; i < this.slides.length; i++) {
            this.slides[i].width = getElementOuterDimensions(this.slides[i].el).width;
        }

        // Update slide x visiem, kur ir pa labi no ekrāna malas. Pozītīvs x
        var lastX = 0;
        for (var i = 0; i < this.slides.length; i++) {
            if (this.slides[i].x < 0) {
                continue;
            }

            this.slides[i].x = lastX;
            this.slides[i].startX = lastX;
            this.setX(this.slides[i].el, lastX);

            // todo pielikt padding
            lastX += (this.slides[i].width + this.getSlidesPadding());
        }

        // Update visus, kas ir pa kreisi no ekrāna malas. Negatīvs x
        lastX = 0;
        for (var i = this.slides.length-1; i >= 0; i--) {
            if (this.slides[i].x >= 0) {
                continue;
            }

            // todo atņemt padding
            lastX -= (this.slides[i].width + this.getSlidesPadding());

            this.slides[i].x = lastX;
            this.slides[i].startX = lastX;
            this.setX(this.slides[i].el, lastX);
        }
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

    nextX: function() {
        if (this.last()) {
            return this.last().x + this.last().width + this.getSlidesPadding();
        }

        return 0;
    },

    nextStartX: function() {
        if (this.last()) {
            return this.last().startX + this.last().width + this.getSlidesPadding();
        }

        return 0;
    },

    nextRealX: function() {
        if (this.last()) {
            return this.last().realX + this.last().width + this.getSlidesPadding();
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
        s.realX = oldSlide.realX;

        /**
         * Vajag noskaidrot kādam ir jābūt jaunā slide x
         * Pašlaik zināmie ir 
         *     s.realX
         *     s.getX - šim jābūt šādam: this.first().getX() - s.width
         *     s.getX veidošanas formula ir šāda
         *     s.getX = s.realX + s.x
         *       6         3       2
         *     šajā mirklī x ir nezināmais ?
         *     s.x = s.getX - s.realX
         */
        s.x = (this.first().getX() - s.width) - s.realX;
        s.startX = (this.first().startX - s.width) - s.realX;
        

        this.slidesCount = this.slides.unshift(s);

        this.setX(s.el, s.x);

        this.executeSlideAddCallbacks(this.first().index, this.first().el);
    },

    /**
     * Pievienojam slide masīva beigās
     */
    pushSlide: function(oldSlide) {
        var s = new slide(oldSlide.el, this.nextIndex());
        var w = s.width + this.getSlidesPadding();

        // DOM pozīcija nemainās neatkarīgi no tā kādā secībā elementi ir masīvā
        s.realX = oldSlide.realX;

        console.log('aa1', s.realX, this.last().getX(), this.last().width);

        s.x = (this.last().getX() + this.last().width) - s.realX;
        s.startX = (this.last().startX + this.last().width) - s.realX;

        this.slidesCount = this.slides.push(s);

        this.setX(s.el, s.x);

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
            // Starta x viesiem ir 0, jo šajā mirklī elementiem jābūt izkārtotiem
            x: 0,
            startX: 0,
            // Saglabājam reālo x pozīciju
            realX: this.nextRealX()
        })
        
        this.slidesCount = this.slides.push(s);

        this.setX(s.el, s.x);

        this.executeSlideAddCallbacks(this.last().index, this.last().el);
    },

    setX: function(el, x) {
        el.style.transform = 'translate3d('+x+'px,0,0)'
    },

    /**
     * Uzsākot kustību pieglabājam katra slide startX
     */
    start: function() {
        this.slides.map(function(s){
            s.startX = s.x;
        }) 
    },
    
    /**
     * Katram slide ir savs x
     * Uzliekam x offset, bet pašu x nemainām
     */
    setXOffset: function(offset) {

        for (var i = 0; i < this.slidesCount; i++) {
            this.slides[i].x = this.slides[i].startX + offset;

            this.setX(this.slides[i].el, this.slides[i].x);
        }

        this.balanceSlides();
    },

    balanceSlides: function() {
        // Balansējam tikai, ja viewport.width > 0
        if (this.viewport.width <= 0) {
            return;
        }

        var safe = 0;


        // Pārbaudām vai aiz viewport nav par maz slaidu
        while (this.slidesCountAfterViewport() < 1) {


            console.log('balance after');

            // Pirmo slide no kreisās puses pārliekam uz beigām
            this.pushSlide(this.shift());

            if (safe++ > 100) {
                console.log('saved 1');
                return;
            }
        }

        // Pārbaudām vai pirms viewport nav par maz slaidu
        while (this.slidesCountBeforeViewport() < 1) {

            
            console.log('balance before');



            this.unshiftSlide(this.pop());

            if (safe++ > 100) {
                console.log('saved 2');
                return;
            }
        }
    },

    executeSlideAddCallbacks: function() {
        for (var i = 0; i < this.slideAddCallbacks.length; i++) {
            this.slideAddCallbacks[i].apply(this, arguments);
        }
    },

    getSlidesPadding: function() {
        return this.conf.slidesPadding();
    }
}

module.exports = Slides;