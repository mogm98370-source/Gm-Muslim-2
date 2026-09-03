const fs = require('fs');
let prayer = fs.readFileSync('src/components/home/PrayerWidget.tsx', 'utf8');
prayer = prayer.replace(/v\.split/g, '(v as string).split');
prayer = prayer.replace(/<AlertCircle/g, '<!--');
fs.writeFileSync('src/components/home/PrayerWidget.tsx', prayer);

let lead = fs.readFileSync('src/components/leaderboard/Leaderboard.tsx', 'utf8');
lead = lead.replace(/primeInfo\.bgClass/g, 'primeInfo.frameClass');
fs.writeFileSync('src/components/leaderboard/Leaderboard.tsx', lead);

let mail = fs.readFileSync('src/components/mail/Mail.tsx', 'utf8');
mail = mail.replace(/a\.createdAt/g, '(a as any).createdAt');
mail = mail.replace(/b\.createdAt/g, '(b as any).createdAt');
fs.writeFileSync('src/components/mail/Mail.tsx', mail);
