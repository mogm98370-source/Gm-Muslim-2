const fs = require('fs');
let code = fs.readFileSync('src/components/redeem/Redeem.tsx', 'utf8');
code = code.replace(
  "import { doc, getDoc, writeBatch } from 'firebase/firestore';",
  "import { doc, getDoc, writeBatch, increment } from 'firebase/firestore';"
);
code = code.replace(
  "updateData.gmPoints = currentPoints + codeData.points;",
  "updateData.gmPoints = increment(codeData.points);"
);
code = code.replace(
  "updateData.totalEarnedPoints = currentTotal + codeData.points;",
  "updateData.totalEarnedPoints = increment(codeData.points);"
);
code = code.replace(
  "usedCount: codeData.usedCount + 1",
  "usedCount: increment(1)"
);
fs.writeFileSync('src/components/redeem/Redeem.tsx', code);
