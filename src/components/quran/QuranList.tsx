import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Search, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '../Layout';

interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

export const QuranList = () => {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchSurahs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('https://api.alquran.cloud/v1/surah');
      const data = await res.json();
      if (data.code === 200) {
        setSurahs(data.data);
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
    fetchSurahs();
  }, []);

  const filteredSurahs = surahs.filter(
    (s) => 
      s.name.includes(searchQuery) || 
      s.number.toString() === searchQuery ||
      s.englishName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#D4AF37]">القرآن الكريم</h1>
          <p className="text-white/40 mt-1">نسخة معتمدة للقراءة</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40" size={20} />
          <input
            type="text"
            placeholder="ابحث باسم السورة أو رقمها..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#121212] border border-white/10 rounded-xl py-3 pr-10 pl-4 focus:ring-2 focus:ring-[#D4AF37] outline-none shadow-sm text-[#E0E0E0]"
          />
        </div>
      </div>

      {error ? (
        <div className="flex flex-col items-center justify-center py-12 bg-[#121212] border border-white/10 rounded-2xl shadow-sm text-center">
          <AlertCircle size={48} className="text-red-400 mb-4" />
          <p className="text-lg mb-4 text-[#E0E0E0]">{error}</p>
          <button 
            onClick={fetchSurahs}
            className="flex items-center gap-2 px-6 py-2 bg-[#D4AF37] text-black font-bold rounded-lg hover:bg-[#8E6F2E] transition-colors"
          >
            <RefreshCw size={20} />
            إعادة المحاولة
          </button>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="bg-[#121212] border border-white/10 rounded-xl p-4 shadow-sm animate-pulse h-24"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSurahs.map((surah) => (
            <Link
              key={surah.number}
              to={`/quran/${surah.number}`}
              className="bg-[#121212] border border-white/10 rounded-xl p-4 shadow-sm hover:border-[#D4AF37]/50 hover:bg-white/5 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-[#1A1A1A] border border-white/5 flex items-center justify-center font-bold text-[#D4AF37]">
                  {surah.number}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#E0E0E0]">{surah.name}</h3>
                  <p className="text-xs text-white/40 mt-1">
                    {surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'} • {surah.numberOfAyahs} آية
                  </p>
                </div>
              </div>
              <div className="text-left text-white/20 group-hover:text-[#D4AF37] transition-colors font-arabic text-xl">
                ﷽
              </div>
            </Link>
          ))}
          {filteredSurahs.length === 0 && (
            <div className="col-span-full text-center py-12 text-white/40">
              لا توجد نتائج مطابقة للبحث
            </div>
          )}
        </div>
      )}
    </div>
  );
};
