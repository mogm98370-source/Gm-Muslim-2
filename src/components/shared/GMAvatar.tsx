import React from 'react';
import { User as UserIcon, Sparkles } from 'lucide-react';
import { CosmeticDesign, ProductType } from '../../types/store';
import { cn } from '../Layout';
import { isItemExpired } from '../../lib/cosmetics';

interface GMAvatarProps {
  userObj?: any;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  previewDesign?: CosmeticDesign;
  previewType?: ProductType;
  className?: string;
  showBadge?: boolean;
  showEffect?: boolean;
}

export const GMAvatar: React.FC<GMAvatarProps> = ({
  userObj,
  size = 'md',
  previewDesign,
  previewType,
  className = '',
  showBadge = true,
  showEffect = true
}) => {
  // Extract active frame and effect
  let activeAvatar = userObj?.activeCosmetics?.avatar;
  let activeFrame = userObj?.activeCosmetics?.frame || userObj?.activeFrameData;
  let activeEffect = userObj?.activeCosmetics?.profileEffect || userObj?.activeProfileEffectData;
  let activeCrown = userObj?.activeCosmetics?.crown || userObj?.activeCrownData;
  let activeBadge = userObj?.activeCosmetics?.badge || userObj?.activeBadgeData;

  // Check expiry
  if (activeAvatar && isItemExpired(activeAvatar)) activeAvatar = null;
  if (activeFrame && isItemExpired(activeFrame)) activeFrame = null;
  if (activeEffect && isItemExpired(activeEffect)) activeEffect = null;
  if (activeCrown && isItemExpired(activeCrown)) activeCrown = null;
  if (activeBadge && isItemExpired(activeBadge)) activeBadge = null;

  // Apply preview design override if provided
  let previewAvatarUrl: string | undefined = undefined;
  if (previewDesign) {
    if (previewType === 'AVATAR') previewAvatarUrl = previewDesign.avatarUrl;
    if (previewType === 'FRAME') activeFrame = { design: previewDesign };
    if (previewType === 'PROFILE_EFFECT') activeEffect = { design: previewDesign };
    if (previewType === 'CROWN') activeCrown = { design: previewDesign };
    if (previewType === 'BADGE') activeBadge = { design: previewDesign };
  }

  const effectivePhotoUrl = previewAvatarUrl || activeAvatar?.imageUrl || userObj?.photoURL;

  // Fallback if userObj has legacy fields
  const frameDesign: CosmeticDesign | undefined = activeFrame?.design;
  const effectDesign: CosmeticDesign | undefined = activeEffect?.design;
  const crownDesign: CosmeticDesign | undefined = activeCrown?.design;
  const badgeDesign: CosmeticDesign | undefined = activeBadge?.design;

  // Size dimensions
  const sizeMap = {
    xs: { outer: 'w-8 h-8', inner: 'w-7 h-7', icon: 14, text: 'text-[9px]', crown: 'text-xs -top-2.5' },
    sm: { outer: 'w-10 h-10', inner: 'w-9 h-9', icon: 18, text: 'text-[10px]', crown: 'text-sm -top-3' },
    md: { outer: 'w-14 h-14', inner: 'w-12 h-12', icon: 24, text: 'text-xs', crown: 'text-base -top-3.5' },
    lg: { outer: 'w-20 h-20', inner: 'w-18 h-18', icon: 34, text: 'text-sm', crown: 'text-lg -top-4' },
    xl: { outer: 'w-28 h-28', inner: 'w-24 h-24', icon: 48, text: 'text-base', crown: 'text-2xl -top-6' },
    '2xl': { outer: 'w-36 h-36', inner: 'w-32 h-32', icon: 60, text: 'text-lg', crown: 'text-3xl -top-7' }
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  // Dynamic Border & Animation for Frame
  let frameBorderClass = 'border-2 border-white/10';
  let frameGlowStyle: React.CSSProperties = {};

  if (frameDesign) {
    const style = frameDesign.borderStyle || 'solid';
    if (style === 'gold-shine') frameBorderClass = 'border-2 md:border-[3px] border-[#D4AF37] anim-gold-shine';
    else if (style === 'flame-border') frameBorderClass = 'border-2 md:border-[3px] border-orange-500 anim-flame-border';
    else if (style === 'neon-pulse') frameBorderClass = 'border-2 md:border-[3px] border-cyan-400 anim-neon-pulse';
    else if (style === 'emerald-glow') frameBorderClass = 'border-2 md:border-[3px] border-emerald-400 anim-emerald-glow';
    else if (style === 'double') frameBorderClass = 'border-4 border-double border-[#D4AF37] shadow-lg';
    else if (frameDesign.borderColor) {
      frameBorderClass = 'border-2 md:border-[3px]';
      frameGlowStyle.borderColor = frameDesign.borderColor;
    }

    if (frameDesign.glowColor) {
      frameGlowStyle.boxShadow = `0 0 20px ${frameDesign.glowColor}, inset 0 0 10px ${frameDesign.glowColor}`;
    }
  }

  // Profile Effect Aura Style
  const effectType = effectDesign?.effectType || frameDesign?.effectType;

  return (
    <div className={cn("relative inline-flex items-center justify-center select-none", className)}>
      {/* Crown indicator if active */}
      {crownDesign?.badgeIcon && (
        <span className={cn("absolute left-1/2 -translate-x-1/2 z-20 drop-shadow-md animate-bounce pointer-events-none", currentSize.crown)}>
          {crownDesign.badgeIcon || '👑'}
        </span>
      )}

      {/* Aura / Profile Effect Layer */}
      {showEffect && effectType && effectType !== 'none' && (
        <div className="absolute inset-0 -m-2 rounded-full pointer-events-none z-0">
          {effectType === 'flame' && (
            <div className="w-full h-full rounded-full anim-flame-border opacity-80 blur-sm scale-110" />
          )}
          {effectType === 'golden_aura' && (
            <div className="w-full h-full rounded-full anim-gold-shine opacity-80 blur-sm scale-110" />
          )}
          {effectType === 'neon' && (
            <div className="w-full h-full rounded-full anim-neon-pulse opacity-80 blur-sm scale-110" />
          )}
          {effectType === 'emerald_sparkle' && (
            <div className="w-full h-full rounded-full anim-emerald-glow opacity-80 blur-sm scale-110" />
          )}
          {effectType === 'galaxy' && (
            <div className="w-full h-full rounded-full bg-gradient-to-tr from-purple-600 via-pink-500 to-blue-500 opacity-60 blur-md animate-pulse scale-115" />
          )}
        </div>
      )}

      {/* Main Avatar Container with Frame */}
      <div 
        className={cn(
          "rounded-full flex items-center justify-center bg-[#0d0d0d] overflow-hidden transition-all duration-300 relative z-10",
          currentSize.outer,
          frameBorderClass
        )}
        style={frameGlowStyle}
      >
        {effectivePhotoUrl ? (
          <img 
            src={effectivePhotoUrl} 
            alt={userObj?.displayName || 'Avatar'} 
            className="w-full h-full object-cover rounded-full"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1c1c1c] to-[#0a0a0a] text-[#D4AF37]">
            <UserIcon size={currentSize.icon} />
          </div>
        )}
      </div>

      {/* Corner Badge Indicator */}
      {showBadge && badgeDesign?.badgeIcon && (
        <div 
          className="absolute -bottom-1 -right-1 z-20 rounded-full px-1.5 py-0.5 border border-white/20 text-xs shadow-md flex items-center justify-center"
          style={{ 
            backgroundColor: badgeDesign.badgeBg || '#121212',
            color: badgeDesign.badgeColor || '#D4AF37'
          }}
        >
          <span>{badgeDesign.badgeIcon}</span>
        </div>
      )}
    </div>
  );
};
