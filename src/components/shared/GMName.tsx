import React from 'react';
import { cn } from '../Layout';
import { getPrimeLevel } from '../../lib/prime';
import { CosmeticDesign, ProductType } from '../../types/store';
import { isItemExpired } from '../../lib/cosmetics';

interface GMNameProps {
  userObj?: any;
  className?: string;
  previewDesign?: CosmeticDesign;
  previewType?: ProductType;
  showBadge?: boolean;
}

export const GMName: React.FC<GMNameProps> = ({
  userObj,
  className = '',
  previewDesign,
  previewType,
  showBadge = true
}) => {
  const name = userObj?.displayName || 'مستخدم GM';
  const primeInfo = userObj ? getPrimeLevel(userObj.totalEarnedPoints || 0) : null;

  // Active items from user document
  let activeColor = userObj?.activeCosmetics?.nameColor || userObj?.activeNameColorData;
  let activeStyle = userObj?.activeCosmetics?.nameStyle || userObj?.activeNameStyleData;
  let activeBadge = userObj?.activeCosmetics?.badge || userObj?.activeBadgeData;
  let activeCrown = userObj?.activeCosmetics?.crown || userObj?.activeCrownData;

  // Check expiry
  if (activeColor && isItemExpired(activeColor)) activeColor = null;
  if (activeStyle && isItemExpired(activeStyle)) activeStyle = null;
  if (activeBadge && isItemExpired(activeBadge)) activeBadge = null;
  if (activeCrown && isItemExpired(activeCrown)) activeCrown = null;

  // Apply preview design override if in store preview
  if (previewDesign) {
    if (previewType === 'NAME_COLOR') activeColor = { design: previewDesign };
    if (previewType === 'NAME_STYLE') activeStyle = { design: previewDesign };
    if (previewType === 'BADGE') activeBadge = { design: previewDesign };
    if (previewType === 'CROWN') activeCrown = { design: previewDesign };
  }

  const colorDesign: CosmeticDesign | undefined = activeColor?.design;
  const styleDesign: CosmeticDesign | undefined = activeStyle?.design;
  const badgeDesign: CosmeticDesign | undefined = activeBadge?.design;
  const crownDesign: CosmeticDesign | undefined = activeCrown?.design;

  // Base style
  let nameClass = primeInfo && primeInfo.level >= 5 ? primeInfo.color : "text-[#E0E0E0]";
  let customStyle: React.CSSProperties = {};

  // Apply Name Color
  if (colorDesign) {
    if (colorDesign.textGradient) {
      nameClass = "text-transparent bg-clip-text";
      customStyle.backgroundImage = colorDesign.textGradient;
    } else if (colorDesign.textColor) {
      nameClass = "";
      customStyle.color = colorDesign.textColor;
    }

    if (colorDesign.textShadow) {
      customStyle.textShadow = colorDesign.textShadow;
    }
  }

  // Apply Name Style / Animation
  if (styleDesign) {
    const anim = styleDesign.textAnimation;
    if (anim === 'galaxy') {
      nameClass = "anim-galaxy-text font-black tracking-wide";
    } else if (anim === 'flame') {
      nameClass = "anim-flame-text font-bold";
    } else if (anim === 'shimmer' || anim === 'glow-pulse') {
      nameClass = "anim-gold-text font-bold";
    } else if (styleDesign.textGradient) {
      nameClass = "text-transparent bg-clip-text";
      customStyle.backgroundImage = styleDesign.textGradient;
    }

    if (styleDesign.textShadow) {
      customStyle.textShadow = styleDesign.textShadow;
    }
  }

  // Fallback for legacy userObj activeNameStyleName strings
  if (!colorDesign && !styleDesign && userObj?.activeNameStyleName) {
    const styleName = userObj.activeNameStyleName.toLowerCase();
    if (styleName.includes('متدرج') || styleName.includes('gradient')) {
      nameClass = "text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-amber-200 to-[#D4AF37]";
    } else if (styleName.includes('ماسي') || styleName.includes('diamond')) {
      nameClass = "text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-200 to-cyan-300 font-black tracking-wider";
    } else if (styleName.includes('نار') || styleName.includes('flame')) {
      nameClass = "text-orange-500 font-bold drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]";
    }
  }

  return (
    <span className={cn("inline-flex items-center gap-1.5 align-middle select-none", className)}>
      {/* Crown */}
      {crownDesign?.badgeIcon && (
        <span className="text-base drop-shadow animate-bounce">
          {crownDesign.badgeIcon}
        </span>
      )}

      {/* Name Text */}
      <span 
        className={cn("font-bold transition-all duration-300", nameClass)}
        style={customStyle}
      >
        {name}
      </span>

      {/* Badge */}
      {showBadge && badgeDesign?.badgeIcon && (
        <span 
          className="text-xs px-1.5 py-0.5 rounded font-bold border border-white/10 shadow-sm inline-flex items-center gap-1"
          style={{
            backgroundColor: badgeDesign.badgeBg || 'rgba(212, 175, 55, 0.15)',
            color: badgeDesign.badgeColor || '#D4AF37'
          }}
        >
          <span>{badgeDesign.badgeIcon}</span>
          {badgeDesign.badgeText && <span className="text-[10px] tracking-wider">{badgeDesign.badgeText}</span>}
        </span>
      )}

      {/* Prime Badge fallback if no custom badge */}
      {showBadge && !badgeDesign && primeInfo?.hasSpecialBadge && (
        <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30">
          {primeInfo.badge}
        </span>
      )}
    </span>
  );
};
