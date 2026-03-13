const fs = require('fs');

function getPNGDimensions(path) {
    const data = fs.readFileSync(path);
    if (data.toString('ascii', 1, 4) !== 'PNG') return null;
    const width = data.readUInt32BE(16);
    const height = data.readUInt32BE(20);
    return { width, height };
}

const oocl = getPNGDimensions('c:/Users/HP/AntiGravity/draft_web_oocl/public/logo-oocl.png');
const agl = getPNGDimensions('c:/Users/HP/AntiGravity/draft_web_oocl/public/logo-agl.png');

console.log('OOCL:', oocl);
console.log('AGL:', agl);
