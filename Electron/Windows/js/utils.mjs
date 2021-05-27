export function rand_number(max, min, cant_be) {
    let randowm = Math.floor(Math.random() * (max - min + 1)) + min;
    if (randowm == cant_be) {
        return rand_number(max, min, cant_be);
    } else {
        return randowm;
    }
}
