import React from 'react';
import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { getPrimeLevel } from '../../lib/prime';
import { Trophy, Crown, ArrowUp, Star } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../Layout';
import { GMName } from '../shared/GMName';

export const Leaderboard = () => {
  const { user, userData } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const q = query(collection(db, 'users'), orderBy('totalEarnedPoints', 'desc'), limit(100));
        const snap = await getDocs(q);
        const fetchedUsers = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(fetchedUsers);
      } catch (error) {
        console.error("Error fetching leaderboard", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-48 bg-[#121212] rounded-2xl border border-white/10"></div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-[#121212] rounded-2xl border border-white/10"></div>
        ))}
      </div>
    );
  }

  const currentUserIndex = users.findIndex(u => u.id === user?.uid);
  const currentUserRank = currentUserIndex >= 0 ? currentUserIndex + 1 : null;
  const userAhead = currentUserIndex > 0 ? users[currentUserIndex - 1] : null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#121212] border border-[#D4AF37]/30 rounded-3xl p-8 text-[#E0E0E0] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37] rounded-full blur-[100px] opacity-10 -z-10"></div>
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2 text-[#D4AF37]">
            <Trophy />
            لوحة صدارة PRIME
          </h1>
          <p className="text-white/60 max-w-lg">
            أفضل المستخدمين ترتيباً بناءً على مستوى Prime ومجموع النقاط المكتسبة.
          </p>
        </div>
      </div>

      {/* Current User Stats */}
      {currentUserRank && userData && (
        <div className="bg-[#1A1A1A] border border-[#D4AF37]/20 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden">
          <div className="absolute left-0 top-0 w-1/2 h-full bg-gradient-to-r from-[#D4AF37]/5 to-transparent pointer-events-none"></div>
          
          <div className="flex items-center gap-4 z-10">
            <div className="w-16 h-16 rounded-full bg-[#121212] flex items-center justify-center font-black text-2xl text-[#D4AF37] border-2 border-[#D4AF37]/30">
              #{currentUserRank}
            </div>
            <div>
              <p className="text-xs text-white/50 mb-1 uppercase tracking-wider">مركزك الحالي</p>
              <h3 className="text-xl font-bold text-white">{userData.displayName || 'أنت'}</h3>
            </div>
          </div>

          <div className="flex items-center gap-6 z-10">
            <div className="text-center">
              <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">النقاط الكلية</p>
              <p className="font-bold text-[#E0E0E0]">{userData.totalEarnedPoints || 0}</p>
            </div>
            {userAhead && (
              <div className="text-center border-r border-white/10 pr-6">
                <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">للوصول للمركز #{currentUserRank - 1}</p>
                <p className="font-bold text-[#D4AF37] flex items-center gap-1 justify-center">
                  <ArrowUp size={14} />
                  {((userAhead.totalEarnedPoints || 0) - (userData.totalEarnedPoints || 0)) + 1} نقطة
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Leaderboard List */}
      <div className="space-y-4">
        {users.map((u, index) => {
          const rank = index + 1;
          const isTop3 = rank <= 3;
          const pLevel = getPrimeLevel(u.totalEarnedPoints || 0);
          
          return (
            <div 
              key={u.id}
              className={cn(
                "flex items-center gap-4 p-4 md:p-6 rounded-2xl transition-all",
                isTop3 ? "bg-[#121212] border-2 shadow-lg" : "bg-[#121212]/60 border border-white/5 hover:border-white/10",
                rank === 1 && "border-[#D4AF37] scale-[1.02]",
                rank === 2 && "border-slate-300",
                rank === 3 && "border-amber-700",
                u.id === user?.uid && !isTop3 && "border-[#D4AF37]/50 bg-[#1A1A1A]"
              )}
            >
              <div className={cn(
                "w-12 h-12 flex-shrink-0 flex items-center justify-center font-black text-xl rounded-full",
                rank === 1 ? "bg-[#D4AF37] text-black" : 
                rank === 2 ? "bg-slate-300 text-black" : 
                rank === 3 ? "bg-amber-700 text-white" : 
                "bg-[#1A1A1A] text-white/40 border border-white/10"
              )}>
                {rank}
              </div>

              <div className="relative">
                {u.photoURL ? (
                  <img src={u.photoURL} alt={u.displayName || ''} className="w-14 h-14 rounded-full object-cover border-2 border-[#1A1A1A]" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-[#1A1A1A] border-2 border-white/10 flex items-center justify-center">
                    <Star size={24} className="text-white/20" />
                  </div>
                )}
                {isTop3 && (
                  <div className={cn(
                    "absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full p-1 border-2 border-[#121212]",
                    rank === 1 ? "bg-[#D4AF37] text-black" : rank === 2 ? "bg-slate-300 text-black" : "bg-amber-700 text-white"
                  )}>
                    <Crown size={12} />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <GMName userObj={u} className="text-lg" />
                {pLevel && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn("text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded", pLevel.color, pLevel.frameClass)}>
                      {pLevel.name}
                    </span>
                  </div>
                )}
              </div>

              <div className="text-center ml-auto">
                <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">النقاط الكلية</p>
                <p className="font-bold text-xl text-[#E0E0E0]">{u.totalEarnedPoints || 0}</p>
              </div>
            </div>
          );
        })}
        
        {users.length === 0 && (
          <div className="text-center py-12 text-white/40">
            لا يوجد مستخدمين حتى الآن
          </div>
        )}
      </div>
    </div>
  );
};
