import React, { useState } from 'react';
import { Ticket, CheckCircle2, AlertCircle, Sparkles, Gem, Gift, ShoppingBag, RotateCcw, Crown } from 'lucide-react';
import { Link } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import { 
  doc, 
  getDoc, 
  getDocs, 
  collection, 
  query, 
  where, 
  limit, 
  writeBatch, 
  increment, 
  arrayUnion 
} from 'firebase/firestore';

interface SuccessReward {
  code: string;
  points: number;
  subscriptionDays: number;
  newBalance: number;
}

export const Redeem: React.FC = () => {
  const { user, userData } = useAuth();
  const [promoCode, setPromoCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successReward, setSuccessReward] = useState<SuccessReward | null>(null);

  const handleRedeemCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userData) {
      setErrorMessage('يجب تسجيل الدخول أولاً لاستبدال الأكواد');
      return;
    }

    const cleanCode = promoCode.trim().toUpperCase();
    if (!cleanCode) {
      setErrorMessage('يرجى إدخال رمز الكود أولاً');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // 1. Fetch code document (try exact uppercase ID first, then fallback to field search)
      let codeDocRef = doc(db, 'codes', cleanCode);
      let codeSnap = await getDoc(codeDocRef);

      if (!codeSnap.exists()) {
        // Fallback: search by 'code' field matching cleanCode or raw input
        const q = query(
          collection(db, 'codes'),
          where('code', 'in', [cleanCode, promoCode.trim()]),
          limit(1)
        );
        const qSnap = await getDocs(q);
        if (!qSnap.empty) {
          codeSnap = qSnap.docs[0];
          codeDocRef = doc(db, 'codes', codeSnap.id);
        } else {
          throw new Error('الكود غير صحيح أو غير موجود، يرجى التأكد من الحروف');
        }
      }

      const codeData = codeSnap.data();

      // 2. Expiration check
      if (codeData.expiresAt) {
        const expTime = new Date(codeData.expiresAt).getTime();
        if (!isNaN(expTime) && expTime < Date.now()) {
          throw new Error('عذراً، هذا الكود انتهت صلاحيته ولم يعد قابلاً للاستخدام');
        }
      }

      // 3. Max usage check
      const maxUses = Number(codeData.maxUses || 1);
      const usedCount = Number(codeData.usedCount || 0);
      if (maxUses > 0 && usedCount >= maxUses) {
        throw new Error('عذراً، تم استنفاذ الحد الأقصى المسموح به لاستخدام هذا الكود');
      }

      // 4. Already used check
      const usedBy = Array.isArray(codeData.usedBy) ? codeData.usedBy : [];
      if (usedBy.includes(user.uid)) {
        throw new Error('لقد قمت باستخدام هذا الكود مسبقاً، لا يمكن استبداله أكثر من مرة لنفس الحساب');
      }

      // 5. Calculate reward (handling points, subscription, and legacy value fields)
      const isSubscription = codeData.type === 'subscription';
      let pointsAwarded = 0;
      let subscriptionDaysAwarded = 0;

      if (isSubscription) {
        subscriptionDaysAwarded = Number(
          codeData.subscriptionDays !== undefined 
            ? codeData.subscriptionDays 
            : (codeData.value || 0)
        );
      } else {
        // Points code
        pointsAwarded = Number(
          codeData.points !== undefined
            ? codeData.points
            : (codeData.value !== undefined ? codeData.value : 0)
        );
      }

      // Fallback if neither was detected but value exists
      if (pointsAwarded <= 0 && subscriptionDaysAwarded <= 0 && codeData.value) {
        pointsAwarded = Number(codeData.value);
      }

      if (pointsAwarded <= 0 && subscriptionDaysAwarded <= 0) {
        throw new Error('هذا الكود لا يحتوي على قيمة مكافأة صالحة، يرجى مراجعة الإدارة');
      }

      // 6. Atomically update user balance and code in Firestore
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      const currentGmPoints = Number(userSnap.data()?.gmPoints || userData.gmPoints || 0);
      const newCalculatedBalance = currentGmPoints + pointsAwarded;

      const batch = writeBatch(db);
      const updateData: any = {};

      if (pointsAwarded > 0) {
        updateData.gmPoints = increment(pointsAwarded);
        updateData.totalEarnedPoints = increment(pointsAwarded);

        // Record point transaction
        const txRef = doc(collection(db, 'pointTransactions'));
        batch.set(txRef, {
          userId: user.uid,
          amount: pointsAwarded,
          type: 'add',
          reason: `استبدال كود الهدية: ${cleanCode}`,
          createdAt: new Date().toISOString()
        });
      }

      if (subscriptionDaysAwarded > 0) {
        const currentExpiry = userSnap.data()?.subscriptionExpiry;
        const baseDate = (currentExpiry && new Date(currentExpiry).getTime() > Date.now()) 
          ? new Date(currentExpiry) 
          : new Date();
        baseDate.setDate(baseDate.getDate() + subscriptionDaysAwarded);

        updateData.subscription = subscriptionDaysAwarded > 30 ? 'yearly' : (subscriptionDaysAwarded > 7 ? 'monthly' : 'weekly');
        updateData.subscriptionExpiry = baseDate.toISOString();
      }

      // Merge update to user document
      batch.set(userRef, updateData, { merge: true });

      // Increment code usage and register user UID
      batch.update(codeDocRef, {
        usedCount: increment(1),
        usedBy: arrayUnion(user.uid)
      });

      await batch.commit();

      // 7. Show celebratory congratulatory card with awarded points
      setSuccessReward({
        code: cleanCode,
        points: pointsAwarded,
        subscriptionDays: subscriptionDaysAwarded,
        newBalance: newCalculatedBalance
      });
      setPromoCode('');

    } catch (err: any) {
      console.error('Error redeeming code:', err);
      setErrorMessage(err.message || 'حدث خطأ أثناء استبدال الكود، يرجى المحاولة مرة أخرى');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSuccessReward(null);
    setErrorMessage(null);
    setPromoCode('');
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto px-4 py-8">
      {/* Live Balance Banner */}
      <div className="bg-[#0e1613] border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
            <Gem size={22} className="animate-pulse" />
          </div>
          <div>
            <p className="text-xs text-white/50 font-medium">رصيد نقاط GM الخاص بك</p>
            <p className="text-lg font-black text-white flex items-center gap-1.5">
              <span className="text-[#D4AF37]">{(userData?.gmPoints ?? 0).toLocaleString()}</span>
              <span className="text-xs text-[#D4AF37]/80 font-normal">نقطة 💎</span>
            </p>
          </div>
        </div>
        <Link
          to="/store"
          className="text-xs px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 font-bold transition-all flex items-center gap-1.5"
        >
          <ShoppingBag size={14} />
          <span>المتجر</span>
        </Link>
      </div>

      <AnimatePresence mode="wait">
        {successReward ? (
          /* Congratulatory Success Card */
          <motion.div
            key="success-card"
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-gradient-to-b from-[#141f1a] to-[#0a120e] border-2 border-[#D4AF37]/50 rounded-3xl p-6 md:p-10 shadow-2xl text-center relative overflow-hidden"
          >
            {/* Background celebratory glow */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#D4AF37]/15 blur-3xl rounded-full pointer-events-none" />

            {/* Trophy / Gift Icon with bouncing glow */}
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="w-20 h-20 bg-gradient-to-tr from-[#D4AF37] to-[#FDE047] text-black rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_35px_rgba(212,175,55,0.4)] relative"
            >
              <Sparkles size={38} className="animate-spin" style={{ animationDuration: '6s' }} />
            </motion.div>

            {/* Congratulatory Title */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-bold mb-3">
              <CheckCircle2 size={16} />
              <span>تم الاستبدال بنجاح!</span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white mb-2">
              🎉 تهانينا ومبارك لك!
            </h2>
            <p className="text-white/70 text-sm max-w-md mx-auto mb-6">
              تم التحقق من الكود <span className="font-mono text-[#D4AF37] font-bold tracking-wider">[{successReward.code}]</span> وإضافة المكافأة فوراً إلى حسابك:
            </p>

            {/* Points Award Highlight Badge */}
            {successReward.points > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-[#09110d] border border-[#D4AF37]/40 rounded-2xl p-5 mb-6 max-w-sm mx-auto shadow-inner"
              >
                <p className="text-xs text-white/50 mb-1 font-medium">النقاط التي استبدلتها وحصلت عليها</p>
                <div className="text-3xl md:text-4xl font-black text-[#D4AF37] flex items-center justify-center gap-2">
                  <span>+{successReward.points.toLocaleString()}</span>
                  <span className="text-lg text-[#FDE047]">نقطة GM 💎</span>
                </div>
                <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-white/60">
                  <span>رصيدك الإجمالي الآن:</span>
                  <span className="text-[#D4AF37] font-bold text-sm">
                    {successReward.newBalance.toLocaleString()} نقطة
                  </span>
                </div>
              </motion.div>
            )}

            {/* Subscription Award Highlight Badge */}
            {successReward.subscriptionDays > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-[#09110d] border border-purple-500/40 rounded-2xl p-5 mb-6 max-w-sm mx-auto shadow-inner"
              >
                <p className="text-xs text-white/50 mb-1 font-medium">مدة اشتراك GM PRIME المضافة</p>
                <div className="text-3xl md:text-4xl font-black text-purple-400 flex items-center justify-center gap-2">
                  <Crown size={28} />
                  <span>+{successReward.subscriptionDays}</span>
                  <span className="text-lg">يوم اشتراك 👑</span>
                </div>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 border border-white/10"
              >
                <RotateCcw size={16} />
                <span>استبدال كود آخر</span>
              </button>

              <Link
                to="/store"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#D4AF37] hover:bg-[#b89528] text-black font-black text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#D4AF37]/20"
              >
                <ShoppingBag size={16} />
                <span>زيارة المتجر واستخدام النقاط</span>
              </Link>
            </div>
          </motion.div>
        ) : (
          /* Normal Redeem Code Form */
          <motion.div
            key="input-card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-[#121212] border border-white/10 rounded-3xl p-6 md:p-8 shadow-sm text-center"
          >
            <div className="w-16 h-16 bg-[#1A1A1A] rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/5 shadow-lg text-[#D4AF37]">
              <Gift size={32} />
            </div>
            
            <h2 className="text-2xl font-bold text-[#E0E0E0] mb-2">استبدال أكواد الهدايا والجوائز</h2>
            <p className="text-white/60 text-sm mb-8 max-w-md mx-auto leading-relaxed">
              أدخل كود الهدية الذي حصلت عليه من الإدارة أو المسابقات للحصول على نقاط GM 💎 أو تفعيل عضويات GM PRIME فوراً.
            </p>
            
            <form onSubmit={handleRedeemCode} className="flex flex-col gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="أدخل الكود هنا (مثال: FREE100)"
                  value={promoCode}
                  onChange={(e) => {
                    setPromoCode(e.target.value.toUpperCase());
                    if (errorMessage) setErrorMessage(null);
                  }}
                  disabled={isSubmitting}
                  className="w-full bg-[#1A1A1A] border border-white/15 focus:border-[#D4AF37] rounded-2xl py-4 px-4 text-center text-xl outline-none text-[#E0E0E0] uppercase font-mono tracking-widest transition-all placeholder:text-white/30 placeholder:tracking-normal placeholder:font-sans placeholder:text-sm"
                  autoCapitalize="characters"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck="false"
                  required
                />
              </div>

              <button 
                type="submit"
                disabled={isSubmitting || !promoCode.trim()}
                className="w-full py-4 bg-[#D4AF37] text-black font-black text-base rounded-2xl hover:bg-[#b89528] active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>جاري التحقق وإضافة المكافأة...</span>
                  </>
                ) : (
                  <>
                    <Ticket size={18} />
                    <span>استبدال الكود والحصول على النقاط</span>
                  </>
                )}
              </button>
            </form>
            
            {/* Error Message */}
            {errorMessage && (
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-400 text-sm mt-6 flex items-center justify-center gap-2.5 bg-red-500/10 p-4 rounded-2xl border border-red-500/20 text-center"
              >
                <AlertCircle size={20} className="shrink-0 text-red-400" />
                <span>{errorMessage}</span>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
