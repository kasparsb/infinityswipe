function getStyleDimensions(style, name) {
    return parseInt(style.getPropertyValue(name), 10);
}

function getElementOuterDimensions(el, includeMargin) {
    includeMargin = typeof includeMargin == 'undefined' ? false : includeMargin;

    var s = getComputedStyle(el);

    var marginHorizontal = 0;
    var marginVertical = 0;
    if (includeMargin) {
        marginHorizontal = getStyleDimensions(s, 'margin-left') + getStyleDimensions(s, 'margin-right');
        marginVertical = getStyleDimensions(s, 'margin-top') + getStyleDimensions(s, 'margin-bottom');    
    }

    if (typeof el.getBoundingClientRect != 'undefined') {
        var rect = el.getBoundingClientRect();
        if (typeof rect.width != 'undefined' && typeof rect.height != 'undefined') {
            return {
                width: rect.width + marginHorizontal,
                height: rect.height + marginVertical,

                marginH: marginHorizontal,
                marginV: marginVertical
            }
        }
    }

    return {
        width: el.offsetWidth + marginHorizontal,
        height: el.offsetHeight + marginVertical,

        marginH: marginHorizontal,
        marginV: marginVertical
    }
}

module.exports = getElementOuterDimensions;