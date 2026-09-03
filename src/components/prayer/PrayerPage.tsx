import { PrayerWidget } from '../home/PrayerWidget';

export const PrayerPage = () => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10 max-w-2xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#121212] border border-[#D4AF37]/30 rounded-3xl p-8 text-[#E0E0E0] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37] rounded-full blur-[100px] opacity-10 -z-10"></div>
        <div>
          <h1 className="text-3xl font-bold mb-2 text-[#D4AF37]">مواقيت الصلاة</h1>
          <p className="text-white/60">تعرف على أوقات الصلاة في مدينتك</p>
        </div>
      </div>
      <PrayerWidget />
    </div>
  );
};
