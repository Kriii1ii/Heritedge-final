const fs = require('fs');
const path = require('path');

const viewsDir = path.join(__dirname, 'views');

function processDirectory(dir) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.ejs')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let original = content;

            // Make boxes less rounded and sharper
            content = content.replace(/\brounded-3xl\b/g, 'rounded-sm')
                .replace(/\brounded-2xl\b/g, 'rounded-sm')
                .replace(/\brounded-xl\b/g, 'rounded-sm')
                .replace(/\brounded-lg\b/g, 'rounded-md');

            if (original !== content) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated ${fullPath}`);
            }
        }
    });
}

processDirectory(viewsDir);
