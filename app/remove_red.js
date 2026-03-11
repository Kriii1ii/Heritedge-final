const Jimp = require('jimp');

function colorDist(c1, c2) {
    return Math.abs(c1.r - c2.r) + Math.abs(c1.g - c2.g) + Math.abs(c1.b - c2.b);
}

Jimp.read('/Users/kritikaacharya/HeritEgde/app/public/images/logo.png')
    .then(image => {
        const w = image.bitmap.width;
        const h = image.bitmap.height;

        // Exact background target color
        const target = { r: 63, g: 16, b: 26 };

        const cx = 511.5;
        const cy = 463;
        const circleRadius = 222;

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const c = Jimp.intToRGBA(image.getPixelColor(x, y));

                // If it's outside the protected golden circle
                const distToCenter = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
                if (distToCenter > circleRadius) {
                    const d = colorDist(c, target);
                    const softEdgeThreshold = 180; // wide blend 
                    if (d < softEdgeThreshold) {
                        // Calculate smooth alpha: d=0 -> alpha=0. d=threshold -> alpha=255.
                        let alpha = c.a;
                        if (d < 60) {
                            alpha = 0; // Pure background
                        } else {
                            alpha = Math.floor(((d - 60) / (softEdgeThreshold - 60)) * 255);
                        }
                        image.setPixelColor(Jimp.rgbaToInt(c.r, c.g, c.b, alpha), x, y);
                    }
                }
            }
        }

        image.write('/Users/kritikaacharya/HeritEgde/app/public/images/logo-transparent.png');
        console.log('Saved soft-blend transparent logo.');
    })
    .catch(err => {
        console.error(err);
    });
