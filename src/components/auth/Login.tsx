import React from 'react';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { Mail, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      } else {
        setError('فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!email) {
      setError('الرجاء إدخال البريد الإلكتروني أولاً');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
      setError('');
    } catch (err) {
      setError('فشل إرسال رابط استعادة كلمة المرور');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] p-4" dir="rtl">
      <div className="max-w-md w-full bg-[#121212] border border-white/10 rounded-2xl shadow-2xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37] rounded-full blur-[100px] opacity-10 -z-10"></div>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#D4AF37]">GM Muslim</h1>
          <p className="text-white/40 mt-2">مرحباً بك مجدداً</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl flex items-center gap-2 mb-6 text-sm">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {resetSent && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-3 rounded-xl flex items-center gap-2 mb-6 text-sm">
            <CheckCircle2 size={18} />
            <span>تم إرسال رابط الاستعادة إلى بريدك الإلكتروني</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-white/60">البريد الإلكتروني</label>
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40" size={20} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-white/10 text-[#E0E0E0] rounded-xl py-3 pr-10 pl-4 focus:ring-2 focus:ring-[#D4AF37] outline-none transition-all"
                placeholder="email@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-white/60">كلمة المرور</label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40" size={20} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-white/10 text-[#E0E0E0] rounded-xl py-3 pr-10 pl-4 focus:ring-2 focus:ring-[#D4AF37] outline-none transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <div className="flex justify-between items-center text-sm">
            <button 
              type="button" 
              onClick={handleReset}
              className="text-[#D4AF37] hover:underline"
            >
              نسيت كلمة المرور؟
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#D4AF37] hover:bg-[#8E6F2E] text-black font-bold py-3 rounded-xl transition-colors mt-6 disabled:opacity-50"
          >
            {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-white/40">
          ليس لديك حساب؟{' '}
          <Link to="/register" className="text-[#D4AF37] font-bold hover:underline">
            إنشاء حساب جديد
          </Link>
        </p>
      </div>
    </div>
  );
};
