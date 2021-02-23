module.exports = function(sourceEl, parent) {
    let r = sourceEl.cloneNode(true);
    parent.appendChild(r);
    return r;
}