var $ = require('jquery');
var Swipe = require('swipe');
var Slides = require('./slides');
var Stepper = require('./stepper');

var B1 = require('./bezier1');
var B2 = require('./bezier1');

var $el, sw, slides, stepper, startPos = 0, offsetX = 0, viewportWidth, animInProgress = false;

function log(message) {
    $.post('http://webing.local:8080/api/ping/debug', {
        description: message
    });
}

function initSwipe() {
    sw = new Swipe($el.get(0), {})
        .on('start', startMove)
        .on('move', handleMove)
        .on('end', endMove)
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
    if (animInProgress) {
        return;
    }

    log('start move')

    slides.start();
}

function handleMove(d) {
    if (animInProgress) {
        return;
    }
    slides.setXOffset(d.offset.x);
}

function endMove(d) {
    if (animInProgress) {
        return;
    }

    animInProgress = true;

    var startProgress = (Math.abs(d.offset.x) / viewportWidth), p, duration, targetOffset;

    p = startProgress;
    duration = 800;
    
    // Ja pabīdīts mazāk par trešo daļu, tad atpakaļ uz izejas pozīciju
    if (!d.isSwipe && (startProgress < 0.3333)) {
        p = 1-p;
    }
    
    stepper.runFrom(p, duration, [0,0,.12,1], function(progress){
        
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
        animInProgress = false;
    })
}

function handleSlideAdd(index, el) {
    $(el).html('Slide '+index)
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