const fs = require('fs');

// Patch App.tsx
let app = fs.readFileSync('src/App.tsx', 'utf8');
app = app.replace("import { Home } from './components/home/Home';", "import { Home } from './components/home/Home';\nimport { PrayerPage } from './components/prayer/PrayerPage';");
app = app.replace("<Route path=\"/quran\" element={<QuranList />} />", "<Route path=\"/prayer\" element={<PrayerPage />} />\n            <Route path=\"/quran\" element={<QuranList />} />");
fs.writeFileSync('src/App.tsx', app);

// Patch Layout.tsx
let layout = fs.readFileSync('src/components/Layout.tsx', 'utf8');
layout = layout.replace("import { Home, BookOpen", "import { Home, BookOpen, Compass");
const navItemsTarget = "{ name: 'الرئيسية', path: '/', icon: Home, main: true },";
layout = layout.replace(navItemsTarget, navItemsTarget + "\n    { name: 'الصلاة', path: '/prayer', icon: Compass, main: true },");
fs.writeFileSync('src/components/Layout.tsx', layout);
