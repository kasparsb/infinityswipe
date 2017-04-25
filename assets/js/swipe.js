var $ = require('jquery');
var Swipe = require('swipe');
var Slides = require('./slides');
var Stepper = require('./stepper');

function createSwipe(el) {

    var slideAddCb;
    var sw, slides, stepper, viewportWidth;
    var startPos = 0, offsetX = 0, isMoveStarted = false;

    //var stepperCurve = [0,0,1,1]; // linear

    // Šitā kombinācija ir laba
    var stepperCurve = [0,0,.12,1];
    var stepperDuration = 300;

    function initSwipe() {
        sw = new Swipe(el, {'direction': 'horizontal'})
            .on('start', startMove)
            .on('move', handleMove)
            // Notiek, tikai, kad ir bijis valid move
            //.on('end', endMove) 
            // Notiek vienmēr. Gadījumā, kad notiek animēšana, lietotājs
            // pieskaras pie ekrāna, tad apstādinām animāciju
            // un ja arī nav veicis swipe kustību ļaujam šajā mirklī pabeigt
            // slide animāciju
            .on('touchend', endMove) 
    }

    function initSlides() {
        slides = new Slides(el, {
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
        var x = findSlideOffsetX(0, viewportWidth);

        if (typeof x == 'undefined') {
            return;
        }

        if (stepper.isRunning()) {
            return;
        }

        if (!isMoveStarted) {
            return;
        }

        isMoveStarted = false;

        var startProgress, targetOffset, slideMoveDirection;

        /**
         * Nosakām kāds ir slaid iekadrēšanas progress
         * Ja tiek bīdīts pa labi un ir swipe kustība, tad 
         * bīdam pa labi un progress ir sākuma
         * Ja nav swipe, tad tiek slaids bīdīts atpakaļ un progress
         * ir pretējs
         */
        if (d.direction == 'right') {
            slideMoveDirection = 'right';

            startProgress = Math.abs(x) / viewportWidth;
            if (!d.isSwipe && (startProgress < 0.3333)) {
                startProgress = 1 - startProgress;

                slideMoveDirection = 'left';
            }
        }
        else if (d.direction == 'left') {
            slideMoveDirection = 'right';

            startProgress = Math.abs(x) / viewportWidth;
            if (d.isSwipe || (startProgress < 0.7777)) {
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

    function findSlideOffsetX(start, stop) {
        for (var i = 0; i < slides.slides.length; i++) {
            if (slides.slides[i].x > start && slides.slides[i].x < stop) {
                return slides.slides[i].x;
            }
        }
        return undefined;
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
            console.log('slidenext', el)
        },
        prevSlide: function() {
            console.log('slideprev', el)
        }
    }
}


module.exports = function(el) {
    return createSwipe(el);
}