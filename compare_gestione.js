import fs from 'fs';
const oldC = fs.readFileSync('old_gestione.tsx', 'utf8').split('\n');
const newC = fs.readFileSync('src/pages/Gestione.tsx', 'utf8').split('\n');

for (let i = 0; i < oldC.length; i++) {
    if (oldC[i].includes('export default function Gestione')) console.log('Found function start');
    if (oldC[i].match(/<div className="flex-grow/)) console.log(`Old flex-grow started at ${i + 1}`);
}
