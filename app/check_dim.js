const Jimp = require('jimp');

Jimp.read('/Users/kritikaacharya/HeritEgde/app/public/images/logo.png')
    .then(image => {
        const w = image.bitmap.width;
        const h = image.bitmap.height;
        console.log(`Dimensions: ${w}x${h}`);
        console.log(`Center (y=${h / 4 * 2}) color:`, Jimp.intToRGBA(image.getPixelColor(w / 2, h / 2)));
    })
    .catch(err => {
        console.error(err);
    });
