const fs = require('fs');
let code = fs.readFileSync('src/components/leaderboard/Leaderboard.tsx', 'utf8');

code = code.replace(/<h4 className=\{cn\([\s\S]*?<\/h4>/g, '<GMName userObj={u} className="text-lg" />');

fs.writeFileSync('src/components/leaderboard/Leaderboard.tsx', code);
