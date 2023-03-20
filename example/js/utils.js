
function bin2dec(bin) {
    return parseInt(bin, 2)
}

function dec2bin(dec) {
    let val = (dec >>> 0).toString(2);
    // Pad zeros on the front
    let zero_count = 32 - val.length
    for (let i=0; i<zero_count; i++)
        val = "0" + val
    return val
}

// Do NOT import this if you are using JQuery
// Shorthand
function $(elem) {
    return document.querySelector(elem)
}

export { bin2dec, dec2bin, $ }