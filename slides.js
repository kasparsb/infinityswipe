var getElementOuterDimensions = require('./getElementOuterDimensions');
var elementsCollection = require('./elementsCollection');

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

        slides.each(function(slide){
            
            mthis.push(slide)
        })

        this.balanceSlides();
    },

    reset: function() {
        this.slides = [];
        this.prepareSlides(this.slidesElements);
    },

    setViewportWidth: function(width) {
        this.viewport.width = width;
    },

    resize: function() {

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

    /**
     * Saskaitām cik elementu ir ārpus viewport no labās puses
     */ 
    slidesCountAfterViewport: function() {
        var r = 0;
        for (var i = 0; i < this.slidesCount; i++) {
            if (this.slides[i].x > this.viewport.width) {
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
            if (this.slides[i].x + this.slides[i].width < 0) {
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
    unshift: function(el) {
        this.slidesCount = this.slides.unshift({
            el: el,
            index: this.first().index - 1,
            x: this.first().x - (getElementOuterDimensions(el).width + this.getSlidesPadding()),
            startX: this.first().startX - (getElementOuterDimensions(el).width + this.getSlidesPadding()),
            width: getElementOuterDimensions(el).width
        });

        this.setX(el, this.first().x);

        this.executeSlideAddCallbacks(this.first().index, this.first().el);
    },

    /**
     * Pievienojam slide masīva beigās
     */
    push: function(el) {
        this.pushWithIndex(el, this.nextIndex());
    },

    pushWithIndex: function(el, index) {
        this.slidesCount = this.slides.push({
            el: el,
            index: index,
            // x: this.nextX(),
            // startX: this.nextStartX(),
            x: 0,
            startX: 0,
            width: getElementOuterDimensions(el).width
        });

        this.setX(el, this.last().x);

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

        return;


        // Balansējam tikai, ja viewport.width > 0
        if (this.viewport.width <= 0) {
            return;
        }

        /**
         * @todo Uzlabot balansēšanu, lai gadījumā ir maz slide elementu,
         * tad lai viens no slaidiem netiek visu laiku mētās no sākuma uz 
         * beigām un otrādi
         */

        // Pārbaudām vai aiz viewport nav par maz slaidu
        while (this.slidesCountAfterViewport() < 1) {
            // Pirmo no kreisās puses pārliekam uz beigām
            this.push(this.shift().el);
        }

        // Pārbaudām vai pirms viewport nav par maz slaidu
        while (this.slidesCountBeforeViewport() < 1) {
            this.unshift(this.pop().el);
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