var $ = require('jquery');
var Infty = require('./swipe');

var api1 = new Infty($('.swipe--1').get(0), $('.swipe--1').find('.swipe__item'));
var api2 = new Infty($('.swipe--2').get(0), $('.swipe--2').find('.swipe__item'));
var api3 = new Infty($('.swipe--3').get(0), $('.swipe--3').find('.swipe__item'));
var api4 = new Infty($('.swipe--4').get(0), $('.swipe--4').find('.swipe__item'));


var imageIndex1 = 0, imageIndex2 = 0, imageIndex3 = 0, imageIndex4 = 0;
var images = [
    'https://c1.staticflickr.com/3/2859/32924770393_384a76c13e.jpg',
    'https://c1.staticflickr.com/3/2901/33605527231_b6c94cac82.jpg',
    'https://c1.staticflickr.com/3/2832/32919038623_2c6eb8c023.jpg'
    // 'https://c1.staticflickr.com/3/2877/33613662191_09caa3f6a3.jpg',
    // 'https://c1.staticflickr.com/3/2822/32918826513_3bc7b17908.jpg',
    // 'https://c2.staticflickr.com/4/3934/33582408212_5b9d226183.jpg',
    // 'https://c2.staticflickr.com/4/3669/33737824555_2d8f446c36.jpg',
    // 'https://c1.staticflickr.com/3/2878/33732917345_daaa775e98.jpg',
    // 'https://c1.staticflickr.com/3/2835/32886081974_36a9531d7b.jpg',
    // 'https://c2.staticflickr.com/4/3804/32895132024_a7679bcc88.jpg',
    // 'https://c1.staticflickr.com/3/2858/33577553782_c7db967deb.jpg',
    // 'https://c2.staticflickr.com/4/3734/33699026186_436c82bcbc.jpg'
];

function addImage(imageIndex, el) {
    $(el).css({
        'background-image': 'url('+images[imageIndex]+')',
        'background-size': 'cover',
        'background-position': 'center'
    });

    imageIndex++;
    if (imageIndex >= images.length) {
        imageIndex = 0;
    }

    return imageIndex;
}


api1.onSlideAdd(function(index, el){
    imageIndex1 = addImage(imageIndex1, el);
});
api2.onSlideAdd(function(index, el){
    imageIndex2 = addImage(imageIndex2, el);
});
api3.onSlideAdd(function(index, el){
    imageIndex3 = addImage(imageIndex3, el);
});
api4.onSlideAdd(function(index, el){
    imageIndex4 = addImage(imageIndex4, el);
});


global.next = function(i) {
    eval('api'+i+'.nextSlide()');
}
global.prev = function(i) {
    eval('api'+i+'.prevSlide()');
}