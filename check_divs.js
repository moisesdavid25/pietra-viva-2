const fs = require('fs');

const code = fs.readFileSync('src/pages/Gestione.tsx', 'utf8');

let stack = [];
let lines = code.split('\n');
let result = [];

for (let i = 0; i < lines.length; i++) {
    const minMatch = lines[i].match(/<div[^>]*className="[^"]*min-h-screen[^"]*"[^>]*>/);
    const flexGrowMatch = lines[i].match(/<div[^>]*className="[^"]*flex-grow[^"]*"[^>]*>/);
    const closeDivMatch = lines[i].match(/<\/div>/g);
    const openDivMatch = lines[i].match(/<div\b[^>]*>/g);

    if (minMatch) {
        stack.push({ type: 'min-h-screen', line: i + 1 });
        result.push(`Line ${i + 1}: OPEN min-h-screen`);
    } else if (flexGrowMatch) {
        stack.push({ type: 'flex-grow', line: i + 1 });
        result.push(`Line ${i + 1}: OPEN flex-grow`);
    } else if (openDivMatch && !minMatch && !flexGrowMatch) {
        openDivMatch.forEach(() => {
            stack.push({ type: 'div', line: i + 1 });
        });
    }

    if (closeDivMatch) {
        closeDivMatch.forEach(() => {
            if (stack.length > 0) {
                const popped = stack.pop();
                if (popped.type === 'min-h-screen' || popped.type === 'flex-grow') {
                    result.push(`Line ${i + 1}: CLOSE ${popped.type} (Opened at ${popped.line})`);
                }
            }
        });
    }
}

console.log(result.join('\n'));
