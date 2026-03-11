const Jimp = require('jimp');

function colorDist(c1, c2) {
    return Math.abs(c1.r - c2.r) + Math.abs(c1.g - c2.g) + Math.abs(c1.b - c2.b);
}

Jimp.read('/Users/kritikaacharya/HeritEgde/app/public/images/logo.png')
    .then(image => {
        const w = image.bitmap.width;
        const h = image.bitmap.height;

        const target = { r: 63, g: 16, b: 26 };
        let firstNonBgY = -1;
        let lastNonBgY = -1;
        let firstNonBgX = -1;
        let lastNonBgX = -1;

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const c = Jimp.intToRGBA(image.getPixelColor(x, y));
                if (colorDist(c, target) > 40) { // Not maroon background
                    if (firstNonBgY === -1) firstNonBgY = y;
                    lastNonBgY = y;
                    if (firstNonBgX === -1 || x < firstNonBgX) firstNonBgX = x;
                    if (lastNonBgX === -1 || x > lastNonBgX) lastNonBgX = x;
                }
            }
        }
        console.log(`Foreground bounds: X(${firstNonBgX} to ${lastNonBgX}), Y(${firstNonBgY} to ${lastNonBgY})`);

        const cx = w / 2; // It's probably perfectly centered X.

        // We want to replace maroon pixels outside the circle.
        // Let's find where the circle ends and text begins by scanning a vertical line down from center.
        let textStartY = h;
        for (let y = h - 1; y > firstNonBgY; y--) {
            // Look for a gap indicating space between circle and text
            let isRowBg = true;
            for (let x = firstNonBgX; x <= lastNonBgX; x++) {
                const c = Jimp.intToRGBA(image.getPixelColor(x, y));
                if (colorDist(c, target) > 40) {
                    isRowBg = false;
                    break;
                }
            }
            if (isRowBg && lastNonBgY - y < 300) { // If there's an all-background row near the bottom
                textStartY = y;
            }
        }
        console.log(`Text seemingly starts below Y=${textStartY}`);
    })
