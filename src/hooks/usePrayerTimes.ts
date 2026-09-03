import { useState, useEffect } from 'react';
import { LocationData } from './useLocation';

export interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

export interface HijriDate {
  date: string;
  format: string;
  day: string;
  weekday: {
    en: string;
    ar: string;
  };
  month: {
    number: number;
    en: string;
    ar: string;
  };
  year: string;
  designation: {
    abbreviated: string;
    expanded: string;
  };
  holidays: string[];
}

export const usePrayerTimes = (location: LocationData | null) => {
  const [timings, setTimings] = useState<PrayerTimes | null>(null);
  const [hijri, setHijri] = useState<HijriDate | null>(null);
  const [timezone, setTimezone] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrayerTimes = async () => {
      if (!location) return;
      
      setLoading(true);
      setError(null);
      try {
        const today = new Date();
        const timestamp = Math.floor(today.getTime() / 1000);
        let url = '';

        // Auto-detect method based on country (rough mapping)
        let method = 3; // MWL as fallback
        if (location.country?.includes('Egypt') || location.country?.includes('مصر')) method = 5;
        else if (location.country?.includes('Saudi') || location.country?.includes('السعودية')) method = 4;
        else if (location.country?.includes('Kuwait') || location.country?.includes('الكويت')) method = 4;
        else if (location.country?.includes('Emirates') || location.country?.includes('الإمارات')) method = 8;
        else if (location.country?.includes('Qatar') || location.country?.includes('قطر')) method = 11;
        else if (location.country?.includes('Europe') || location.country?.includes('UK')) method = 3;
        else if (location.country?.includes('US') || location.country?.includes('America')) method = 2;

        if (location.lat && location.lng) {
          url = `https://api.aladhan.com/v1/timings/${timestamp}?latitude=${location.lat}&longitude=${location.lng}&method=${method}`;
        } else if (location.city && location.country) {
          url = `https://api.aladhan.com/v1/timingsByCity?city=${location.city}&country=${location.country}&method=${method}`;
        } else {
          url = `https://api.aladhan.com/v1/timingsByCity?city=Makkah&country=Saudi Arabia&method=4`;
        }
        
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.code === 200) {
          setTimings(data.data.timings);
          setHijri(data.data.date.hijri);
          setTimezone(data.data.meta.timezone);
        } else {
          setError('فشل جلب مواقيت الصلاة');
        }
      } catch (err) {
        setError('حدث خطأ في الاتصال');
      } finally {
        setLoading(false);
      }
    };
    fetchPrayerTimes();
  }, [location]);

  return { timings, hijri, timezone, loading, error };
};
