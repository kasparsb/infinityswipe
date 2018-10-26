var Swipe = require('swipe');
var Stepper = require('stepper');
var Slides = require('./slides');
var getElementDimensions = require('./getElementDimensions');

function createSwipe(el, $slides, conf) {


    window.startMove = function() {
        console.log('asdadadads');
        slides.start();
        isMoveStarted = true;            
    }
    window.setXOffset = function(x) {
        slides.setXOffset(x);
    }



    var slideAddCb, changeCb, slideMoveCb = function(){};
    var slides, stepper, viewportWidth = 0;
    var startPos = 0, offsetX = 0, isMoveStarted = false;
    var stepperCurve = [0,0,.12,1];
    var stepperDuration = 300;

    // Pēc noklusējuma viss ir enbabled, bet ir iespēja uz mirkli atslēgt touch eventus
    var isEnabled = true;

    function initSwipe() {
        new Swipe(getSwipeTarget(), {'direction': 'horizontal'})
            .on('start', startMove)
            .on('move', handleMove)
            .on('touchend', endMove) 
    }

    function initSlides() {
        slides = new Slides($slides, viewportWidth, {
            onSlideAdd: handleSlideAdd,
            slidesPadding: getSlidesPadding
        });
    }

    function initStepper() {
        stepper = new Stepper();
    }

    function startMove(c) {
        if (!isEnabled) {
            return;
        }

        if (stepper.isRunning()) {
            stepper.stop();
        }

        slides.start();
        isMoveStarted = true;
    }

    function handleMove(d) {    
        if (!isEnabled) {
            return;
        }

        if (stepper.isRunning()) {
            return;
        }

        if (!isMoveStarted) {
            return;
        }

        slideMoveCb(Math.abs(d.offset.x) / viewportWidth, d.direction);

        slides.setXOffset(d.offset.x);
    }

    function endMove(d) {
        if (!isEnabled) {
            return;
        }
        
        if (!isMoveStarted) {
            return;
        }

        isMoveStarted = false;

    
        snapSlides(
            d.direction, 
            
            // Ja direction left, tad tuvāko slide labajai malai
            slides[d.direction == 'left' ? 'findFirstBetweenX' : 'findLastBetweenX'](0, viewportWidth).getX(),

            d.isSwipe, 
            d.touchedElement ? true : false
        );
    }

    /**
     * Nofiksējam slides norādītajā virzienā
     * @param string Virziens, kurā jānofiksē slides
     * @param number Offset
     * @param boolean Vai bija pilnīga swipe kustība. 
     * Lietotājs apzināti taisīja swipe pa labi vai kreisi
     * @param boolean Vai nofiksēšanu izraisīja touch notikums
     */
    function snapSlides(direction, x, isSwipe, isTouch) {
        if (typeof x == 'undefined') {
            return;
        }

        if (stepper.isRunning()) {
            return;
        }

        var startProgress, targetOffset, slideMoveDirection;

        var vpw = viewportWidth;

        /**
         * Nosakām kāds ir slaid iekadrēšanas progress
         * Ja tiek bīdīts pa labi un ir swipe kustība, tad 
         * bīdam pa labi un progress ir sākuma
         * Ja nav swipe, tad tiek slaids bīdīts atpakaļ un progress
         * ir pretējs
         */
        if (direction == 'right') {
            slideMoveDirection = 'right';

            /**
             * @todo Šito vēl kārtīgi pādomāt
             * Pašlaik liekam, klāt jo pēdējais slide iet ar padding ārpus
             * viewport width, tāpēc, kad animē visu uz prev vierzienu, tad
             * jāņēm vērā šis padding, ja nē, tad slides pozicionējas ar nobīdi
             */
            vpw += getSlidesPadding();

            startProgress = Math.abs(x) / vpw;
            if (!isSwipe && (startProgress < 0.3333)) {
                startProgress = 1 - startProgress;

                slideMoveDirection = 'left';
            }
        }
        else if (direction == 'left') {
            slideMoveDirection = 'right';

            startProgress = Math.abs(x) / vpw;
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
            targetOffset = vpw - (progress * vpw);

            // Atkarībā no virziena piekoriģējam offset
            // Ja bīdām pa labi, tad sākam no 0 līdz targetOffset
            if (slideMoveDirection == 'right') {
                targetOffset = (vpw - x) - targetOffset;
            }
            else if (slideMoveDirection == 'left') {
                targetOffset = (x - targetOffset) * -1;
            }

            


            /**
             * slideMoveCb padodam user izvēlēto kustību
             * Kad slide atnāk atpakaļ savā vietā dēļ nepietiekamas
             * kustības, tad lai movecb simulētu tā it kā lietotājs pats
             * atbīdīja atpakaļ
             */
            if (slideMoveDirection == 'right') {
                if (direction == 'right') {
                    slideMoveCb(progress, direction);
                }
                else {
                    slideMoveCb(1-progress, direction);
                }
            }
            else {
                if (direction == 'right') {
                    slideMoveCb(1-progress, direction);
                }
                else {
                    slideMoveCb(progress, direction);
                }
            }


            

            slides.setXOffset(targetOffset);

        }, function(){
            slideSnapTransitionDone({
                isSwipe: isSwipe, 
                isTouch: isTouch
            });
        })
    }

    function slideSnapTransitionDone(params) {
        if (typeof changeCb != 'undefined') {
            changeCb(params);
        }
    }

    function getSwipeTarget() {
        if (conf && conf.swipeTarget) {
            return conf.swipeTarget;
        }
        return el;
    }

    function getSlidesPadding() {
        if (conf && typeof conf.slidesPadding != 'undefined') {
            if (typeof conf.slidesPadding == 'function') {
                return conf.slidesPadding();
            }
            else {
                return conf.slidesPadding;
            }
        }

        return 0;
    }

    function handleSlideAdd(index, el) {
        if (slideAddCb) {
            slideAddCb(index, el);
        }
    }

    function setIsEnabled(s) {
        isEnabled = s;
    }

    function handleResize() {
        viewportWidth = getElementDimensions(el).width;

        if (slides) {
            slides.setViewportWidth(viewportWidth);
            slides.resize();
        }
    }

    // Liekam timeout, lai izpildās nākamajā scope
    // Vajag, lai izsaucošais kods var uzlikt onSlideAdd pirms tam
    setTimeout(function(){
        handleResize();
        initSwipe();
        initSlides();
        initStepper();
    });

    return {
        onSlideAdd: function(cb) {
            slideAddCb = cb;
        },
        onChange: function(cb) {
            changeCb = cb;
        },
        /**
         * Slide kustība. Lai var slide kustību sinhronizēt
         * ar kādu citu elementu
         */
        onSlideMove: function(cb) {
            slideMoveCb = cb
        },
        restart: function() {
            slides.reset();
        },
        nextSlide: function() {
            snapSlides('left', slides.findSlideOffsetXNextFrom(0), true, false);
        },
        prevSlide: function() {
            snapSlides('right', 0, true, false);
        },
        showSlide: function(index) {
            slides.showByIndex(index);
        },
        getCurrent: function() {
            return slides.findFirstBetweenX(-1, viewportWidth);
        },
        getNext: function() {
            var s = slides.findFirstBetweenX(-1, viewportWidth);
            return slides.getByIndex(s.index+1);
        },
        getPrev: function() {
            var s = slides.findFirstBetweenX(-1, viewportWidth);
            return slides.getByIndex(s.index-1);
        },
        getSlides: function() {
            return slides;
        },
        disable: function() {
            setIsEnabled(false);
        },
        enable: function() {
            setIsEnabled(true);
        },
        resize: function() {
            handleResize();
        }
    }
}


module.exports = function(el, $slides, conf) {
    return createSwipe(el, $slides, conf);
}