const fs = require('fs');
let code = fs.readFileSync('src/components/quran/SurahView.tsx', 'utf8');

if (!code.includes('SurahAudioPlayer')) {
  code = code.replace("import { cn } from '../Layout';", "import { cn } from '../Layout';\nimport { SurahAudioPlayer } from './SurahAudioPlayer';\nimport { getPrimeLevel } from '../../lib/prime';");
}

code = code.replace("const { user } = useAuth();", "const { user, userData } = useAuth();\n  const primeInfo = userData ? getPrimeLevel(userData.totalEarnedPoints || 0) : null;\n  const canListen = Boolean(userData?.subscription) || Boolean(primeInfo?.hasAudio);");

const target = '<div className="bg-[#121212] border border-white/10 rounded-3xl p-6 md:p-12 shadow-2xl relative">';
if (code.includes(target)) {
  code = code.replace(target, `<div className="mb-6">\n        <SurahAudioPlayer surahId={surah.number} canListen={canListen} />\n      </div>\n      ` + target);
}

fs.writeFileSync('src/components/quran/SurahView.tsx', code);
