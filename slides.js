var $ = require('jquery');

var Slides = function($slides, viewportWidth, conf) {
    this.viewport = {
        width: viewportWidth
    }

    // Nākošā slide X pozīcija
    this.slidesCount = 0;

    this.slides = [];

    this.slideAddCallbacks = [];
    if (conf && conf.onSlideAdd) {
        this.slideAddCallbacks.push(conf.onSlideAdd)
    }

    this.$slides = $slides;

    this.prepareSlides($slides);
}

Slides.prototype = {

    prepareSlides: function($slides) {
        var mthis = this;

        $slides.each(function(){
            
            mthis.push(this)
        })

        this.balanceSlides();
    },

    reset: function() {
        this.slides = [];
        this.prepareSlides(this.$slides);
    },

    setViewportWidth: function(width) {
        this.viewport.width = width;
    },

    resize: function() {

        // Update slides width
        for (var i = 0; i < this.slides.length; i++) {
            this.slides[i].width = $(this.slides[i].el).outerWidth();
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

            lastX += this.slides[i].width;
        }

        // Update visus, kas ir pa kreisi no ekrāna malas. Negatīvs x
        lastX = 0;
        for (var i = this.slides.length-1; i >= 0; i--) {
            if (this.slides[i].x >= 0) {
                continue;
            }

            lastX -= this.slides[i].width;

            this.slides[i].x = lastX;
            this.slides[i].startX = lastX;
            this.setX(this.slides[i].el, lastX);
        }
    },

    showByIndex: function(index) {
        this.slides = [];

        var mthis = this;

        this.$slides.each(function(i){
            if (i == 0) {
                mthis.pushWithIndex(this, index)
            }
            else {
                mthis.push(this)
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
            return this.last().x + this.last().width;
        }

        return 0;
    },

    nextStartX: function() {
        if (this.last()) {
            return this.last().startX + this.last().width;
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
            x: this.first().x - $(el).outerWidth(),
            startX: this.first().startX - $(el).outerWidth(),
            width: $(el).outerWidth()
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
            x: this.nextX(),
            startX: this.nextStartX(),
            width: $(el).outerWidth()
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
        // Balansējam tikai, ja viewport.width > 0
        if (this.viewport.width <= 0) {
            return;
        }

        // Pārbaudām vai aiz viewport nav par maz slaidu
        while (this.slidesCountAfterViewport() <= 1) {
            // Pirmo no kreisās puses pārliekam uz beigām
            this.push(this.shift().el);
        }

        // Pārbaudām vai pirms viewport nav par maz slaidu
        while (this.slidesCountBeforeViewport() <= 1) {
            this.unshift(this.pop().el);
        }
    },

    executeSlideAddCallbacks: function() {
        for (var i = 0; i < this.slideAddCallbacks.length; i++) {
            this.slideAddCallbacks[i].apply(this, arguments);
        }
    }
}

module.exports = Slides;