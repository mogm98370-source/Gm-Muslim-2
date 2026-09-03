import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Heart } from 'lucide-react';

export const Duas = () => {
  const [duas, setDuas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDuas = async () => {
      try {
        const snap = await getDocs(collection(db, 'duas'));
        setDuas(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchDuas();
  }, []);

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
            <Heart size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#D4AF37]">الأدعية</h1>
            <p className="text-white/60">الدعاء مخ العبادة</p>
          </div>
        </div>
      </div>

      {duas.length === 0 ? (
        <div className="text-center py-12 text-white/40 bg-[#121212] border border-white/10 rounded-2xl">
          لا توجد أدعية مضافة حالياً. يمكن للمسؤول إضافتها من لوحة الإدارة.
        </div>
      ) : (
        <div className="space-y-4">
          {duas.map(dua => (
            <div key={dua.id} className="bg-[#121212] border border-white/10 p-6 rounded-2xl shadow-sm hover:border-[#D4AF37]/30 transition-all">
              <p className="font-arabic text-xl md:text-2xl leading-loose mb-4 text-[#E0E0E0] text-center">{dua.text}</p>
              {dua.source && (
                <div className="border-t border-white/5 pt-4 mt-2">
                  <p className="text-sm text-[#D4AF37] text-left">{dua.source}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
