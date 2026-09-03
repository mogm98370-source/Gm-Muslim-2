import { PrayerWidget } from './PrayerWidget';
import { GMName } from '../shared/GMName';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, Heart, Compass, ShoppingBag, BookMarked, Sun, Moon, History } from 'lucide-react';
import { Link } from 'react-router';
import { useEffect, useState, useMemo } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { dailyAyahs, dailyDuas, getDailyItem } from '../../lib/daily';

export const Home = () => {
  const { user, userData } = useAuth();
  const [readingProgress, setReadingProgress] = useState<any>(null);
  
  const todayAyah = useMemo(() => getDailyItem(dailyAyahs), []);
  const todayDua = useMemo(() => getDailyItem(dailyDuas), []);

  useEffect(() => {
    const fetchProgress = async () => {
      if (user) {
        try {
          const docRef = doc(db, 'users', user.uid, 'readingProgress', 'latest');
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            setReadingProgress(snap.data());
          }
        } catch (e) {
          console.error("Could not fetch progress", e);
        }
      }
    };
    fetchProgress();
  }, [user]);

  const quickLinks = [
    { title: 'القرآن الكريم', icon: BookOpen, path: '/quran', color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
    { title: 'الأذكار', icon: Sun, path: '/adhkar', color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
    { title: 'الأدعية', icon: Heart, path: '/duas', color: 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            السلام عليكم، <GMName userObj={userData} />
          </h1>
          <p className="text-neutral-500 mt-1">نسأل الله لك يوماً مباركاً</p>
        </div>
        <Link to="/store" className="flex items-center gap-2 bg-[#1A1A1A] border border-[#D4AF37]/30 px-4 py-2 rounded-xl hover:bg-white/5 transition-colors">
          <ShoppingBag size={20} className="text-[#D4AF37]" />
          <div className="text-sm">
            <p className="text-[#D4AF37] text-[10px] font-bold uppercase tracking-wider">GM Points</p>
            <p className="font-bold text-[#E0E0E0]">{userData?.gmPoints || 0}</p>
          </div>
        </Link>
      </div>

      <PrayerWidget />

      {/* Reading Progress */}
      {readingProgress && (
        <div className="bg-[#121212] rounded-2xl p-6 shadow-sm border border-white/10 flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full -mr-16 -mt-16 pointer-events-none"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-full flex items-center justify-center text-[#D4AF37]">
              <BookMarked size={24} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/40">متابعة القراءة</p>
              <h3 className="font-bold text-lg text-[#D4AF37]">سورة {readingProgress.surahName}</h3>
              <p className="text-xs text-white/50">آية {readingProgress.ayahNumber}</p>
            </div>
          </div>
          <Link to={`/quran/${readingProgress.surahId}`} className="px-6 py-2 bg-[#1A1A1A] border border-white/10 hover:bg-white/10 hover:border-white/20 rounded-lg transition-colors font-medium text-sm z-10">
            متابعة
          </Link>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link 
              key={link.path}
              to={link.path}
              className="bg-[#121212] p-6 rounded-2xl border border-white/10 hover:border-white/20 transition-all group flex flex-col items-center text-center gap-3"
            >
              <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 bg-[#1A1A1A] border border-white/5 text-[#D4AF37]`}>
                <Icon size={28} />
              </div>
              <span className="font-medium text-sm text-white/80">{link.title}</span>
            </Link>
          );
        })}
      </div>

      {/* Daily Content */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-[#121212] rounded-2xl p-6 border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4AF37]/5 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-white/60 flex items-center gap-2">
              <Moon size={16} className="text-[#D4AF37]" />
              آية اليوم
            </h3>
          </div>
          <p className="text-xl font-arabic leading-loose mb-4 text-[#E0E0E0]">
            "{todayAyah.text}"
          </p>
          <p className="text-xs text-[#D4AF37] font-serif italic">{todayAyah.source}</p>
        </div>

        <div className="bg-[#121212] rounded-2xl p-6 border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4AF37]/5 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-white/60 flex items-center gap-2">
              <History size={16} className="text-[#D4AF37]" />
              دعاء اليوم
            </h3>
          </div>
          <p className="text-xl font-arabic leading-loose mb-4 text-[#E0E0E0]">
            "{todayDua.text}"
          </p>
          <p className="text-xs text-[#D4AF37] font-serif italic">{todayDua.source}</p>
        </div>
      </div>
    </div>
  );
};
