import React from 'react';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { Mail, Lock, User, AlertCircle } from 'lucide-react';

export const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCred.user, { displayName: name });
      navigate('/');
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('البريد الإلكتروني مستخدم بالفعل');
      } else if (err.code === 'auth/weak-password') {
        setError('كلمة المرور ضعيفة جداً (يجب أن تكون 6 أحرف على الأقل)');
      } else {
        setError('فشل إنشاء الحساب');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] p-4" dir="rtl">
      <div className="max-w-md w-full bg-[#121212] border border-white/10 rounded-2xl shadow-2xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37] rounded-full blur-[100px] opacity-10 -z-10"></div>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#D4AF37]">GM Muslim</h1>
          <p className="text-white/40 mt-2">إنشاء حساب جديد</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl flex items-center gap-2 mb-6 text-sm">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-white/60">الاسم</label>
            <div className="relative">
              <User className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40" size={20} />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-white/10 text-[#E0E0E0] rounded-xl py-3 pr-10 pl-4 focus:ring-2 focus:ring-[#D4AF37] outline-none transition-all"
                placeholder="الاسم الكريم"
                required
              />
            </div>
          </div>

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
                minLength={6}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#D4AF37] hover:bg-[#8E6F2E] text-black font-bold py-3 rounded-xl transition-colors mt-6 disabled:opacity-50"
          >
            {loading ? 'جاري إنشاء الحساب...' : 'إنشاء حساب'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-white/40">
          لديك حساب بالفعل؟{' '}
          <Link to="/login" className="text-[#D4AF37] font-bold hover:underline">
            تسجيل الدخول
          </Link>
        </p>
      </div>
    </div>
  );
};
