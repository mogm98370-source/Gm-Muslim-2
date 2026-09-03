import React from 'react';
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, writeBatch, orderBy, increment } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { Mail as MailIcon, Gift, CheckCircle2 } from 'lucide-react';

export const Mail = () => {
  const { user, userData } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  useEffect(() => {
    const fetchMail = async () => {
      if (!user) return;
      try {
        const q1 = query(collection(db, 'mail'), where('recipientId', '==', user.uid));
        const q2 = query(collection(db, 'mail'), where('recipientId', '==', 'all'));
        
        const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
        const allMail = [...snap1.docs, ...snap2.docs].map(d => ({ id: d.id, ...d.data() }));
        
        allMail.sort((a, b) => new Date((b as any).createdAt || 0).getTime() - new Date((a as any).createdAt || 0).getTime());
        setMessages(allMail);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchMail();
  }, [user]);

  const handleClaim = async (msg: any) => {
    if (!user || !msg.attachedGems) return;
    
    // Check if already claimed
    if (msg.recipientId === 'all') {
      if (msg.claimedBy && msg.claimedBy.includes(user.uid)) return;
    } else {
      if (msg.isClaimed) return;
    }

    setClaiming(msg.id);
    try {
      const batch = writeBatch(db);
      const userRef = doc(db, 'users', user.uid);
      const mailRef = doc(db, 'mail', msg.id);
      const txRef = doc(collection(db, 'pointTransactions'));

      batch.update(userRef, { gmPoints: increment(msg.attachedGems), totalEarnedPoints: increment(msg.attachedGems) });
      
      if (msg.recipientId === 'all') {
        const newClaimedBy = msg.claimedBy ? [...msg.claimedBy, user.uid] : [user.uid];
        batch.update(mailRef, { claimedBy: newClaimedBy });
      } else {
        batch.update(mailRef, { isClaimed: true });
      }

      batch.set(txRef, {
        userId: user.uid,
        adminId: msg.senderId,
        amount: msg.attachedGems,
        reason: 'استلام هدية من البريد',
        type: 'add',
        mailId: msg.id,
        createdAt: new Date().toISOString()
      });

      await batch.commit();
      
      setMessages(messages.map(m => {
        if (m.id === msg.id) {
          if (m.recipientId === 'all') {
            return { ...m, claimedBy: m.claimedBy ? [...m.claimedBy, user.uid] : [user.uid] };
          } else {
            return { ...m, isClaimed: true };
          }
        }
        return m;
      }));
      
    } catch (e) {
      console.error(e);
      alert('فشل استلام المكافأة');
    } finally {
      setClaiming(null);
    }
  };

  const isClaimed = (msg: any) => {
    if (msg.recipientId === 'all') return msg.claimedBy?.includes(user?.uid);
    return msg.isClaimed;
  };

  if (loading) return <div className="p-8 text-center"><span className="animate-pulse">جاري التحميل...</span></div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#121212] border border-[#D4AF37]/30 rounded-3xl p-8 text-[#E0E0E0] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37] rounded-full blur-[100px] opacity-10 -z-10"></div>
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2 text-[#D4AF37]">
            <MailIcon />
            صندوق الوارد
          </h1>
          <p className="text-white/60">رسائل الإدارة والمكافآت الحصرية</p>
        </div>
      </div>

      <div className="space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className="bg-[#121212] border border-white/10 rounded-2xl p-6 relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg text-[#E0E0E0] mb-1">{msg.subject}</h3>
                <p className="text-xs text-white/40">{new Date(msg.createdAt).toLocaleString('ar-EG')}</p>
              </div>
            </div>
            
            <p className="text-white/80 whitespace-pre-wrap leading-relaxed">{msg.body}</p>
            
            {msg.attachedGems > 0 && (
              <div className="mt-6 bg-[#1A1A1A] border border-[#D4AF37]/30 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37]">
                    <Gift size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#E0E0E0]">مكافأة مرفقة</p>
                    <p className="text-[#D4AF37] font-black">{msg.attachedGems} GM Points</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => handleClaim(msg)}
                  disabled={isClaimed(msg) || claiming === msg.id}
                  className={`px-6 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2 ${isClaimed(msg) ? 'bg-green-500/20 text-green-400' : 'bg-[#D4AF37] text-black hover:bg-[#8E6F2E]'}`}
                >
                  {isClaimed(msg) ? <><CheckCircle2 size={16}/> تم الاستلام</> : (claiming === msg.id ? 'جاري الاستلام...' : 'استلام المكافأة')}
                </button>
              </div>
            )}
          </div>
        ))}
        
        {messages.length === 0 && (
          <div className="text-center py-12 text-white/40 bg-[#121212] rounded-2xl border border-white/10">
            لا توجد رسائل حالياً.
          </div>
        )}
      </div>
    </div>
  );
};
