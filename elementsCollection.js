var cloneAndAppend = require('./cloneAndAppend');

function isjQuery(obj) {
    // Pārbaudām vai ir globālais jQuery objekts
    if (typeof jQuery != 'undefined') {
        return obj instanceof jQuery;
    }

    if (obj && typeof obj.jquery != 'undefined') {
        return true;
    }

    return false;
}

/**
 * jQuery, DOM or array items collection
 */
function elementsCollection(items, minLength) {
    var mthis = this;

    this.items = [];

    if (isjQuery(items)) {
        items.each(function(i){
            mthis.items.push(this)
        });
    }
    else {
        // Pārtaisām par vienkārši masīvu. Ari nodeList tiek pārtaisīts par masīvu
        for (var i = 0; i < items.length; i++) {
            mthis.items.push(items[i])
        }
    }

    // Clone elements so list is at least minLength
}

elementsCollection.prototype = {
    each: function(cb) {
        for (var i = 0; i < this.items.length; i++) {
            cb(this.items[i], i);
        }
    },
    clone: function(minLength) {
        if (this.items.length <= 0) {
            return;
        }
        if (this.items.length >= minLength) {
            return;
        }

        let len = this.items.length;
        let parentNode = this.items[0].parentNode;
        // Dublējam visu elementu kopu kamēr kopējais elementus skaits nav lielāks par minLength
        while (this.items.length < minLength) {
            // klonējam tikai pirmos oriģinālos elementus
            for (var i = 0; i < len; i++) {
                this.items.push(cloneAndAppend(this.items[i], parentNode))
            }
        }
    }
}

module.exports = elementsCollection