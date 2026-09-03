import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '../Layout';

export const SurahAudioPlayer = ({ surahId, canListen }: { surahId: number, canListen: boolean }) => {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!canListen) return;
    
    let isMounted = true;
    const fetchAudio = async () => {
      setIsLoading(true);
      setError('');
      try {
        // 7 is Mishary Rashid Alafasy
        const res = await fetch(`https://api.quran.com/api/v4/chapter_recitations/7/${surahId}`);
        const data = await res.json();
        if (data.audio_file?.audio_url && isMounted) {
          setAudioUrl(data.audio_file.audio_url);
        } else if (isMounted) {
          setError('تعذر العثور على الملف الصوتي.');
        }
      } catch (e) {
        if (isMounted) setError('فشل الاتصال بالخادم لجلب الصوت.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    
    fetchAudio();
    
    return () => {
      isMounted = false;
    };
  }, [surahId, canListen]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => setProgress(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const onEnded = () => setIsPlaying(false);
    const onError = () => {
      setError('حدث خطأ أثناء تشغيل الصوت. قد يكون غير مدعوم أو انقطع الاتصال.');
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.error('Audio play error:', err);
        setError('تعذر تشغيل الصوت تلقائياً، يرجى التفاعل مع الصفحة.');
        setIsPlaying(false);
      });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const time = Number(e.target.value);
    audioRef.current.currentTime = time;
    setProgress(time);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '00:00';
    const m = Math.floor(time / 60).toString().padStart(2, '0');
    const s = Math.floor(time % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!canListen) {
    return (
      <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-4 flex items-center justify-center gap-3 text-white/60">
        <AlertCircle size={20} className="text-[#D4AF37]" />
        <span>الاستماع للقرآن الكريم متاح لأصحاب Prime أو المشتركين فقط.</span>
      </div>
    );
  }

  return (
    <div className="bg-[#1A1A1A] border border-[#D4AF37]/30 rounded-2xl p-4 flex flex-col gap-3 shadow-lg">
      {audioUrl && <audio ref={audioRef} src={audioUrl} muted={isMuted} preload="metadata" />}
      
      {error && (
        <div className="text-red-400 text-xs text-center flex items-center justify-center gap-2">
          <AlertCircle size={14} /> {error}
        </div>
      )}
      
      <div className="flex items-center gap-4">
        <button 
          onClick={togglePlay}
          disabled={isLoading || !audioUrl}
          className="w-12 h-12 flex-shrink-0 bg-[#D4AF37] text-black rounded-full flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
        >
          {isLoading ? <Loader2 size={24} className="animate-spin" /> : (isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />)}
        </button>
        
        <div className="flex-1 flex flex-col gap-1">
          <div className="flex justify-between text-xs text-white/60 font-mono">
            <span>{formatTime(progress)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max={duration || 100} 
            value={progress} 
            onChange={handleSeek}
            disabled={!audioUrl}
            className="w-full accent-[#D4AF37] bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        
        <button 
          onClick={() => setIsMuted(!isMuted)}
          className="p-2 text-white/60 hover:text-white transition-colors"
        >
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
      </div>
    </div>
  );
};
