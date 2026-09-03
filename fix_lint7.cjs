const fs = require('fs');
let lead = fs.readFileSync('src/components/leaderboard/Leaderboard.tsx', 'utf8');
lead = lead.replace(/pLevel\.bgClass/g, 'pLevel.frameClass');
fs.writeFileSync('src/components/leaderboard/Leaderboard.tsx', lead);
