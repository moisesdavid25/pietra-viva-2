import fs from 'fs';

const code = fs.readFileSync('src/pages/Gestione.tsx', 'utf8');
const lines = code.split('\n');
let depth = 0;
let results = [];

for (let i = 125; i < lines.length; i++) {
    const line = lines[i];
    const openDivs = (line.match(/<div\b[^>]*>/g) || []).length;
    const closeDivs = (line.match(/<\/div>/g) || []).length;
    const openFragment = (line.match(/<>/g) || []).length;
    const closeFragment = (line.match(/<\/>/g) || []).length;

    if (line.includes('flex flex-col antialiased')) {
        results.push(`Main wrapper opened at line ${i + 1}`);
    }
    if (line.includes('flex-grow px-4')) {
        results.push(`flex-grow wrapper opened at line ${i + 1}`);
    }

    depth += openDivs - closeDivs + openFragment - closeFragment;

    if (closeDivs > 0 && depth === 1) { // 1 means only fragment open
        results.push(`Found div close reaching depth 1 at line ${i + 1}`);
    }
    if (closeDivs > 0 && depth === 2) {
        results.push(`Found div close reaching depth 2 at line ${i + 1}`);
    }
}

console.log(results.join('\n'));
