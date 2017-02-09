var $ = require('jquery');
var Swipe = require('swipe');
var Slides = require('./slides');
var Stepper = require('./stepper');

var B1 = require('./bezier1');
var B2 = require('./bezier1');

var $el, sw, slides, stepper, startPos = 0, offsetX = 0, viewportWidth;

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

function startMove() {
    slides.start();
}

function endMove(d) {
    var startProgress = (Math.abs(d.offset.x) / viewportWidth), p, duration, targetOffset;

    p = startProgress;
    duration = 800;
    if (d.direction == 'left') {
        if (startProgress < 0.3) {
            p = 1-p;
            duration = 1200;
        }
    }

    console.log('start', startProgress, p, d.offset.x);

    stepper.runFrom(p, duration, [0,0,.12,1], function(progress){
        
        // Kalkulējam offset no progress
        if (d.direction == 'left') {
            // Ja progress mazāks par pusi, tad ejam atpakaļ uz sākumu
            if (startProgress < 0.3) {
                targetOffset = -1*(viewportWidth - (viewportWidth * progress));
            }
            else {
                targetOffset = -1*viewportWidth * progress;
            }
        }
        else if (d.direction == 'right') {
            directionMultiplier = 1;
        }


        slides.setXOffset(targetOffset);

        console.log('progress', progress, targetOffset);
        

    }, function(){
        console.log('stepp done');
    })
}

function handleMove(d) {
    slides.setXOffset(d.offset.x);
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