var Swipe = require('swipe');
var Stepper = require('stepper');
var Slides = require('./slides');
var getElementDimensions = require('./getElementDimensions');

function createSwipe(el, $slides, conf) {
    var slideAddCb, changeCb, pagesCountCb, slideMoveCb = function(){};
    var slides, stepper, viewportWidth = 0, startMoveSlide;
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
            slidesPadding: getSlidesPadding,
            positionItems: getPositionItems(),
            onPagesCount: function(c){
                if (pagesCountCb) {
                    pagesCountCb(c)
                }
            }
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

        // Pieglabājam current slide, no kura tika sākta kustība
        startMoveSlide = getCurrent();

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

        snapSlide(
            // Šeit ņemam vērā isSwipe, lai saprastu uz kuru slide snapot
            getSlideToSnapByEndMove(d),
            0,
            d.isSwipe, 
            d.touchedElement ? true : false
        );
    }

    function getSlideToSnapByEndMove(d) {
        /**
         * Kāda daļa no pārbīdāmā slide jau ir pārbīdīta
         * Tas vajadzīgs, lai gadījumā ja tikai nedaudz pabīdīts, tad
         * atliktu atpakaļ, tas ir, lietotājs nemaz negribēja pārbīdīt
         * Ja ratio lielāks par 0.333, tad lietotājs gribēja bīdīt
         * Kaut gan šeit mazākiem slaidiem varbūt 0.33 ir maz???
         */
        var moveRatio = Math.abs(d.offset.x / startMoveSlide.width)

        // Ja direction left, tad tuvāko slide labajai malai
        if (d.direction == 'left') {
            if (d.isSwipe || moveRatio > 0.33333) {
                return slides.findClosestToXFromRight(0)
            }
            else {
                return slides.findClosestToXFromLeft(0)
            }
        }
        else {
            if (d.isSwipe || moveRatio > 0.33333) {
                return slides.findClosestToXFromLeft(0)
            }
            else {
                return slides.findClosestToXFromRight(0)   
            }
        }
    }

    /**
     * Nofiksējam slide pret norādīto pozīciju
     */
    function snapSlide(slide, snapTarget, isSwipe, isTouch) {
        if (typeof isSwipe == 'undefined') {
            isSwipe = false;
        }
        if (typeof isTouch == 'undefined') {
            isTouch = false;
        }

        // Stepojam no slide.getX() uz snapTarget
        // Progress nosakām pēc slide width + this.getSlidesPadding()
        //var transitionWidth = slide.width + getSlidesPadding();
        //var transitionWidth = viewportWidth;


        slides.start();

        startProgress = 0;

        /**
         * Aprēķinām kādu vajag offset, lai pārvietotos no getX uz snapTarget
         * Kad progress ir 0, tad offset atteicīgi arī ir 0
         * Kad progress ir 1, tad tas offset ir attālums starp slide.getX un snapTarget
         */
        var targetOffset = snapTarget - slide.getX();

        stepper.runFrom(startProgress, stepperDuration, stepperCurve, function(progress){
            // Te vajag aprēķināt direction
            slideMoveCb(progress, 'left');

            slides.setXOffset(progressToValue(progress, 0, targetOffset));

        }, function() {
            slideSnapTransitionDone({
                isSwipe: isSwipe, 
                isTouch: isTouch
            });
        })
    }

    function progressToValue(progress, fromValue, toValue) {
        var w = fromValue - toValue;
        return fromValue - (w * progress);
    }

    function slideSnapTransitionDone(params) {
        if (typeof changeCb != 'undefined') {
            changeCb(params);
        }
    }

    function getCurrent() {
        return slides.findFirstBetweenX(-1, viewportWidth);   
    }

    function getNext() {
        return slides.findClosestToXFromRight(getCurrent().getX()+1);
    }

    function getPrev() {
        return slides.findClosestToXFromLeft(getCurrent().getX()-1);
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

    function getPositionItems() {
        if (conf && typeof conf.positionItems != 'undefined') {
            return conf.positionItems;
        }
        return false;
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
        onPagesCount: function(cb) {
            pagesCountCb = cb;
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
            snapSlide(getNext(), 0)
        },
        prevSlide: function() {
            snapSlide(getPrev(), 0)
        },
        nextPage: function() {

        },
        prevPage: function() {

        },
        showSlide: function(index) {
            slides.showByIndex(index);
        },
        getCurrent: getCurrent,
        getNext: getNext,
        getPrev: getPrev,
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