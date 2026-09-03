import { useState, useEffect } from 'react';

export interface LocationData {
  lat?: number;
  lng?: number;
  city?: string;
  country?: string;
  source: 'gps' | 'manual' | 'default';
}

export const useLocation = () => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLocation = async () => {
      // Check for manual location first
      const savedCity = localStorage.getItem('gm_muslim_city');
      const savedCountry = localStorage.getItem('gm_muslim_country');
      
      if (savedCity && savedCountry) {
        setLocation({ city: savedCity, country: savedCountry, source: 'manual' });
        setLoading(false);
        return;
      }

      if (!navigator.geolocation) {
        setError('الموقع الجغرافي غير مدعوم في متصفحك');
        setLocation({ city: 'Makkah', country: 'Saudi Arabia', source: 'default' });
        setLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          try {
            const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=ar`);
            const data = await res.json();
            const city = data.city || data.locality || 'مدينة غير معروفة';
            const country = data.countryName || '';
            setLocation({ lat, lng, city, country, source: 'gps' });
          } catch (e) {
            setLocation({ lat, lng, source: 'gps' });
          }
          setLoading(false);
        },
        (err) => {
          setError('تعذر تحديد الموقع. تم استخدام مكة المكرمة كافتراضي.');
          setLocation({ city: 'Makkah', country: 'Saudi Arabia', source: 'default' });
          setLoading(false);
        }
      );
    };

    fetchLocation();
  }, []);

  const updateManualLocation = (city: string, country: string) => {
    localStorage.setItem('gm_muslim_city', city);
    localStorage.setItem('gm_muslim_country', country);
    setLocation({ city, country, source: 'manual' });
  };

  const clearManualLocation = () => {
    localStorage.removeItem('gm_muslim_city');
    localStorage.removeItem('gm_muslim_country');
    window.location.reload(); // Reload to trigger GPS again
  };

  return { location, error, loading, updateManualLocation, clearManualLocation };
};
