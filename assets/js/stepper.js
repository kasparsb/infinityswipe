//var Bezier = require('./bezier1.js');
var Bezier = require('./bezier2.js');

var Stepper = function() {
    this.defaultBezierCurve = [0,0,1,1];
    this.precision = 10000000;
    this.progress = 0;
    this.current = 0;
}

Stepper.prototype = {
    run: function(duration, bezierCurve, stepCb, doneCb) {
        this.stepCallback = stepCb;
        this.doneCallback = doneCb

        this.easing = this.getEasing(bezierCurve);

        this.duration = isNaN(duration) ? 0 : duration;
        this.current = 0;

        this.start();
        this.step();
    },

    /**
     * Run from given progress
     */
    runFrom: function(progress, duration, bezierCurve, stepCb, doneCb) {
        this.stepCallback = stepCb;
        this.doneCallback = doneCb

        this.easing = this.getEasing(bezierCurve);

        /**
         * Šeit ir svarīgs moments
         * Padotais progress ir tāds, kādu gribam
         * bet easing aprēķinātais progress esošajā progress ir savādāk, jo 
         * tas ir curve un tas nav lineārs
         * Tāpēc šeit atrodam kādam ir jābūt progresam pēc easing
         */
        progress = this.findStartProgress(progress, 0.1, 0, 1);
        
        this.duration = duration;

        this.startTime = +new Date();
        // Simulējam startTime, tā lai tas būtu sācies pirms norādītā progress
        this.startTime -= (duration * progress);
        // Turpinām no padotā progress
        this.progress = progress;


        this.step();
    },

    /**
     * Meklējam kādam ir jābūt progress, lai pēc easing.get tas būt tāds pats kā progress
     */
    findStartProgress: function(progress, step, from, to, inceptionLevel) {

        if (typeof inceptionLevel == 'undefined') {
            inceptionLevel = 0;
        }
        
        var d = from, prevR = 0, prevD;

        while (d < to) {
            // Lai ir lielāka precizītāte
            if (inceptionLevel++ > 40) {
                return d;
            }

            r = this.easing.get(d);

            if (Math.round(progress*this.precision) == Math.round(r*this.precision)) {
                return d;
            }

            if (this.isBetween(progress, prevR, r)) {
                return this.findStartProgress(progress, step/10, prevD, d, inceptionLevel);
            }

            prevD = d;
            prevR = r;
            d += step;
        }

        return d;
    },

    /**
     * Is a between x1 and x2
     */
    isBetween: function(a, x1, x2) {
        if (x2 > x1) {
            return a > x1 && a < x2;
        }
        return a > x2 && a < x1;
    },

    /**
     * Piefiksējam sākuma laiku
     */
    start: function() {
        this.startTime = +new Date();
        this.progress = 0;
    },

    done: function() {
        this.doneCallback();
    },

    step: function() {
        var mthis = this;


        // if (this._prevTime) {
        //     log('stepper.step', Math.round(window.performance.now() - this._prevTime));
        // }
        // this._prevTime = window.performance.now();


        mthis.trackProgress();

        if (this.current < this.startTime + this.duration) {

            this.stepCallback(this.progress);

            requestAnimationFrame(function(){
                mthis.step()
            });
        }
        else {
            this.stepCallback(1);

            this.done();
        }
    },

    trackProgress: function() {
        // Current time
        this.current = +new Date();

        var delta = this.current - this.startTime;

        // Animation progress in precents
        this.progress = this.easing.get(delta / this.duration);

        //this.progress = Math.round(this.progress*this.precision)/this.precision;
    },

    getEasing: function(bezierCurve) {
        if (!(bezierCurve && bezierCurve.length && bezierCurve.length == 4)) {
            bezierCurve = this.defaultBezierCurve;
        }
        return new Bezier(bezierCurve[0], bezierCurve[1], bezierCurve[2], bezierCurve[3]);
    }
}

module.exports = Stepper;