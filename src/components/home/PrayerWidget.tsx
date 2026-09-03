import React from 'react';
import { useState, useEffect } from 'react';
import { useLocation } from '../../hooks/useLocation';
import { usePrayerTimes, PrayerTimes as PT } from '../../hooks/usePrayerTimes';
import { Clock, MapPin, Settings2, X, Check, AlertCircle } from 'lucide-react';
import { cn } from '../Layout';

const prayerNamesAr: Record<keyof PT, string> = {
  Fajr: 'الفجر',
  Sunrise: 'الشروق',
  Dhuhr: 'الظهر',
  Asr: 'العصر',
  Maghrib: 'المغرب',
  Isha: 'العشاء',
};

const format12Hour = (timeStr: string) => {
  const [h, m] = (timeStr as string).split(':').map(Number);
  const ampm = h >= 12 ? 'م' : 'ص';
  const hours12 = h % 12 || 12;
  return `${hours12}:${String(m).padStart(2, '0')} ${ampm}`;
};

export const PrayerWidget = () => {
  const { location, error: locError, loading: locLoading, updateManualLocation, clearManualLocation } = useLocation();
  const { timings, hijri, timezone, loading: ptLoading, error: ptError } = usePrayerTimes(location);
  
  const [nextPrayer, setNextPrayer] = useState<{ name: string; time: string; diff: number } | null>(null);
  const [timeNow, setTimeNow] = useState(new Date());
  
  const [showSettings, setShowSettings] = useState(false);
  const [inputCity, setInputCity] = useState('');
  const [inputCountry, setInputCountry] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setTimeNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!timings) return;
    
    // Determine the current time in the API's timezone
    // The browser might be in a different timezone than the location
    // To be perfectly accurate, we should compare against the API's provided time, 
    // but timeNow uses browser's local time. Assuming user is generally in the same timezone as GPS,
    // this works for most. For robust handling, we use timezone if available.
    
    const now = new Date();
    let currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    if (timezone) {
      try {
        const tzTimeStr = new Intl.DateTimeFormat('en-US', { timeZone: timezone, hour: 'numeric', minute: 'numeric', hour12: false }).format(now);
        const [tzH, tzM] = tzTimeStr.split(':').map(Number);
        if (!isNaN(tzH) && !isNaN(tzM)) {
          currentMinutes = tzH * 60 + tzM;
        }
      } catch (e) {
        // Fallback to local time if timezone is invalid
      }
    }

    let upcoming = null;
    let minDiff = Infinity;
    Object.entries(timings).forEach(([key, timeStr]) => {
      if (!(key in prayerNamesAr)) return;
      
      const [hours, mins] = (timeStr as string).split(':').map(Number);
      const ptMinutes = hours * 60 + mins;
      
      let diff = ptMinutes - currentMinutes;
      // If negative, it means it's for tomorrow
      if (diff < 0) {
        diff += 24 * 60;
      }
      if (diff > 0 && diff < minDiff) {
        minDiff = diff;
        upcoming = { 
          name: prayerNamesAr[key as keyof PT], 
          time: timeStr, 
          diff 
        };
      }
    });

    setNextPrayer(upcoming);
  }, [timings, timeNow, timezone]);

  if (locLoading || ptLoading) {
    return <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 shadow-sm animate-pulse h-48"></div>;
  }

  const formatCountdown = (diffMins: number) => {
    const h = Math.floor(diffMins / 60);
    const m = diffMins % 60;
    const s = 60 - timeNow.getSeconds();
    
    // adjust minutes if seconds are counted down
    const adjustedM = s === 60 ? m : (m === 0 ? 59 : m - 1);
    const adjustedH = (m === 0 && s !== 60 && h > 0) ? h - 1 : h;
    const adjustedS = s === 60 ? 0 : s;

    return `${String(adjustedH).padStart(2, '0')}:${String(adjustedM).padStart(2, '0')}:${String(adjustedS).padStart(2, '0')}`;
  };
  
  const handleSaveLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCity && inputCountry) {
      updateManualLocation(inputCity, inputCountry);
      setShowSettings(false);
    }
  };

  return (
    <div className="bg-[#121212] border-t-4 border-[#D4AF37] rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 opacity-5 transform translate-x-1/4 -translate-y-1/4 text-[#D4AF37]">
        <svg width="200" height="200" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z" />
        </svg>
      </div>

      <div className="relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2 text-white/60 text-sm">
              <MapPin size={16} className="text-[#D4AF37]" />
              <span>
                {location?.city ? `${location.city}${location.country ? `، ${location.country}` : ''}` : 'مكة المكرمة'}
                {location?.source === 'manual' && ' (يدوي)'}
              </span>
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className="ml-2 p-1 hover:bg-white/10 rounded transition-colors text-white/40 hover:text-white"
                title="تغيير الموقع"
              >
                <Settings2 size={14} />
              </button>
            </div>
            
            {showSettings && (
              <form onSubmit={handleSaveLocation} className="mt-2 mb-4 bg-[#1A1A1A] p-4 rounded-xl border border-white/10 flex flex-col gap-3 animate-in fade-in">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-bold text-[#D4AF37]">تحديد الموقع يدوياً</h4>
                  <button type="button" onClick={() => setShowSettings(false)} className="text-white/40 hover:text-white">
                    <X size={16} />
                  </button>
                </div>
                <input 
                  type="text" 
                  placeholder="المدينة (مثال: Cairo)" 
                  value={inputCity}
                  onChange={e => setInputCity(e.target.value)}
                  className="bg-[#121212] border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#D4AF37] text-white"
                  required
                />
                <input 
                  type="text" 
                  placeholder="الدولة (مثال: Egypt)" 
                  value={inputCountry}
                  onChange={e => setInputCountry(e.target.value)}
                  className="bg-[#121212] border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#D4AF37] text-white"
                  required
                />
                <div className="flex gap-2 mt-2">
                  <button type="submit" className="flex-1 bg-[#D4AF37] text-black font-bold py-2 rounded-lg text-sm flex items-center justify-center gap-1">
                    <Check size={14} /> حفظ
                  </button>
                  {location?.source === 'manual' && (
                    <button type="button" onClick={clearManualLocation} className="flex-1 bg-red-500/10 text-red-400 font-bold py-2 rounded-lg text-sm border border-red-500/20">
                      استخدام GPS
                    </button>
                  )}
                </div>
              </form>
            )}

            {!showSettings && hijri && (
              <h2 className="text-xl md:text-2xl font-medium text-[#E0E0E0]">
                {hijri.day} {hijri.month.ar} {hijri.year} هـ
              </h2>
            )}
            {!showSettings && (
              <p className="text-white/40 mt-1 flex items-center gap-2">
                <Clock size={14} className="text-[#D4AF37]" />
                <span>
                  {new Intl.DateTimeFormat('ar-EG', { dateStyle: 'full' }).format(timeNow)}
                  {" - "}
                  {timeNow.toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit', hour12: true })}
                </span>
              </p>
            )}
            
            {locError && !showSettings && (
              <div className="text-xs text-amber-500 mt-2 flex items-center gap-1">
                <AlertCircle size={12} /> <span>{locError}</span>
              </div>
            )}
          </div>
          
          {nextPrayer && (
            <div className="bg-black/30 border border-white/10 backdrop-blur-md rounded-2xl p-4 text-center min-w-[160px]">
              <p className="text-[#D4AF37] text-[10px] uppercase tracking-wider mb-1">الصلاة القادمة</p>
              <h3 className="text-2xl font-bold mb-1 text-[#E0E0E0]">{nextPrayer.name}</h3>
              <p className="text-xl font-mono tracking-wider text-white/80">
                -{formatCountdown(nextPrayer.diff)}
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
          {timings && Object.entries(timings).map(([key, time]) => {
            if (!(key in prayerNamesAr)) return null;
            
            const arName = prayerNamesAr[key as keyof PT];
            const isNext = nextPrayer?.name === arName;
            
            return (
              <div 
                key={key}
                className={cn(
                  "bg-[#1A1A1A] border border-white/5 rounded-xl p-3 text-center transition-colors",
                  isNext && "bg-[#0D2E24] border-[#166534] shadow-md transform scale-105"
                )}
              >
                <p className={cn("text-xs mb-1 text-white/60", isNext && "font-bold text-[#4ADE80]")}>{arName}</p>
                <p className={cn("font-medium text-[#E0E0E0]", isNext && "font-bold text-[#4ADE80]")}>{format12Hour(time as string)}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
