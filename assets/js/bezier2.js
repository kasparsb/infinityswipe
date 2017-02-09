var b = function(p1x, p1y, p2x, p2y) {
    // Calculate the polynomial coefficients, implicit first and last control points are (0,0) and (1,1).
    var cx = 3.0 * p1x;
    var bx = 3.0 * (p2x - p1x) - cx;
    var ax = 1.0 - cx -bx;
         
    var cy = 3.0 * p1y;
    var by = 3.0 * (p2y - p1y) - cy;
    var ay = 1.0 - cy - by;

    var epsilon = 0.00001;

    function sampleCurveDerivativeX(t) {
        return (3.0 * ax * t + 2.0 * bx) * t + cx;
    }

    function sampleCurveX(t) {
        // `ax t^3 + bx t^2 + cx t' expanded using Horner's rule.
        return ((ax * t + bx) * t + cx) * t;
    }

    function sampleCurveY(t) {
        return ((ay * t + by) * t + cy) * t;
    }

    // Given an x value, find a parametric value it came from.
    function solveCurveX(x)
    {
        var t0, t1, t2, x2, d2, i;

        // First try a few iterations of Newton's method -- normally very fast.
        for (t2 = x, i = 0; i < 8; i++) {
            x2 = sampleCurveX(t2) - x;
            if (Math.abs(x2) < epsilon) {
                return t2;
            }
            d2 = sampleCurveDerivativeX(t2);
            if (Math.abs(d2) < 1e-6) {
                break;
            }
            t2 = t2 - x2 / d2;
        }

        // Fall back to the bisection method for reliability.
        t0 = 0.0;
        t1 = 1.0;
        t2 = x;

        if (t2 < t0) {
            return t0;
        }
        if (t2 > t1) {
            return t1;
        }

        while (t0 < t1) {
            x2 = sampleCurveX(t2);
            if (Math.abs(x2 - x) < epsilon) {
                return t2;
            }
            if (x > x2) {
                t0 = t2;
            }
            else {
                t1 = t2;
            }
            t2 = (t1 - t0) * .5 + t0;
        }

        // Failure.
        return t2;
    }

    this.get = function(x) {
        return sampleCurveY(solveCurveX(x));
    }
}

module.exports = b;