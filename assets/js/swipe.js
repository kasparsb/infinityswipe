var $ = require('jquery');
var Swipe = require('swipe');
var Slides = require('./slides');
var Stepper = require('./stepper');

var B1 = require('./bezier1');
var B2 = require('./bezier1');

var $el, sw, slides, stepper, viewportWidth;
var startPos = 0, offsetX = 0, isMoveStarted = false;

//var stepperCurve = [0,0,1,1]; // linear

// Šitā kombinācija ir laba
var stepperCurve = [0,0,.12,1];
var stepperDuration = 2000;

function log(message) {
    // $.post('http://webing.local:8080/api/ping/debug', {
    //     description: message
    // });

    //console.log(message);
}

function initSwipe() {
    sw = new Swipe($el.get(0), {})
        .on('start', startMove)
        .on('move', handleMove)
        .on('end', endMove) // Notiek tikai, ja ir bijusi valid move
        .on('touchend', endTouch) // Notiek vienmēr
}

function initSlides() {
    slides = new Slides($el.get(0), {
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

function endTouch(d) {
    
}

function endMove(d) {
    var x = findSlideOffsetX(0, viewportWidth);

    console.log('endmove', x);

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

    var startProgress = (Math.abs(x) / viewportWidth), p, targetOffset;

    console.log('startprogress', startProgress, d.direction);

    p = startProgress;
    
    // Ja pabīdīts mazāk par trešo daļu, tad atpakaļ uz izejas pozīciju
    if (!d.isSwipe && (startProgress < 0.3333)) {
        p = 1-p;
    }
    
    stepper.runFrom(p, stepperDuration, stepperCurve, function(progress){
        
        // Kalkulējam offset no progress
        // Ja progress mazāks par pusi, tad ejam atpakaļ uz sākumu
        if (!d.isSwipe && (startProgress < 0.3333)) {
            targetOffset = viewportWidth - (viewportWidth * progress);
        }
        else {
            targetOffset = viewportWidth * progress;
        }

        targetOffset *= d.direction == 'left' ? -1 : 1;

        slides.setXOffset(targetOffset);



    }, function(){
        // Done
    })
}

function handleSlideAdd(index, el) {
    $(el).html('Slide '+index)
}

function findSlideOffsetX(start, stop) {
    for (var i = 0; i < slides.slides.length; i++) {
        if (slides.slides[i].x > start && slides.slides[i].x < stop) {
            return slides.slides[i].x;
        }
    }
    return undefined;
}


module.exports = {
    init: function() {
        $el = $('.swipe');

        viewportWidth = $el.width();
        
        initSwipe();
        initSlides();
        initStepper();
    }
}


global.test = function() {
    slides.start();
    slides.setXOffset(-2);
}

global.testStepper = function() {
    
    //var curve = [.42,0,1,1];
    //var curve = [0,0,1,1];
    var curve = [0,0,.12,1]; // Tricky
    //var curve = [.25,.7,.12,.99];

    var startProgress = 0;
    console.log('startprogress', startProgress);

    stepper.runFrom(startProgress, 5000, curve, function(progress){
    //stepper.run(5000, curve, function(progress){
        
        // Kalkulējam offset no progress
        //console.log('step', progress);


        slides.setXOffset(-1 * viewportWidth * progress);
        

    }, function(){
        console.log('stepp done');
    })

}

var bezier1 = new B1(0,0,.12,1);
global.testB1 = function(progress) {
    return bezier1.get(progress)
}

var bezier2 = new B2(0,0,1,1);
global.testB2 = function(progress) {
    return bezier2.get(progress)
}