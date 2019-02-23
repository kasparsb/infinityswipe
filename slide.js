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
    /**
     * Šis ir reālais slide indekss. Ir ierobežots skaits ar slaidiem
     */
    this.indexReal = index;
    /**
     * Šis ir indekss, kad notiek bezgalīgā swaipošana. Slaidi tiek pārlikti viens aiz otra
     * Līdz ar to indekss bezgalīgi palielinās. Jo tas slaids, kas bija pats pirmais vienā
     * mirklī tiek pārvietos uz pašām beigām un šajā mirklī mainās slaida indekss
     */
    this.index = index;

    this.pageReal = 0;
    this.page = 0;

    // Reālā x pozīcija parent elementā
    this.xReal = gv(xs, 'xReal', 0);

    // Uzstādītā x nobīde. Tad, kad vajag pārvietot citā vietā
    this.x = gv(xs, 'x', 0);

    // Handle move offseti
    this.xOffset = gv(xs, 'xOffset', 0);
}

slide.prototype = {
    getWidth: function() {
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
    /**
     * Tas pats, kas getX, tikai bez move offset
     * Tā ir x pozīcija pirms notika slide move darbība
     * Kamēr notiek move kūstība tiek mainīts offsetX un tas
     * tiek pielikts pie slide x pozīcijas.
     * Šis x ir tāds, ja kustība nebūtu bijusi
     */
    getXWithoutOffset: function() {
        return this.xReal + this.x;
    },
    start: function() {
        // Nofiksējam rēalo x nobīdi
        this.x = this.x + this.xOffset;

        // Temp x offsetu nonullējam
        this.xOffset = 0;
    }
}

module.exports = slide