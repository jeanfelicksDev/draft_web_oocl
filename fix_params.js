const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

walkDir('./app/api', function(filePath) {
    if (filePath.endsWith('route.ts')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let newContent = content;

        // Replace { params }: { params: { id: string } } with { params }: { params: Promise<{ id: string }> }
        newContent = newContent.replace(/\{ params \}: { params: { id: string } }/g, '{ params }: { params: Promise<{ id: string }> }');
        // Replace {params}: {params: {id: string}} with spaces combinations handling
        newContent = newContent.replace(/\{\s*params\s*\}\s*:\s*\{\s*params\s*:\s*\{\s*id\s*:\s*string\s*\}\s*\}/g, '{ params }: { params: Promise<{ id: string }> }');
        
        // Replace const { id } = params; with const { id } = await params;
        newContent = newContent.replace(/const\s+\{\s*id\s*\}\s*=\s*params;/g, 'const { id } = await params;');

        if (content !== newContent) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log(`Updated: ${filePath}`);
        }
    }
});
