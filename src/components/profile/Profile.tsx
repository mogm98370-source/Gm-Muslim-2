import React, { useState, useRef } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { 
  User, 
  Package, 
  Heart, 
  Edit2, 
  Check, 
  X, 
  ShoppingBag, 
  LifeBuoy, 
  Sparkles, 
  Gem, 
  Crown,
  Camera
} from 'lucide-react';
import { getPrimeLevel } from '../../lib/prime';
import { cn } from '../Layout';
import { GMName } from '../shared/GMName';
import { GMAvatar } from '../shared/GMAvatar';
import { GMProfileCard } from '../shared/GMProfileCard';
import { Link } from 'react-router';

export const Profile: React.FC = () => {
  const { user, userData } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(userData?.displayName || '');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const primeInfo = userData ? getPrimeLevel(userData.totalEarnedPoints || 0) : null;

  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', user.uid), { displayName: newName }, { merge: true });
      setIsEditing(false);
    } catch (e) {
      console.error(e);
      alert('فشل حفظ البيانات');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;
    const file = e.target.files[0];
    if (file.size > 5 * 1024 * 1024) {
      alert('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
      return;
    }
    setUploading(true);
    try {
      const storageRef = ref(storage, `users/${user.uid}/profile_${Date.now()}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await setDoc(doc(db, 'users', user.uid), { photoURL: url }, { merge: true });
    } catch (e) {
      console.error(e);
      // Fallback to local Base64 if storage is restricted in container
      const reader = new FileReader();
      reader.onloadend = async () => {
        if (reader.result) {
          await setDoc(doc(db, 'users', user.uid), { photoURL: reader.result as string }, { merge: true });
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setUploading(false);
    }
  };

  if (!userData) return <div className="p-12 text-center text-white/50 animate-pulse">جاري تحميل بيانات الحساب...</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
      {/* Live Profile Card with Active Cosmetics */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold text-[#D4AF37] flex items-center gap-1.5">
            <Sparkles size={16} />
            بطاقة ملفك الشخصي المباشرة
          </h2>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-xs text-white/60 hover:text-white flex items-center gap-1 transition-colors"
          >
            <Camera size={14} className="text-[#D4AF37]" />
            <span>تغيير الصورة</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
        </div>

        <GMProfileCard userObj={userData} />
      </div>

      {/* Profile Details & Quick Name Edit */}
      <div className="bg-[#101514] border border-emerald-500/20 rounded-3xl p-6 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
          <div className="space-y-1">
            <span className="text-xs text-white/40 block">الاسم المعروض في التطبيق</span>
            {isEditing ? (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="bg-[#141b18] border border-emerald-500/40 rounded-xl px-4 py-2 text-white outline-none focus:border-[#D4AF37] text-sm"
                />
                <button onClick={handleSaveProfile} className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/30 transition-colors">
                  <Check size={18} />
                </button>
                <button onClick={() => setIsEditing(false)} className="p-2 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors">
                  <X size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <GMName userObj={userData} className="text-2xl" />
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1.5 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  title="تعديل الاسم"
                >
                  <Edit2 size={16} />
                </button>
              </div>
            )}
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-white/40 block">البريد الإلكتروني</span>
            <span className="text-sm font-mono text-white/80">{userData.email || 'غير متوفر'}</span>
          </div>
        </div>

        {/* Quick Hub Links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <Link
            to="/inventory"
            className="p-5 bg-[#141b18] hover:bg-[#18231e] border border-emerald-500/30 rounded-2xl flex items-center gap-4 transition-all group shadow-md"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-300 group-hover:scale-110 transition-transform">
              <Package size={24} />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">مقتنياتي</h4>
              <p className="text-xs text-white/40 mt-0.5">تفعيل الإطارات والشارات</p>
            </div>
          </Link>

          <Link
            to="/store"
            className="p-5 bg-[#141b18] hover:bg-[#18231e] border border-[#D4AF37]/30 rounded-2xl flex items-center gap-4 transition-all group shadow-md"
          >
            <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] group-hover:scale-110 transition-transform">
              <ShoppingBag size={24} />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">GM Store</h4>
              <p className="text-xs text-white/40 mt-0.5">شراء منتجات وتأثيرات</p>
            </div>
          </Link>

          <Link
            to="/support"
            className="p-5 bg-[#141b18] hover:bg-[#18231e] border border-blue-500/30 rounded-2xl flex items-center gap-4 transition-all group shadow-md"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-300 group-hover:scale-110 transition-transform">
              <LifeBuoy size={24} />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">مركز الدعم</h4>
              <p className="text-xs text-white/40 mt-0.5">تواصل مع إدارة GM</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};
