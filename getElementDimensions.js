function getStyleDimensions(style, name) {
    return parseInt(style.getPropertyValue(name), 10);
}

function getElementDimensions(el) {
    var s = getComputedStyle(el);

    // Noņemam border width
    var borderHorizontal = getStyleDimensions(s, 'border-left-width') + getStyleDimensions(s, 'border-right-width');
    var borderVertical = getStyleDimensions(s, 'border-top-width') + getStyleDimensions(s, 'border-bottom-width');

    // Noņemam padding width
    var paddingHorizontal = getStyleDimensions(s, 'padding-left') + getStyleDimensions(s, 'padding-right');
    var paddingVertical = getStyleDimensions(s, 'padding-top') + getStyleDimensions(s, 'padding-bottom');

    if (typeof el.getBoundingClientRect != 'undefined') {
        if (typeof el.getBoundingClientRect().width != 'undefined' && typeof el.getBoundingClientRect().height != 'undefined') {
            return {
                width: el.getBoundingClientRect().width - borderHorizontal - paddingHorizontal,
                height: el.getBoundingClientRect().height - borderVertical - paddingVertical
            }
        }
    }

    return {
        width: el.offsetWidth - borderHorizontal - paddingHorizontal,
        height: el.offsetHeight - borderVertical - paddingVertical
    }
}

module.exports = getElementDimensions;