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

    // Reālā x pozīcija parent elementā
    this.xReal = gv(xs, 'xReal', 0);

    // Uzstādītā x nobīde. Tad, kad vajag pārvietot citā vietā
    this.x = gv(xs, 'x', 0);

    // Handle move offseti
    this.xOffset = gv(xs, 'xOffset', 0);
}

slide.prototype = {
    getWidth() {
        return getElementOuterDimensions(this.el, true).width;
    },
    updateWidth: function() {
        this.width = this.getWidth();
    },
    /**
     * Pozicionējam elementu
     * x pozīcija veidojas no tekošās x nobīdes + uzstādītā X nobīde
     */
    updateCss: function() {
        this.el.style.transform = 'translate3d('+(this.x + this.xOffset)+'px,0,0)'
    },
    setXOffset: function(v) {
        this.xOffset = v
    },
    /**
     * Atgriežam reālo X pozīciju. Ņemot vērā fizisko novietoju
     * un ņemot vērā offset nobīdījumu
     */
    getX: function() {
        return this.xReal + this.x + this.xOffset;
    },
    start: function() {
        // Nofiksējam rēalo x nobīdi
        this.x = this.x + this.xOffset;

        // Temp x offsetu nonullējam
        this.xOffset = 0;
    }
}

module.exports = slide