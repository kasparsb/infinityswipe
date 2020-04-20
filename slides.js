var getElementOuterDimensions = require('./getElementOuterDimensions');
var elementsCollection = require('./elementsCollection');
var slide = require('./slide');

var Slides = function(slides, viewportWidth, conf) {
    this.viewport = {}

    // Nākošā slide X pozīcija
    this.slidesCount = 0;

    this.slides = [];

    this.conf = conf;

    this.pagesCountCallback = conf.onPagesCount;

    this.slideAddCallbacks = [];
    if (this.conf && this.conf.onSlideAdd) {
        this.slideAddCallbacks.push(this.conf.onSlideAdd)
    }

    this.changeCallbacks = [];
    if (this.conf && this.conf.onSlidesChange) {
        this.changeCallbacks.push(this.conf.onSlidesChange)
    }

    this.afterPrepareSlidesCallbacks = [];
    if (this.conf && this.conf.onAfterPrepareSlides) {
        this.afterPrepareSlidesCallbacks.push(this.conf.onAfterPrepareSlides)
    }

    /**
     * Rāmja nobīdes no parent elementa, kurā pozicionēt slides
     * Pēc noklusējuma slides tiek pozicionēti pret parent kreiso malu, kas ir 0
     * Šo parametru jāvar mainīt
     * @todo Pašlaik tiek izmanots tikai left mala, bet jāvar norādīt arī right
     */
    this.boxOffset = {
        left: 0,
        right: 0
    }
    if (this.conf && this.conf.boxOffset && this.conf.boxOffset.left) {
        this.boxOffset.left = this.conf.boxOffset.left;
    }
    if (this.conf && this.conf.boxOffset && this.conf.boxOffset.right) {
        this.boxOffset.right = this.conf.boxOffset.right;
    }


    this.slidesElements = new elementsCollection(slides);

    this.setViewportWidth(viewportWidth);
    this.prepareSlides(this.slidesElements);
}

Slides.prototype = {

    prepareSlides: function(slides) {
        var mthis = this;

        /**
         * Ja ir absolūti pozicionēti elementi, visi viens virs
         * otra, tad šeit nopozicionējam vienu aiz otra
         */
        if (this.conf.positionItems) {
            this.positionItems();
        }
        

        slides.each(function(slide){
            
            mthis.push(slide)
        })

        this.addPageNumbers();

        this.balanceSlides();

        this.pagesCountCallback(this.getMaxPage());
        this.executeChangeCallbacks(this.slides);

        this.executeAfterPrepareSlidesCallbacks(this);
    },

    /**
     * @todo šito vajag uztaisīt
     * Izkārtojam absolūti pozicionētos elementus vienu aiz otra
     */
    positionItems: function() {
        var mthis = this;
        var x = 0;
        this.slidesElements.each(function(el){
            el.style.left = x+'px';

            x = x + getElementOuterDimensions(el).width + mthis.getSlidesPadding();
        })
    },

    reset: function() {
        this.slides = [];
        this.prepareSlides(this.slidesElements);
    },

    setViewportWidth: function(width) {
        this.viewport.width = width;
    },

    setBoxOffset: function(offset) {
        this.boxOffset = offset;
    },

    resize: function() {

        /**
         *
         * @todo Varbūt vajag kaut kā inteliģentāk pārrēķināt
         * Jāņem vērā tekošais slides index
         * jo lietotājs var būt aizskrolējis ļoti tālu
         *
         */
        this.reset();

    },

    /**
     * Rādām slide ar padoto index
     * tākā šis ir infinity slide, tad attiecīgi index var būt jebkāds
     * padotais index tiek pārrēķināts uz reālo slide index. Jo slides
     * skaits ir ierobežots un tie tiek reused
     *
     * Fiziski pārvietojam padoto index uz sākumu. 
     * Visus pārējs slides pakārtojam padotajam slide index
     */
    showByIndex: function(index) {
        // Sagatvojas slide priekš pārvietošanas
        this.start();

        // Pēc padotā index atrodam reālo slide index
        var realIndex = index % this.slidesCount;

        /**
         * Tagad meklējam slide, kuram atbilst realIndex un 
         * pieglabājam slide indeksu masīvā
         */
        var fi;
        for (var i = 0; i < this.slidesCount; i++) {
            if (this.slides[i].indexReal == realIndex) {
                fi = i;
                break;
            }
        }

        /**
         * Norādīto slide liekam kā pašu pirmo vizuāli.
         * Visus slides, kas ir aiz tā izkārtojam secīgi
         */
        var xOffset = this.boxOffset.left;
        for (var i = 0; i < this.slidesCount; i++) {
            this.slides[fi].x = (-this.slides[fi].xReal) + xOffset;
            this.slides[fi].index = index;

            // Palielinām par slide platumu + padding
            xOffset += this.slides[fi].width + this.getSlidesPadding();

            // Atjaunojam css un izpildām callabacks
            this.slides[fi].updateCss();
            this.executeSlideAddCallbacks(this.slides[fi].index, this.slides[fi].el, this.slides[fi]);

            // Visiem slaidiem pielabojam indekss secīgi
            index++;

            /**
             * Pārejam pie nākošā slide. Kad sasniegtas masīva beigas, tad 
             * metam ripā un sākam no masīva sākuma
             */
            fi++;
            if (fi == this.slidesCount) {
                fi = 0;
            }
        }

        var mthis = this;

        this.balanceSlides(function(){
            mthis.executeChangeCallbacks(mthis.slides);
        });
    },

    /**
     * Atgriežam slide pēc kārtas numura redzamājā daļā
     */
    getByIndex: function(index) {
        for (var i = 0; i < this.slidesCount; i++) {
            if (this.slides[i].index === index) {
                return this.slides[i];
            }
        }

        return false;
    },

    /**
     * Pieeja pirmajam slide
     */
    first: function() {
        return this.slides[0];
    },

    /**
     * Pieeja pēdējam slide
     */
    last: function() {
        if (this.slidesCount > 0) {
            return this.slides[this.slidesCount-1];
        }

        return false;
    },

    /**
     * Atgriežam slide, kurš vizuāli ir pats pēdējais
     * Vizuāli pret viewport
     */
    visualLast: function() {
        var r = 0;
        for (var i = 0; i < this.slidesCount; i++) {
            if (this.slides[r].getX() < this.slides[i].getX()) {
                r = i;
            }
        }
        return this.slides[r];
    },

    /**
     * Atgriežam slide, kurš vizuāli ir pats pirmais
     */
    visualFirst: function() {
        var r;
        for (var i = 0; i < this.slidesCount; i++) {
            if (typeof r == 'undefined' || this.slides[r].getX() > this.slides[i].getX()) {
                r = i;
            }
        }
        return this.slides[r];
    },    

    nextIndex: function() {
        if (this.last()) {
            return this.last().index + 1;
        }

        return 0;
    },

    nextXReal: function() {
        if (this.last()) {
            return this.last().xReal + this.last().width + this.getSlidesPadding();
        }

        return 0;
    },

    /**
     * Saskaitām cik elementu ir ārpus viewport no labās puses
     */ 
    slidesCountAfterViewport: function() {
        var r = 0;
        for (var i = 0; i < this.slidesCount; i++) {
            if (this.slides[i].getX() > this.viewport.width) {
                r++;
            }
        }

        return r;
    },

    /**
     * Saskaitām cik elementu ir ārpus viewport no labās puses
     */ 
    slidesCountBeforeViewport: function() {
        var r = 0;
        for (var i = 0; i < this.slidesCount; i++) {
            if (this.slides[i].getX() + this.slides[i].width < 0) {
                r++;
            }
        }

        return r;
    },

    /**
     * Pievienojam elementu masīva beigās
     */
    push: function(el) {
        this.pushWithIndex(el, this.nextIndex());
    },

    pushWithIndex: function(el, index) {
        var s = new slide(el, index, {
            // Saglabājam reālo x pozīciju
            xReal: this.nextXReal()
        })
        
        this.slidesCount = this.slides.push(s);

        s.updateCss();

        this.executeSlideAddCallbacks(this.last().index, this.last().el, this.last());
    },

    /**
     * Uzsākot kustību pieglabājam katra slide startX
     */
    start: function() {
        this.slides.map(function(s){
            s.start();
        }) 
    },
    
    /**
     * Katram slide ir savs x
     * Uzliekam x offset, bet pašu x nemainām
     */
    setXOffset: function(offset) {

        for (var i = 0; i < this.slidesCount; i++) {
            this.slides[i].setXOffset(offset);
            this.slides[i].updateCss();
        }

        var mthis = this;
        this.balanceSlides(function(){
            mthis.executeChangeCallbacks(mthis.slides);
        });
    },

    /**
     * Pārvietojam pēdējo slaidu rindā uz rindas sākumu
     */
    moveLastToFirst: function() {
        var slide = this.visualLast();

        var firstSlide = this.visualFirst();

        var w = slide.width + this.getSlidesPadding();

        // Samazinām index. Reālo indekss neaiztiekam
        slide.index = firstSlide.index - 1;

        slide.x = (firstSlide.xReal - (slide.xReal + w)) + firstSlide.x

        slide.updateCss();

        this.executeSlideAddCallbacks(slide.index, slide.el, slide);
    },

    /**
     * Vizuāli pārvietojam pirmo slaid uz beigām
     */
    moveFirstToLast: function() {
        var slide = this.visualFirst();

        var lastSlide = this.visualLast();

        var w = lastSlide.width + this.getSlidesPadding();
        
        // Palielinām index. Reālo indekss neaiztiekam
        slide.index = lastSlide.index + 1;
        
        slide.x = ((lastSlide.xReal + w) - slide.xReal) + lastSlide.x;

        slide.updateCss();

        this.executeSlideAddCallbacks(slide.index, slide.el, slide);
    },

    balanceSlides: function(onChangeCb) {
        if (!this.conf.rotateItems) {
            return;
        }

        // Balansējam tikai, ja viewport.width > 0
        if (this.viewport.width <= 0) {
            return;
        }

        var hasChanged = false;
        // Balansējam 4 reizes. Normālā gadījumā jāpietiek ar vienu reizi
        for (var t = 0; t < 4; t++) {
            if (this.balanceOnce()) {
                hasChanged = true;
            }
        }

        // Paziņojam tikai, ja ir bijušas izmaiņas
        if (hasChanged && onChangeCb) {
            onChangeCb();
        }
    },

    /**
     * Balansējam vienu reizi, overflow elementus sadalot vienādi pa left un right pusēm
     *
     * @todo Šādi īsti nav optimāli. Jo nobalansējot joprojām paliek situācija, kad
     * vienā pusē trūkst, bet otrā ir par daudz.
     * Ar šo metodi darīsim vēlreiz kamēr abās pusēs būs vienādies
     * Vajag kaut kā gudrāk, lai uzreiz pārvieto uz to pusi kurai trūks
     * Sarežģijums rodas, tad, kad slides ir dažāda platuma
     *
     * @param int Max balancēšanas piegājienu skaits
     */
    balanceOnce: function() {
        var b = this.slidesCountBeforeViewport();
        var a = this.slidesCountAfterViewport();

        /**
         * Aprēķinām starpību starp items pirms un pēc. Dala ar divi
         * Apaļojam uz leju
         * Atkarībā no tā vai d > 0 vai d < 0 noteiksim virzienu, kurā pārvietot slaidus
         */
        var d = Math.floor((a - b) / 2);

        // Ja nav neviena slaida, ko pārvietot, tad bail
        if (Math.abs(d) < 1) {
            return false;
        }

        /**
         * Ja d < 0, tad pārvietojam no beigām uz sākumu
         * Ja d > 0, tad pārvietojam no sākuma uz beigām
         */
        var method = d < 0 ? 'moveFirstToLast' : 'moveLastToFirst';

        d = Math.abs(d);
        for (var i = 0; i < d; i++) {
            this[method]();
        }

        // Atgriežam true, ja ir kaut viens slide balansēts
        return d > 0;
    },

    executeSlideAddCallbacks: function() {
        for (var i = 0; i < this.slideAddCallbacks.length; i++) {
            this.slideAddCallbacks[i].apply(this, arguments);
        }
    },

    executeChangeCallbacks: function() {
        for (var i = 0; i < this.changeCallbacks.length; i++) {
            this.changeCallbacks[i].apply(this, arguments);
        }
    },

    /**
     * After execution of this.prepareSlides
     */
    executeAfterPrepareSlidesCallbacks: function() {
        for (var i = 0; i < this.afterPrepareSlidesCallbacks.length; i++) {
            this.afterPrepareSlidesCallbacks[i].apply(this, arguments);
        }
    },

    getSlidesPadding: function() {
        return this.conf.slidesPadding();
    },

    /**
     * Sakārtojam slaides pēc vizuālā izkārtojuma
     */
    getSortedVisual: function(direction) {
        var r = [];
        for (var i = 0; i < this.slidesCount; i++) {
            r.push(this.slides[i]);
        }

        return r.sort(function(a, b){
            if (a.getX() < b.getX()) {
                return direction == 'asc' ? -1 : 1;
            }
            else if (a.getX() > b.getX()) {
                return 0;
            }
            else if (a.getX() > b.getX()) {
                return direction == 'asc' ? 1 : -1;
            }
        })
    },

    isBetweenX: function(slide, x1, x2) {
        if (slide.getX() > x1 && slide.getX() < x2) {
            return true;
        }
    },

    /**
     * Find slide by dom element
     */
    findByDomElement: function(el) {
        for (var i = 0; i < this.slidesCount; i++) {
            if (this.slides[i].el === el || this.slides[i].el.contains(el)) {
                return this.slides[i];
            }
        }
        return false;
    },

    /**
     * Meklējam pirmo slide starp padotajām x koordinātēm
     * @searchDirection meklēšanas virziens ASC vai DESC
     */
    findBetweenX: function(x1, x2, searchDirection) {

        // Meklējam pēc sakārtotiem pēc vizuālā izkārtojuma
        var r = this.getSortedVisual(searchDirection);

        for (var i = 0; i < r.length; i++) {
            if (this.isBetweenX(r[i], x1, x2)) {
                // Atgriežam slide instanci no īstā slides masīva
                return this.slides[r[i].indexReal];
            }
        }
        
        return undefined;
    },

    /**
     * Atrodam slide, kura getX ir viss tuvāk x no kreisās puses
     */
    findClosestToX: function(x) {
        var r;
        for (var i = 0; i < this.slidesCount; i++) {
            if (typeof r == 'undefined') {
                r = i;
                continue;
            }

            var d1 =  Math.abs(x - this.slides[i].getX());
            var d2 =  Math.abs(x - this.slides[r].getX());

            // Izlaižam visus, kas ir lielāki par x
            if (d1 < d2) {
                r = i;
            }
        }
        return this.slides[r];
    },

    /**
     * Atrodam slide, kura getX ir viss tuvāk x no kreisās puses
     */
    findClosestToXFromLeft: function(x) {
        var r;
        for (var i = 0; i < this.slidesCount; i++) {
            // Izlaižam visus, kas ir lielāki par x
            if (this.slides[i].getX() > x) {
                continue;
            }
            if (typeof r == 'undefined' || this.slides[r].getX() < this.slides[i].getX()) {
                r = i;
            }
        }
        return this.slides[r];
    },

    /**
     * Atrodam nākošo offsetX aiz norādītā x
     */
    findClosestToXFromRight: function(x) {
        var r;
        for (var i = 0; i < this.slidesCount; i++) {
            // Izlaišam visus, kas ir lielāki par x
            if (this.slides[i].getX() < x) {
                continue;
            }
            if (typeof r == 'undefined' || this.slides[r].getX() > this.slides[i].getX()) {
                r = i;
            }
        }
        return this.slides[r];
    },

    findFirstBetweenX: function(x1, x2) {
        return this.findBetweenX(x1, x2, 'asc');
    },

    findLastBetweenX: function(x1, x2) {
        return this.findBetweenX(x1, x2, 'desc');  
    },

    /**
     * Pievienojam katram slaid lapas numuru, kurā tas iekrīt
     */
    addPageNumbers: function() {
        var page = 1, t = 0;

        for (var i = 0; i < this.slidesCount; i++) {

            this.slides[i].pageReal = page;
            this.slides[i].page = page;
        
            t += (this.slides[i].width + this.getSlidesPadding());

            // Nedaudz smaziām viewport platumu, lai lapā netiktu ieskaitīts
            // slide, kuram tikai daži pikseļi ir lapā
            if (t >= this.viewport.width - 4) {
                page++;
                t = 0;
            }
        }
    },

    /**
     * Saskaitām cik lapās var sadalīt visus slaidus
     * Lapa ir tad, kad to piepilda vairāki slaidi
     * Lapā var būt 1 vai vairāki slaidi
     */
    getMaxPage: function() {
        var r = 1;

        for (var i = 0; i < this.slidesCount; i++) {
            if (this.slides[i].pageReal > r) {
                r = this.slides[i].pageReal;
            }
        }

        return r;
    }
}

module.exports = Slides;