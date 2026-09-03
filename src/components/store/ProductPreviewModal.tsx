import React from 'react';
import { Product } from '../../types/store';
import { GMAvatar } from '../shared/GMAvatar';
import { GMName } from '../shared/GMName';
import { GMProfileCard } from '../shared/GMProfileCard';
import { RARITY_INFO, TYPE_LABELS } from '../../lib/cosmetics';
import { X, Gem, CheckCircle2, AlertCircle, ShoppingBag, Sparkles, Clock, ShieldCheck } from 'lucide-react';
import { cn } from '../Layout';

interface ProductPreviewModalProps {
  product: Product;
  userObj: any;
  isOwned: boolean;
  onClose: () => void;
  onPurchase: (product: Product) => void;
  purchasing: boolean;
  purchaseMsg?: { status: 'loading' | 'success' | 'error'; msg?: string } | null;
}

export const ProductPreviewModal: React.FC<ProductPreviewModalProps> = ({
  product,
  userObj,
  isOwned,
  onClose,
  onPurchase,
  purchasing,
  purchaseMsg
}) => {
  const typeInfo = TYPE_LABELS[product.type] || { label: product.type, icon: '🛍️', desc: '' };
  const rarityInfo = RARITY_INFO[product.rarity] || RARITY_INFO.common;
  const userGems = userObj?.gmPoints || 0;
  const canAfford = product.isFree || userGems >= product.price;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-[#101413] border border-emerald-500/30 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200 text-[#E0E0E0]"
        onClick={e => e.stopPropagation()}
        dir="rtl"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-gradient-to-l from-emerald-950/40 via-[#101413] to-[#101413]">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{typeInfo.icon}</span>
            <div>
              <h3 className="font-black text-xl text-[#E0E0E0]">{product.name}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider", rarityInfo.color, rarityInfo.bg, rarityInfo.border)}>
                  {rarityInfo.label}
                </span>
                <span className="text-xs text-white/40">•</span>
                <span className="text-xs text-emerald-400/90 font-medium">{typeInfo.label}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Live Preview Container */}
        <div className="p-6 space-y-6">
          <div className="bg-[#0a0d0c] border border-white/5 rounded-2xl p-6 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
              <span className="text-xs font-bold text-[#D4AF37] flex items-center gap-1.5">
                <Sparkles size={15} />
                معاينة حية على حسابك
              </span>
              <span className="text-[11px] text-white/40">
                كيف سيظهر العنصر عند التفعيل
              </span>
            </div>

            {/* Depending on type, show avatar or full card */}
            {['PROFILE_BG', 'PROFILE_CARD', 'PROFILE_EFFECT'].includes(product.type) ? (
              <GMProfileCard 
                userObj={userObj} 
                previewDesign={product.design} 
                previewType={product.type} 
                compact={true}
              />
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-4 bg-gradient-to-b from-white/[0.02] to-transparent rounded-2xl p-4">
                <GMAvatar 
                  userObj={userObj} 
                  size="xl" 
                  previewDesign={{
                    ...product.design,
                    avatarUrl: product.type === 'AVATAR' ? (product.imageUrl || product.design?.avatarUrl) : undefined
                  }} 
                  previewType={product.type} 
                />
                <div className="space-y-2 text-center sm:text-right">
                  <p className="text-xs text-white/40 uppercase tracking-widest">عرض الاسم والصورة</p>
                  <div className="text-2xl">
                    <GMName 
                      userObj={userObj} 
                      previewDesign={product.design} 
                      previewType={product.type} 
                    />
                  </div>
                  <p className="text-xs text-emerald-400/80">
                    مظهر حقيقي مرتبط ببيانات تصميم العنصر
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Product Info & Properties */}
          <div className="space-y-3">
            <p className="text-sm text-white/70 leading-relaxed bg-[#161c1a]/50 p-4 rounded-xl border border-white/5">
              {product.description}
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-[#161c1a]/40 border border-white/5 p-3 rounded-xl flex items-center gap-2.5">
                <Clock size={16} className="text-[#D4AF37]" />
                <div>
                  <span className="text-white/40 block">المدة الصلاحية:</span>
                  <span className="font-bold text-white">
                    {product.isPermanent ? 'دائم مدى الحياة ♾️' : `${product.durationDays || 30} يومًا ⏳`}
                  </span>
                </div>
              </div>
              <div className="bg-[#161c1a]/40 border border-white/5 p-3 rounded-xl flex items-center gap-2.5">
                <ShieldCheck size={16} className="text-emerald-400" />
                <div>
                  <span className="text-white/40 block">الإهداء:</span>
                  <span className="font-bold text-white">
                    {product.isGiftable ? 'قابل للإهداء 🎁' : 'شخصي فقط'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Messages if any */}
          {purchaseMsg && (
            <div className={cn(
              "p-3 rounded-xl text-xs flex items-center gap-2 border",
              purchaseMsg.status === 'success' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
            )}>
              {purchaseMsg.status === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{purchaseMsg.msg}</span>
            </div>
          )}

          {/* Action Bar */}
          <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-2xl font-black text-[#D4AF37]">
                <Gem size={22} className="text-[#D4AF37]" />
                <span>{product.isFree ? 'مجاني' : product.price}</span>
              </div>
              <div className="text-[11px] text-white/40 border-r border-white/10 pr-3">
                <span>رصيدك: </span>
                <span className={cn("font-bold", canAfford ? "text-white" : "text-red-400")}>
                  {userGems} 💎
                </span>
              </div>
            </div>

            {isOwned ? (
              <button 
                disabled 
                className="w-full sm:w-auto px-8 py-3 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold rounded-xl text-sm flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={18} />
                أنت تمتلك هذا العنصر بالفعل
              </button>
            ) : (
              <button
                onClick={() => onPurchase(product)}
                disabled={purchasing || !canAfford || !product.isActive}
                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-l from-[#D4AF37] to-[#F59E0B] text-black font-black rounded-xl hover:opacity-95 transition-all text-sm shadow-[0_0_20px_rgba(212,175,55,0.3)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <ShoppingBag size={18} />
                <span>{purchasing ? 'جاري إتمام الشراء...' : (canAfford ? 'تأكيد وشراء الآن' : 'رصيدك غير كافٍ')}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
