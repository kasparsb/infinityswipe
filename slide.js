var getElementOuterDimensions = require('./getElementOuterDimensions');

function gv(obj, name, dv) {
    return typeof obj[name] == 'undefined' ? dv : obj[name]
}

function slide(el, index, xs) {
    // X pozīcijas
    if (typeof xs == 'undefined') {
        xs = {}
    }

    this.el = el;
    this.width = this.getWidth();
    this.index = index;

    this.x = gv(xs, 'x', 0);
    this.startX = gv(xs, 'startX', 0);
    this.realX = gv(xs, 'realX', 0);
}

slide.prototype = {
    getWidth() {
        return getElementOuterDimensions(this.el, true).width;
    },
    updateWidth: function() {
        this.width = this.getWidth();
    },
    /**
     * Atgriežam reālo X pozīciju. Ņemot vērā fizisko novietoju
     * un ņemot vērā offset nobīdījumu
     */
    getX: function() {
        return this.realX + this.x;
    }
}

module.exports = slide