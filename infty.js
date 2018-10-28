var Swipe = require('swipe');
var Stepper = require('stepper');
var Slides = require('./slides');
var getElementDimensions = require('./getElementDimensions');

function createSwipe(el, $slides, conf) {
    var slideAddCb, changeCb, pagesCountCb, slideMoveCb = function(){};
    var slides, stepper, viewportWidth = 0;
    var startPos = 0, offsetX = 0, isMoveStarted = false;
    var stepperCurve = [0,0,.12,1];
    var stepperDuration = 3000;

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
            (function(){
                // Ja direction left, tad tuvāko slide labajai malai
                if (d.direction == 'left') {
                    return slides.findClosestToXFromRight(0)
                }
                else {
                    return slides.findClosestToXFromLeft(0)
                }
            })(),

            0,

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

    function snapSlide(slide, snapTarget, isSwipe, isTouch) {
        // Stepojam no slide.getX() uz snapTarget
        // Progress nosakām pēc slide width + this.getSlidesPadding()
        var transitionWidth = slide.width + getSlidesPadding();


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

    function snapSlides2(direction, x, isSwipe, isTouch) {

        // šai metodei nevajag zināt vai ir bijis swipe. Tā tikai un vienīgi
        // snapo slide getX pret 0
        // snapSlide - iedodu iekšā slide
        // vienmēr nosnapojam slide kreiso malu (getX) pret 0
        // Ja slide getX ir pozitīvs, tad tas snaposies uz kreiso pusi
        // Ja slide getX ir negatīvs, tas tas snaposies uz labo pusi


        console.log('snapSlides', x);
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
            // Virzienu nevajag zināt. Vajag padod tikai slide kuru nospnaot
            //snapSlides('left', slides.findClosestToXFromRight(slides.findFirstBetweenX(-1, viewportWidth).getX()+1).getX(), true, false);

            snapSlide(
                slides.findClosestToXFromRight(slides.findFirstBetweenX(-1, viewportWidth).getX()+1),
                0,
                false,
                false
            )
        },
        prevSlide: function() {
            // Virzienu nevajag zināt. Vajag padod tikai slide kuru nospnaot
            //snapSlides('right', slides.findClosestToXFromLeft(-1).getX(), true, false);

            snapSlide(
                slides.findClosestToXFromLeft(-1),
                0,
                false,
                false
            )
        },
        nextPage: function() {

        },
        prevPage: function() {

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