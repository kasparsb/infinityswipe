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
var stepperDuration = 300;


var imageIndex = 0;
var images = [
    'https://c1.staticflickr.com/3/2859/32924770393_384a76c13e.jpg',
    'https://c2.staticflickr.com/4/3741/33588515842_b2cdcde4cb.jpg',
    'https://c1.staticflickr.com/3/2901/33605527231_b6c94cac82.jpg',
    'https://c1.staticflickr.com/3/2832/32919038623_2c6eb8c023.jpg',
    'https://c1.staticflickr.com/3/2877/33613662191_09caa3f6a3.jpg',
    'https://c1.staticflickr.com/3/2822/32918826513_3bc7b17908.jpg',
    'https://c2.staticflickr.com/4/3934/33582408212_5b9d226183.jpg',
    'https://c2.staticflickr.com/4/3669/33737824555_2d8f446c36.jpg',
    'https://c1.staticflickr.com/3/2878/33732917345_daaa775e98.jpg',
    'https://c1.staticflickr.com/3/2835/32886081974_36a9531d7b.jpg',
    'https://c2.staticflickr.com/4/3804/32895132024_a7679bcc88.jpg',
    'https://c1.staticflickr.com/3/2858/33577553782_c7db967deb.jpg',
    'https://c2.staticflickr.com/4/3734/33699026186_436c82bcbc.jpg'
];


function log(message) {
    // $.post('http://webing.local:8080/api/ping/debug', {
    //     description: message
    // });

    //console.log(message);
}

function initSwipe() {
    sw = new Swipe($el.get(0), {'direction': 'horizontal'})
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
    console.log('move', d.direction);
    
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

    console.log('endmove', x, d.direction);

    if (typeof x == 'undefined') {
        return;
    }

    if (!(d.direction == 'right' || d.direction == 'left')) {
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
    
    console.log('startprogress', startProgress, d.direction, d.isSwipe ? 'swipe' : 'notswipe');
    
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

        //console.log(progress, targetOffset, x, slideMoveDirection);

        slides.setXOffset(targetOffset);

    }, function(){
        // Done
    })
}

function handleSlideAdd(index, el) {
    
    $(el).css({
        'background-image': 'url('+images[imageIndex]+')',
        'background-size': 'cover',
        'background-position': 'center'
    });

    imageIndex++;
    if (imageIndex >= images.length) {
        imageIndex = 0;
    }
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