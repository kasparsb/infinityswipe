var $ = require('jquery');
var Swipe = require('swipe');
var Stepper = require('stepper');
var Slides = require('./slides');

function createSwipe(el, $slides) {

    var slideAddCb;
    var slides, stepper, viewportWidth;
    var startPos = 0, offsetX = 0, isMoveStarted = false;
    var stepperCurve = [0,0,.12,1];
    var stepperDuration = 300;

    function initSwipe() {
        new Swipe(el, {'direction': 'horizontal'})
            .on('start', startMove)
            .on('move', handleMove)
            .on('touchend', endMove) 
    }

    function initSlides() {
        slides = new Slides($slides, viewportWidth, {
            onSlideAdd: handleSlideAdd
        });
    }

    function initStepper() {
        stepper = new Stepper();
    }

    function startMove(c) {
        if (stepper.isRunning()) {
            stepper.stop();
        }

        slides.start();
        isMoveStarted = true;
    }

    function handleMove(d) {    
        if (stepper.isRunning()) {
            return;
        }

        if (!isMoveStarted) {
            return;
        }

        slides.setXOffset(d.offset.x);
    }

    function endMove(d) {
        if (!isMoveStarted) {
            return;
        }

        isMoveStarted = false;

        snapSlides(d.direction, d.isSwipe, findSlideOffsetXBetween(0, viewportWidth));
    }

    function snapSlides(direction, isSwipe, x) {
        if (typeof x == 'undefined') {
            return;
        }

        if (stepper.isRunning()) {
            return;
        }

        var startProgress, targetOffset, slideMoveDirection;

        /**
         * Nosakām kāds ir slaid iekadrēšanas progress
         * Ja tiek bīdīts pa labi un ir swipe kustība, tad 
         * bīdam pa labi un progress ir sākuma
         * Ja nav swipe, tad tiek slaids bīdīts atpakaļ un progress
         * ir pretējs
         */
        if (direction == 'right') {
            slideMoveDirection = 'right';

            startProgress = Math.abs(x) / viewportWidth;
            if (!isSwipe && (startProgress < 0.3333)) {
                startProgress = 1 - startProgress;

                slideMoveDirection = 'left';
            }
        }
        else if (direction == 'left') {
            slideMoveDirection = 'right';

            startProgress = Math.abs(x) / viewportWidth;
            if (isSwipe || (startProgress < 0.7777)) {
                startProgress = 1 - startProgress;

                slideMoveDirection = 'left';
            }
        }



        // Nofiksējam slaidu x pozīcijas
        /**
         * @todo slides.start jāpārsauc savādāk
         */
        slides.start();
        
        stepper.runFrom(startProgress, stepperDuration, stepperCurve, function(progress){
            
            // Šis būs tas offset, kurš tiek animēts un kurš ir jāliek klāt slaidam
            targetOffset = viewportWidth - (progress * viewportWidth);

            // Atkarībā no virziena piekoriģējam offset
            // Ja bīdām pa labi, tad sākam no 0 līdz targetOffset
            if (slideMoveDirection == 'right') {
                targetOffset = (viewportWidth - x) - targetOffset;
            }
            else if (slideMoveDirection == 'left') {
                targetOffset = (x - targetOffset) * -1;
            }

            slides.setXOffset(targetOffset);

        }, function(){
            // Done
        })
    }

    function findSlideOffsetXBetween(start, stop) {
        for (var i = 0; i < slides.slides.length; i++) {
            if (slides.slides[i].x > start && slides.slides[i].x < stop) {
                return slides.slides[i].x;
            }
        }
        return undefined;
    }

    /**
     * Atrodam nākošo offsetX aiz norādītā x
     */
    function findSlideOffsetXNextFrom(x) {
        var r = undefined;
        for (var i = 0; i < slides.slides.length; i++) {
            if (slides.slides[i].x > x) {
                if (typeof r == 'undefined' || slides.slides[i].x < r) {
                    r = slides.slides[i].x;
                }
            }
        }
        return r;
    }

    function handleSlideAdd(index, el) {
        if (slideAddCb) {
            slideAddCb(index, el);
        }
    }


    viewportWidth = $(el).width();
    
    // Liekam timeout, lai izpildās nākamajā scope
    // Vajag, lai izsaucošais kods var uzlikt onSlideAdd pirms tam
    setTimeout(function(){
        initSwipe();
        initSlides();
        initStepper();
    });

    return {
        onSlideAdd: function(cb) {
            slideAddCb = cb;
        },
        nextSlide: function() {
            snapSlides('left', true, findSlideOffsetXNextFrom(0));
        },
        prevSlide: function() {
            snapSlides('right', true, 0);
        }
    }
}


module.exports = function(el, $slides) {
    return createSwipe(el, $slides);
}