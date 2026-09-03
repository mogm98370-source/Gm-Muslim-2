import { useAuth } from '../../context/AuthContext';
import { Crown, Lock, Check } from 'lucide-react';
import { PRIME_LEVELS, getPrimeLevel, getNextPrime } from '../../lib/prime';
import { cn } from '../Layout';

export const Prime = () => {
  const { userData } = useAuth();
  const totalPoints = userData?.totalEarnedPoints || 0;
  
  const currentPrime = getPrimeLevel(totalPoints);
  const nextPrime = getNextPrime(totalPoints);
  
  const progressPercentage = nextPrime 
    ? Math.min(100, (totalPoints / nextPrime.minPoints) * 100)
    : 100;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10">
      
      {/* Header section */}
      <div className="bg-gradient-to-br from-[#121212] to-[#0A0A0A] border border-white/10 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4"></div>
        
        <Crown size={48} className="mx-auto text-[#D4AF37] mb-6" />
        <h1 className="text-4xl md:text-5xl font-bold text-[#E0E0E0] mb-4">
          GM <span className="text-[#D4AF37]">PRIME</span>
        </h1>
        <p className="text-white/60 max-w-2xl mx-auto text-lg mb-10">
          نظام الولاء والمكافآت الأرقى. كل نقطة تكتسبها تقربك أكثر للمستويات العليا والمميزات الحصرية.
          النقاط التي تنفقها في المتجر لا تنقص من تقدمك في مستويات برايم.
        </p>
        
        {userData ? (
          <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-6 max-w-xl mx-auto relative z-10">
            <h3 className="text-sm text-white/60 mb-2">مستواك الحالي</h3>
            {currentPrime ? (
              <div className="flex flex-col items-center gap-4">
                <span className={cn("text-3xl font-bold font-mono tracking-wider", currentPrime.color)}>
                  {currentPrime.name}
                </span>
                <span className={cn("px-4 py-1 rounded-full text-sm font-bold bg-[#121212] border", currentPrime.frameClass)}>
                  {currentPrime.badge}
                </span>
              </div>
            ) : (
              <div className="text-xl font-bold text-white/80">عضو عادي</div>
            )}
            
            <div className="mt-8">
              <div className="flex justify-between text-xs text-white/40 mb-2">
                <span>إجمالي النقاط: {totalPoints.toLocaleString()}</span>
                {nextPrime && <span>المستوى التالي: {nextPrime.minPoints.toLocaleString()}</span>}
              </div>
              <div className="h-3 bg-[#0A0A0A] rounded-full overflow-hidden border border-white/5">
                <div 
                  className="h-full bg-gradient-to-r from-[#D4AF37]/40 to-[#D4AF37] transition-all duration-1000 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              {nextPrime && (
                <p className="text-xs text-white/50 mt-3">
                  تحتاج إلى {(nextPrime.minPoints - totalPoints).toLocaleString()} نقطة للوصول إلى {nextPrime.name}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-amber-400 bg-amber-400/10 p-4 rounded-xl border border-amber-400/20 max-w-md mx-auto">
            قم بتسجيل الدخول لمعرفة مستواك والتقدم الخاص بك.
          </div>
        )}
      </div>

      {/* Levels list */}
      <div>
        <h2 className="text-2xl font-bold text-[#D4AF37] mb-6">مستويات برايم</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {PRIME_LEVELS.map((level) => {
            const isUnlocked = totalPoints >= level.minPoints;
            const isCurrent = currentPrime?.level === level.level;
            
            return (
              <div 
                key={level.level}
                className={cn(
                  "bg-[#121212] rounded-2xl p-6 border transition-all duration-300",
                  isUnlocked ? "border-white/20" : "border-white/5 opacity-70",
                  isCurrent && "ring-1 ring-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.1)]"
                )}
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className={cn("text-xl font-bold font-mono tracking-wide mb-1", level.color)}>
                      {level.name}
                    </h3>
                    <p className="text-sm text-white/40">{level.minPoints.toLocaleString()} نقطة مكتسبة</p>
                  </div>
                  {isUnlocked ? (
                    <div className="w-10 h-10 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center border border-green-500/20">
                      <Check size={20} />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#1A1A1A] text-white/20 flex items-center justify-center border border-white/5">
                      <Lock size={20} />
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-white/60 w-24">الشارة (Badge):</span>
                    <span className={cn("px-2 py-0.5 rounded text-xs border font-bold bg-[#0A0A0A]", level.frameClass, level.color)}>{level.badge}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-white/60 w-24">الإطار (Frame):</span>
                    <div className={cn("w-8 h-8 rounded-full bg-[#1A1A1A]", level.frameClass)}></div>
                  </div>
                  
                  {level.level >= 5 && (
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-white/60 w-24">لون الاسم:</span>
                      <span className={cn("font-bold", level.color)}>ملون</span>
                    </div>
                  )}
                  
                  {level.hasAudio && (
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-white/60 w-24">استماع القرآن:</span>
                      <span className="text-[#D4AF37]">متاح</span>
                    </div>
                  )}
                  
                  {level.hasSpecialBadge && (
                    <div className="flex items-center gap-3 text-sm pt-2 border-t border-white/5 mt-2">
                      <Crown size={16} className="text-[#D4AF37]"/>
                      <span className="text-[#D4AF37] font-bold">شعار حصري بجانب الاسم</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
    </div>
  );
};
