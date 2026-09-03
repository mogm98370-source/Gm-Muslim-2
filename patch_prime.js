const fs = require('fs');
let code = fs.readFileSync('src/lib/prime.ts', 'utf8');
code = code.replace(/hasAudio: false/g, 'hasAudio: true');
fs.writeFileSync('src/lib/prime.ts', code);
