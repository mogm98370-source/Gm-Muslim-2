import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router';
import { ChevronRight, ChevronLeft, ZoomIn, ZoomOut, Heart, AlertCircle, RefreshCw, BookmarkPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { cn } from '../Layout';
import { SurahAudioPlayer } from './SurahAudioPlayer';
import { getPrimeLevel } from '../../lib/prime';

interface Ayah {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  manzil: number;
  page: number;
  ruku: number;
  hizbQuarter: number;
  sajda: boolean;
}

interface SurahDetail {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  revelationType: string;
  numberOfAyahs: number;
  ayahs: Ayah[];
}

export const SurahView = () => {
  const { id } = useParams<{ id: string }>();
  const [surah, setSurah] = useState<SurahDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fontSize, setFontSize] = useState(28);
  const { user, userData } = useAuth();
  const primeInfo = userData ? getPrimeLevel(userData.totalEarnedPoints || 0) : null;
  const canListen = Boolean(userData?.subscription) || Boolean(primeInfo?.hasAudio);
  const [isFavorite, setIsFavorite] = useState(false);
  const [savingProgress, setSavingProgress] = useState(false);

  const fetchSurah = async (surahId: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`https://api.alquran.cloud/v1/surah/${surahId}/quran-uthmani`);
      const data = await res.json();
      if (data.code === 200) {
        setSurah(data.data);
      } else {
        setError('تعذر تحميل البيانات، حاول مرة أخرى.');
      }
    } catch (err) {
      setError('تعذر تحميل البيانات، حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchSurah(id);
      checkFavorite(id);
    }
  }, [id]);

  const checkFavorite = async (surahId: string) => {
    if (!user) return;
    try {
      const ref = doc(db, 'users', user.uid, 'favorites', `surah_${surahId}`);
      const snap = await getDoc(ref);
      setIsFavorite(snap.exists());
    } catch (e) {
      console.error(e);
    }
  };

  const toggleFavorite = async () => {
    if (!user || !surah) return;
    const ref = doc(db, 'users', user.uid, 'favorites', `surah_${surah.number}`);
    try {
      if (isFavorite) {
        await deleteDoc(ref);
        setIsFavorite(false);
      } else {
        await setDoc(ref, {
          type: 'surah',
          surahId: surah.number,
          surahName: surah.name,
          addedAt: new Date().toISOString()
        });
        setIsFavorite(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const saveProgress = async (ayah: Ayah) => {
    if (!user || !surah) return;
    setSavingProgress(true);
    try {
      const ref = doc(db, 'users', user.uid, 'readingProgress', 'latest');
      await setDoc(ref, {
        surahId: surah.number,
        surahName: surah.name,
        ayahNumber: ayah.numberInSurah,
        timestamp: new Date().toISOString()
      });
      // Also save in a history log if needed, but for now just 'latest'
    } catch (e) {
      console.error("Failed to save progress", e);
    } finally {
      setTimeout(() => setSavingProgress(false), 1000); // UI feedback delay
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-[#121212] border border-white/10 rounded-2xl shadow-sm text-center">
        <AlertCircle size={48} className="text-red-400 mb-4" />
        <p className="text-lg mb-4">{error}</p>
        <button 
          onClick={() => id && fetchSurah(id)}
          className="flex items-center gap-2 px-6 py-2 bg-[#D4AF37] text-black font-bold rounded-lg hover:bg-[#8E6F2E] transition-colors"
        >
          <RefreshCw size={20} />
          إعادة المحاولة
        </button>
      </div>
    );
  }

  if (loading || !surah) {
    return (
      <div className="space-y-6">
        <div className="h-20 bg-[#121212] border border-white/10 rounded-2xl animate-pulse"></div>
        <div className="h-96 bg-[#121212] border border-white/10 rounded-2xl animate-pulse"></div>
      </div>
    );
  }

  const hasBismillah = surah.number !== 1 && surah.number !== 9;
  
  // The API includes Bismillah in the first ayah text for some reason for non-Fatiha surahs. 
  // Let's clean it up for display.
  const bismillah = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";
  
  const processAyahText = (text: string, numberInSurah: number) => {
    if (numberInSurah === 1 && surah.number !== 1 && surah.number !== 9) {
      if (text.startsWith(bismillah)) {
        return text.replace(bismillah, '').trim();
      }
    }
    return text;
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-4xl mx-auto">
      {/* Sticky Header */}
      <div className="sticky top-16 md:top-0 z-10 bg-[#050505]/90 backdrop-blur-md py-4 mb-6 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/quran" className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60">
            <ChevronRight size={24} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#D4AF37]">{surah.name}</h1>
            <p className="text-xs text-white/40 mt-1">
              {surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'} • {surah.numberOfAyahs} آية
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-white/60">
          <button 
            onClick={() => setFontSize(f => Math.max(16, f - 2))}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ZoomOut size={20} />
          </button>
          <button 
            onClick={() => setFontSize(f => Math.min(60, f + 2))}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ZoomIn size={20} />
          </button>
          {user && (
            <button 
              onClick={toggleFavorite}
              className={cn(
                "p-2 rounded-full transition-colors",
                isFavorite ? "text-red-400 hover:bg-red-500/10" : "hover:bg-white/10"
              )}
            >
              <Heart size={20} fill={isFavorite ? "currentColor" : "none"} />
            </button>
          )}
        </div>
      </div>

      <div className="mb-6">
        <SurahAudioPlayer surahId={surah.number} canListen={canListen} />
      </div>
      <div className="bg-[#121212] border border-white/10 rounded-3xl p-6 md:p-12 shadow-2xl relative">
        {hasBismillah && (
          <div className="text-center font-arabic mb-10 text-[#D4AF37]" style={{ fontSize: fontSize * 1.2 }}>
            ﷽
          </div>
        )}
        
        <div 
          className="font-arabic leading-loose text-justify text-[#E0E0E0]"
          style={{ fontSize: fontSize, lineHeight: 2.5 }}
        >
          {surah.ayahs.map((ayah) => (
            <span 
              key={ayah.numberInSurah} 
              className="inline group relative cursor-pointer hover:bg-white/5 rounded-md transition-colors px-1"
              onClick={() => saveProgress(ayah)}
            >
              {processAyahText(ayah.text, ayah.numberInSurah)}
              <span className="inline-flex items-center justify-center w-8 h-8 md:w-12 md:h-12 mx-2 text-sm md:text-xl font-sans text-[#D4AF37] bg-[#1A1A1A] border border-white/10 rounded-full align-middle select-none">
                {ayah.numberInSurah}
              </span>
              
              {/* Tooltip for saving progress */}
              <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#D4AF37] text-black font-bold text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                {savingProgress ? 'تم الحفظ' : 'احفظ كعلامة'}
              </span>
            </span>
          ))}
        </div>
      </div>
      
      <div className="flex justify-between mt-8">
        {surah.number < 114 ? (
          <Link 
            to={`/quran/${surah.number + 1}`}
            className="flex items-center gap-2 px-6 py-3 bg-[#121212] border border-white/10 rounded-xl shadow-sm hover:border-[#D4AF37]/50 hover:text-[#D4AF37] transition-all text-sm font-medium"
          >
            السورة التالية
            <ChevronLeft size={16} />
          </Link>
        ) : <div />}
        
        {surah.number > 1 ? (
          <Link 
            to={`/quran/${surah.number - 1}`}
            className="flex items-center gap-2 px-6 py-3 bg-[#121212] border border-white/10 rounded-xl shadow-sm hover:border-[#D4AF37]/50 hover:text-[#D4AF37] transition-all text-sm font-medium"
          >
            <ChevronRight size={16} />
            السورة السابقة
          </Link>
        ) : <div />}
      </div>
    </div>
  );
};
