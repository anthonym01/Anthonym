
/* Random numeber for playback selection */
function rand_number(max, min, cant_be) {
    let randowm = Math.floor(Math.random() * (max - min + 1)) + min;
    if (randowm == cant_be) {
        return rand_number(max, min, cant_be);
    } else {
        return randowm;
    }
}

function isElementInViewport(el) {

    var rect = el.getBoundingClientRect();

    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && /* or $(window).height() */
        rect.right <= (window.innerWidth || document.documentElement.clientWidth) /* or $(window).width() */
    );
}

module.exports = {
    rand_number,
    isElementInViewport
}