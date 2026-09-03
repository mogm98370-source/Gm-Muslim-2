import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Sun } from 'lucide-react';

export const Adhkar = () => {
  const [adhkar, setAdhkar] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchAdhkar = async () => {
      try {
        const snap = await getDocs(collection(db, 'adhkar'));
        setAdhkar(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAdhkar();
  }, []);

  const handleCount = (id: string, max: number) => {
    setCounts(prev => {
      const current = prev[id] || 0;
      if (current < max) {
        return { ...prev, [id]: current + 1 };
      }
      return prev;
    });
  };

  if (loading) return (
    <div className="animate-pulse space-y-4">
      <div className="h-32 bg-[#121212] border border-white/10 rounded-2xl"></div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-3xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#121212] border border-[#D4AF37]/30 rounded-3xl p-8 text-[#E0E0E0] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37] rounded-full blur-[100px] opacity-10 -z-10"></div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#1A1A1A] border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
            <Sun size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#D4AF37]">الأذكار</h1>
            <p className="text-white/60">ألا بذكر الله تطمئن القلوب</p>
          </div>
        </div>
      </div>

      {adhkar.length === 0 ? (
        <div className="text-center py-12 text-white/40 bg-[#121212] border border-white/10 rounded-2xl">
          لا توجد أذكار مضافة حالياً. يمكن للمسؤول إضافتها من لوحة الإدارة.
        </div>
      ) : (
        <div className="space-y-4">
          {adhkar.map(dhikr => {
            const currentCount = counts[dhikr.id] || 0;
            const maxCount = dhikr.count || 1;
            const isDone = currentCount >= maxCount;
            
            return (
              <div 
                key={dhikr.id} 
                className={`bg-[#121212] border border-white/10 p-6 rounded-2xl shadow-sm transition-all cursor-pointer hover:border-[#D4AF37]/30 ${isDone ? 'opacity-50' : ''}`}
                onClick={() => handleCount(dhikr.id, maxCount)}
              >
                <p className="font-arabic text-xl md:text-2xl leading-loose text-center mb-6 text-[#E0E0E0]">{dhikr.text}</p>
                <div className="flex items-center justify-between border-t border-white/5 pt-4">
                  <span className="text-sm text-[#D4AF37]">{dhikr.category || 'عام'}</span>
                  <button 
                    disabled={isDone}
                    className={`px-6 py-2 rounded-xl font-bold transition-colors border ${
                      isDone 
                        ? 'bg-[#1A1A1A] text-white/40 border-white/5' 
                        : 'bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20 hover:bg-[#D4AF37]/20'
                    }`}
                  >
                    {currentCount} / {maxCount}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
