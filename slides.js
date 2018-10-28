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

        this.addPageNumbers();

        this.balanceSlides();

        this.pagesCountCallback(this.getMaxPage());
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
        for (var i = 0; i < this.slidesCount; i++) {
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

    /**
     * Atgriežam slide, kurš vizuāli ir pats pēdējais
     */
    visualLast: function() {
        var r = 0;
        for (var i = 0; i < this.slidesCount; i++) {
            if (this.slides[r].getX() < this.slides[i].getX()) {
                r = i;
            }
        }
        return this.slides[r];
    },

    /**
     * Atgriežam slide, kurš vizuāli ir pats pirmais
     */
    visualFirst: function() {
        var r;
        for (var i = 0; i < this.slidesCount; i++) {
            if (typeof r == 'undefined' || this.slides[r].getX() > this.slides[i].getX()) {
                r = i;
            }
        }
        return this.slides[r];
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
        var slide = this.visualLast();

        var firstSlide = this.visualFirst();

        var w = slide.width + this.getSlidesPadding();

        // Samazinām index. Reālo indekss neaiztiekam
        slide.index = firstSlide.index - 1;

        slide.x = (firstSlide.xReal - (slide.xReal + w)) + firstSlide.x

        slide.updateCss();

        this.executeSlideAddCallbacks(slide.index, slide.el);
    },

    /**
     * Vizuāli pārvietojam pirmo slaid uz beigām
     */
    moveFirstToLast: function() {
        var slide = this.visualFirst();

        var lastSlide = this.visualLast();

        var w = lastSlide.width + this.getSlidesPadding();
        
        // Palielinām index. Reālo indekss neaiztiekam
        slide.index = lastSlide.index + 1;
        
        slide.x = ((lastSlide.xReal + w) - slide.xReal) + lastSlide.x;

        slide.updateCss();

        this.executeSlideAddCallbacks(slide.index, slide.el);
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

    /**
     * Sakārtojam slaides pēc vizuālā izkārtojuma
     */
    getSortedVisual: function(direction) {
        var r = [];
        for (var i = 0; i < this.slidesCount; i++) {
            r.push(this.slides[i]);
        }

        return r.sort(function(a, b){
            if (a.getX() < b.getX()) {
                return direction == 'asc' ? -1 : 1;
            }
            else if (a.getX() > b.getX()) {
                return 0;
            }
            else if (a.getX() > b.getX()) {
                return direction == 'asc' ? 1 : -1;
            }
        })
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

        // Meklējam pēc sakārtotiem pēc vizuālā izkārtojuma
        var r = this.getSortedVisual(searchDirection);

        for (var i = 0; i < r.length; i++) {
            if (this.isBetweenX(r[i], x1, x2)) {
                // Atgriežam slide instanci no īstā slides masīva
                return this.slides[r[i].indexReal];
            }
        }
        
        return undefined;
    },

    /**
     * Atrodam slide, kura getX ir viss tuvāk x no kreisās puses
     */
    findClosestToXFromLeft: function(x) {
        var r;
        for (var i = 0; i < this.slidesCount; i++) {
            // Izlaišam visus, kas ir lielāki par x
            if (this.slides[i].getX() > x) {
                continue;
            }
            if (typeof r == 'undefined' || this.slides[r].getX() < this.slides[i].getX()) {
                r = i;
            }
        }
        return this.slides[r];
    },

    /**
     * Atrodam nākošo offsetX aiz norādītā x
     */
    findClosestToXFromRight: function(x) {
        var r;
        for (var i = 0; i < this.slidesCount; i++) {
            // Izlaišam visus, kas ir lielāki par x
            if (this.slides[i].getX() < x) {
                continue;
            }
            if (typeof r == 'undefined' || this.slides[r].getX() > this.slides[i].getX()) {
                r = i;
            }
        }
        return this.slides[r];
    },

    findFirstBetweenX: function(x1, x2) {
        return this.findBetweenX(x1, x2, 'asc');
    },

    findLastBetweenX: function(x1, x2) {
        return this.findBetweenX(x1, x2, 'desc');  
    },

    /**
     * Pievienojam katram slaid lapas numuru, kurā tas iekrīt
     */
    addPageNumbers: function() {
        var page = 1, t = 0;

        for (var i = 0; i < this.slidesCount; i++) {

            this.slides[i].pageReal = page;
        
            t += (this.slides[i].width + this.getSlidesPadding());

            if (t >= this.viewport.width) {
                page++;
                t = 0;
            }
        }
    },

    /**
     * Saskaitām cik lapās var sadalīt visus slaidus
     * Lapa ir tad, kad to piepilda vairāki slaidi
     * Lapā var būt 1 vai vairāki slaidi
     */
    getMaxPage: function() {
        var r = 1;

        for (var i = 0; i < this.slidesCount; i++) {
            if (this.slides[i].pageReal > r) {
                r = this.slides[i].pageReal;
            }
        }

        return r;
    }
}

module.exports = Slides;