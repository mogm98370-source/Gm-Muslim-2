const fs = require('fs');
let prayer = fs.readFileSync('src/components/home/PrayerWidget.tsx', 'utf8');
prayer = prayer.replace(/<!--/g, '<div');
fs.writeFileSync('src/components/home/PrayerWidget.tsx', prayer);
