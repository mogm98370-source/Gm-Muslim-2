const fs = require('fs');

let prayer = fs.readFileSync('src/components/home/PrayerWidget.tsx', 'utf8');
prayer = prayer.replace(/format12Hour\(time\)/g, 'format12Hour(time as string)');
fs.writeFileSync('src/components/home/PrayerWidget.tsx', prayer);

let lead = fs.readFileSync('src/components/leaderboard/Leaderboard.tsx', 'utf8');
lead = lead.replace(/primeInfo\.bgClass/g, 'primeInfo.frameClass');
fs.writeFileSync('src/components/leaderboard/Leaderboard.tsx', lead);
