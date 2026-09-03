const fs = require('fs');
const glob = require('glob');

const files = [
  'src/App.tsx',
  'src/components/admin/Admin.tsx',
  'src/components/admin/PointModal.tsx',
  'src/components/auth/Login.tsx',
  'src/components/auth/Register.tsx',
  'src/components/home/PrayerWidget.tsx',
  'src/components/leaderboard/Leaderboard.tsx',
  'src/components/mail/Mail.tsx',
  'src/components/profile/Profile.tsx',
  'src/components/quran/SurahAudioPlayer.tsx',
  'src/components/redeem/Redeem.tsx',
  'src/context/AuthContext.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes("import React") && !content.includes("import * as React")) {
    content = "import React from 'react';\n" + content;
  }
  fs.writeFileSync(file, content);
}

// Fix PrayerWidget TS
let prayerWidget = fs.readFileSync('src/components/home/PrayerWidget.tsx', 'utf8');
prayerWidget = prayerWidget.replace("Object.entries(times).find(([k, v]) =>", "Object.entries(times).find(([k, v]: [string, any]) =>");
prayerWidget = prayerWidget.replace("if (AlertCircle) {", "");
prayerWidget = prayerWidget.replace("<AlertCircle size={48} className=\"text-red-400 mb-4\" />", "");
prayerWidget = prayerWidget.replace("getTimeUntil(activePrayer.time)", "getTimeUntil(activePrayer.time as string)");
fs.writeFileSync('src/components/home/PrayerWidget.tsx', prayerWidget);

// Fix Leaderboard TS
let leaderboard = fs.readFileSync('src/components/leaderboard/Leaderboard.tsx', 'utf8');
leaderboard = leaderboard.replace("primeInfo.bgClass", "primeInfo.frameClass");
fs.writeFileSync('src/components/leaderboard/Leaderboard.tsx', leaderboard);

// Fix Mail TS
let mail = fs.readFileSync('src/components/mail/Mail.tsx', 'utf8');
mail = mail.replace("new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()", "new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()");
fs.writeFileSync('src/components/mail/Mail.tsx', mail);

