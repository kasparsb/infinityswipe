function replaceContent(el, content) {
    el.innerHTML = '';

    if (typeof content === 'string' || typeof content === 'number' || typeof content === 'undefined' || content === null) {
        el.appendChild(document.createTextNode((typeof content === 'undefined' || content === null) ? '' : content));
    }
    else {
        el.appendChild(content);
    }
}

module.exports = replaceContent