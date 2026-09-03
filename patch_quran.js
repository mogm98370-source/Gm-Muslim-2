const fs = require('fs');
let code = fs.readFileSync('src/components/quran/SurahView.tsx', 'utf8');

// I will just use sed or rewrite the file, sed is safer for small patches.
