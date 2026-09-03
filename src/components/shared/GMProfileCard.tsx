import React from 'react';
import { CosmeticDesign, ProductType } from '../../types/store';
import { GMAvatar } from './GMAvatar';
import { GMName } from './GMName';
import { getPrimeLevel } from '../../lib/prime';
import { isItemExpired } from '../../lib/cosmetics';
import { Crown, Sparkles, Gem, ShieldCheck } from 'lucide-react';
import { cn } from '../Layout';

interface GMProfileCardProps {
  userObj: any;
  previewDesign?: CosmeticDesign;
  previewType?: ProductType;
  className?: string;
  compact?: boolean;
}

export const GMProfileCard: React.FC<GMProfileCardProps> = ({
  userObj,
  previewDesign,
  previewType,
  className = '',
  compact = false
}) => {
  let activeBg = userObj?.activeCosmetics?.profileBg;
  let activeCard = userObj?.activeCosmetics?.profileCard;

  if (activeBg && isItemExpired(activeBg)) activeBg = null;
  if (activeCard && isItemExpired(activeCard)) activeCard = null;

  if (previewDesign) {
    if (previewType === 'PROFILE_BG') activeBg = { design: previewDesign };
    if (previewType === 'PROFILE_CARD') activeCard = { design: previewDesign };
  }

  const bgDesign: CosmeticDesign | undefined = activeBg?.design;
  const cardDesign: CosmeticDesign | undefined = activeCard?.design;

  const primeInfo = userObj ? getPrimeLevel(userObj.totalEarnedPoints || 0) : null;

  // Custom Background style
  let cardBgStyle: React.CSSProperties = {
    background: bgDesign?.bgGradient || 'linear-gradient(135deg, #0f1715 0%, #0a0a0a 100%)'
  };

  if (bgDesign?.bgImage) {
    cardBgStyle.backgroundImage = `url(${bgDesign.bgImage})`;
    cardBgStyle.backgroundSize = 'cover';
    cardBgStyle.backgroundPosition = 'center';
  }

  // Border & Glow
  let borderClass = 'border border-emerald-900/40 shadow-2xl';
  if (cardDesign?.cardStyle === 'emerald-border') {
    borderClass = 'border-2 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.2)]';
  } else if (cardDesign?.cardStyle === 'gold-border') {
    borderClass = 'border-2 border-[#D4AF37]/60 shadow-[0_0_30px_rgba(212,175,55,0.25)]';
  } else if (cardDesign?.cardStyle === 'cyber-glow') {
    borderClass = 'border-2 border-cyan-400/60 shadow-[0_0_30px_rgba(6,182,212,0.3)]';
  }

  return (
    <div 
      className={cn(
        "rounded-3xl p-6 relative overflow-hidden transition-all duration-300",
        borderClass,
        className
      )}
      style={cardBgStyle}
    >
      {/* Subtle Islamic pattern or Gold radial highlight */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[90px] pointer-events-none -z-0" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#D4AF37]/10 rounded-full blur-[80px] pointer-events-none -z-0" />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col md:flex-row items-center gap-5 text-center md:text-right">
          <GMAvatar 
            userObj={userObj} 
            size={compact ? 'lg' : 'xl'} 
            previewDesign={previewDesign} 
            previewType={previewType} 
          />
          
          <div className="space-y-2">
            <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
              <GMName 
                userObj={userObj} 
                className={compact ? "text-xl" : "text-2xl"}
                previewDesign={previewDesign}
                previewType={previewType}
              />
              {userObj?.role === 'admin' && (
                <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck size={12} /> إدارة GM
                </span>
              )}
            </div>

            <p className="text-white/50 text-xs font-mono tracking-wider">{userObj?.email || 'لا يوجد بريد'}</p>

            <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap pt-1">
              {primeInfo ? (
                <span className={cn("text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1.5", primeInfo.color, primeInfo.frameClass)}>
                  <Crown size={14} /> {primeInfo.name} ({primeInfo.badge})
                </span>
              ) : (
                <span className="text-xs bg-white/5 text-white/50 px-3 py-1 rounded-full border border-white/10">
                  مستخدم عادي
                </span>
              )}

              {userObj?.subscription && (
                <span className="text-xs bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 px-3 py-1 rounded-full font-bold flex items-center gap-1">
                  <Sparkles size={13} /> اشتراك {userObj.subscription === 'yearly' ? 'سنوي' : 'شهري'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Gems & Stats badge */}
        <div className="flex gap-3 bg-black/40 backdrop-blur-md border border-white/10 p-3.5 rounded-2xl">
          <div className="text-center px-4">
            <div className="flex items-center justify-center gap-1 text-[#D4AF37] text-xs font-bold mb-0.5">
              <Gem size={14} />
              <span>Gems</span>
            </div>
            <p className="text-2xl font-black text-white">{userObj?.gmPoints || 0}</p>
          </div>
          <div className="w-[1px] bg-white/10" />
          <div className="text-center px-4">
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-0.5">مكتسب</p>
            <p className="text-xl font-bold text-emerald-400">{userObj?.totalEarnedPoints || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
