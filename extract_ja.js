const fs = require('fs');
const path = require('path');

const jaRegex = /[ぁ-んァ-ン一-龥]/;

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        if (file.startsWith('node_modules') || file.startsWith('.git') || file.startsWith('.next')) return;
        file = path.resolve(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                const content = fs.readFileSync(file, 'utf-8');
                if (jaRegex.test(content)) {
                    results.push(file);
                }
            }
        }
    });
    return results;
}

const files = walk('.');
files.forEach(f => console.log(path.relative('.', f)));
