var Swipe = require('swipe');
var Stepper = require('stepper');
var Slides = require('./slides');
var getElementDimensions = require('./getElementDimensions');

function createSwipe(el, $slides, conf) {
    var slideAddCb, changeCb, pagesCountCb, slideMoveCb = function(){}, slideMoveStartCb = function(){};
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

    function startMove(d) {
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

        slideMoveStartCb(d.touchedElement ? true : false);
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

        slideMoveCb(Math.abs(d.offset.x) / viewportWidth, d.direction, d.touchedElement ? true : false);

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
            d.touchedElement ? true : false,

            // Kāda ir manualMove distance
            // kādas ir virziens
            {
                offset: Math.abs(d.offset.x),
                direction: d.direction
            }
            
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
    function snapSlide(slide, snapTarget, isSwipe, isTouch, manualMove) {
        if (typeof isSwipe == 'undefined') {
            isSwipe = false;
        }
        if (typeof isTouch == 'undefined') {
            isTouch = false;
        }

        slides.start();

        /**
         * Aprēķinām kādu vajag offset, lai pārvietotos no getX uz snapTarget
         * Kad progress ir 0, tad offset atteicīgi arī ir 0
         * Kad progress ir 1, tad tas offset ir attālums starp slide.getX un snapTarget
         */
        var targetOffset = snapTarget - slide.getX();
        var targetDirection = targetOffset > 0 ? 'right' : 'left';

        var startProgress = 0;
        var pv = 0;
        var slideMoveProgress = 0;


        stepper.runFrom(startProgress, stepperDuration, stepperCurve, function(progress){
            
            pv = progressToValue(progress, 0, targetOffset);

            slides.setXOffset(pv);

            /**
             * Ja snap slides notiek tajā pašā virzienā, kā bija move kustība, tad
             * progresēja uz 1
             * Ja snap slides notiek atpakaļ, tad progresējam uz 0
             * SlideMoveCb vienmēr dodam progrss turpinājumu
             * Tas progress, kad ir te ir cits - tas ir progress no 0 līdz vietai, kura vajag snap slide
             * Tāpēc šeit savādāk rēķinām progresus
             * Šeit ņemam to abs(offset) kādu veica lietotājs un liekam klāt to offset kādu vajag, lai 
             * slaidi uztaisīt snap savā vietā
             * Ja virzieni sakrīt (lietotāja move un slidesnap), tad progresējam
             * Ja nē, tad regresējam atpakaļ uz sākumu
             */
            if (manualMove) {
                // Turpinām progresu, lai tas uzaug līdz 1, jo snap turpina tajā pašā virzienā
                if (manualMove.direction == targetDirection) {
                    slideMoveProgress = manualMove.offset + Math.abs(pv)
                }
                // Ejam atpakaļ uz izejas pozīciju, regresējam
                else {
                    slideMoveProgress = manualMove.offset + (-Math.abs(pv))
                }
                // Progress ir pārvietojums pret viewport platumu
                slideMoveProgress = slideMoveProgress / viewportWidth;
            }
            // Kustība notiek bez manuāli iesāktas kustības
            else {
                slideMoveProgress = progress
            }

            slideMoveCb(slideMoveProgress, targetDirection, false);

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

    function validateProgress(p) {
        if (p < 0) {
            p = 0;
        }
        if (p > 1) {
            p = 1;
        }
        return p;
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
        onSlideMoveStart: function(cb) {
            slideMoveStartCb = cb
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
            slideMoveStartCb(false);
            snapSlide(getNext(), 0)
        },
        prevSlide: function() {
            slideMoveStartCb(false);
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