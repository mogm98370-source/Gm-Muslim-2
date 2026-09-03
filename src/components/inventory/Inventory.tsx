import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, writeBatch, deleteField } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { InventoryItem, ProductType } from '../../types/store';
import { RARITY_INFO, TYPE_LABELS, isItemExpired } from '../../lib/cosmetics';
import { GMAvatar } from '../shared/GMAvatar';
import { GMName } from '../shared/GMName';
import { GMProfileCard } from '../shared/GMProfileCard';
import { Link } from 'react-router';
import { 
  Package, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Clock, 
  AlertTriangle, 
  ShoppingBag, 
  Crown, 
  Flame, 
  Palette, 
  Eye, 
  Trash2,
  RefreshCw
} from 'lucide-react';
import { cn } from '../Layout';

export const Inventory: React.FC = () => {
  const { user, userData } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'expired' | 'AVATAR' | 'FRAME' | 'BADGE' | 'NAME_COLOR' | 'NAME_STYLE' | 'PROFILE_EFFECT' | 'PROFILE_BG' | 'CROWN'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Subscribe to user inventory in Firestore
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const invRef = collection(db, 'users', user.uid, 'inventory');
    const unsubscribe = onSnapshot(invRef, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as InventoryItem));
      setItems(list);
      setLoading(false);
    }, (err) => {
      console.error("Inventory error:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Handle Equip Cosmetic
  const handleEquip = async (item: InventoryItem) => {
    if (!user) return;
    if (isItemExpired(item)) {
      alert("هذا العنصر منتهي الصلاحية ولا يمكن تفعيله");
      return;
    }

    setActionLoading(item.id);
    try {
      const userRef = doc(db, 'users', user.uid);
      const batch = writeBatch(db);

      if (item.type === 'AVATAR') {
        const avatarImage = item.imageUrl || item.design?.avatarUrl || '';
        batch.update(userRef, {
          photoURL: avatarImage,
          'activeCosmetics.avatar': {
            productId: item.productId,
            name: item.name,
            imageUrl: avatarImage,
            design: item.design,
            expiresAt: item.expiresAt || null
          }
        });
      } else {
        // Determine cosmetic key based on item type
        let cosmeticSlot = '';
        if (item.type === 'FRAME') cosmeticSlot = 'frame';
        else if (item.type === 'BADGE') cosmeticSlot = 'badge';
        else if (item.type === 'NAME_COLOR') cosmeticSlot = 'nameColor';
        else if (item.type === 'NAME_STYLE') cosmeticSlot = 'nameStyle';
        else if (item.type === 'PROFILE_EFFECT') cosmeticSlot = 'profileEffect';
        else if (item.type === 'PROFILE_BG') cosmeticSlot = 'profileBg';
        else if (item.type === 'PROFILE_CARD') cosmeticSlot = 'profileCard';
        else if (item.type === 'CROWN') cosmeticSlot = 'crown';

        if (cosmeticSlot) {
          // Update user document active cosmetic slot
          batch.update(userRef, {
            [`activeCosmetics.${cosmeticSlot}`]: {
              productId: item.productId,
              name: item.name,
              design: item.design,
              expiresAt: item.expiresAt || null
            },
            // Also maintain legacy fields for backward compatibility
            ...(item.type === 'FRAME' && { activeFrame: item.productId, activeFrameName: item.name }),
            ...(item.type === 'BADGE' && { activeBadge: item.productId, activeBadgeName: item.name }),
            ...(item.type === 'NAME_COLOR' && { activeNameColor: item.productId, activeNameColorName: item.name }),
            ...(item.type === 'NAME_STYLE' && { activeNameStyle: item.productId, activeNameStyleName: item.name }),
            ...(item.type === 'PROFILE_EFFECT' && { activeEffect: item.productId, activeEffectName: item.name })
          });
        }
      }

      await batch.commit();
    } catch (e: any) {
      console.error("Error equipping item:", e);
      alert("فشل تفعيل العنصر. يرجى المحاولة مرة أخرى.");
    } finally {
      setActionLoading(null);
    }
  };

  // Handle Unequip Cosmetic
  const handleUnequip = async (item: InventoryItem) => {
    if (!user) return;
    setActionLoading(item.id);

    try {
      const userRef = doc(db, 'users', user.uid);
      const batch = writeBatch(db);

      if (item.type === 'AVATAR') {
        batch.update(userRef, {
          'activeCosmetics.avatar': deleteField(),
          photoURL: deleteField()
        });
      } else {
        let cosmeticSlot = '';
        if (item.type === 'FRAME') cosmeticSlot = 'frame';
        else if (item.type === 'BADGE') cosmeticSlot = 'badge';
        else if (item.type === 'NAME_COLOR') cosmeticSlot = 'nameColor';
        else if (item.type === 'NAME_STYLE') cosmeticSlot = 'nameStyle';
        else if (item.type === 'PROFILE_EFFECT') cosmeticSlot = 'profileEffect';
        else if (item.type === 'PROFILE_BG') cosmeticSlot = 'profileBg';
        else if (item.type === 'PROFILE_CARD') cosmeticSlot = 'profileCard';
        else if (item.type === 'CROWN') cosmeticSlot = 'crown';

        if (cosmeticSlot) {
          batch.update(userRef, {
            [`activeCosmetics.${cosmeticSlot}`]: deleteField(),
            ...(item.type === 'FRAME' && { activeFrame: deleteField(), activeFrameName: deleteField() }),
            ...(item.type === 'BADGE' && { activeBadge: deleteField(), activeBadgeName: deleteField() }),
            ...(item.type === 'NAME_COLOR' && { activeNameColor: deleteField(), activeNameColorName: deleteField() }),
            ...(item.type === 'NAME_STYLE' && { activeNameStyle: deleteField(), activeNameStyleName: deleteField() }),
            ...(item.type === 'PROFILE_EFFECT' && { activeEffect: deleteField(), activeEffectName: deleteField() })
          });
        }
      }

      await batch.commit();
    } catch (e: any) {
      console.error("Error unequipping item:", e);
      alert("فشل إلغاء التفعيل.");
    } finally {
      setActionLoading(null);
    }
  };

  // Check if an item is currently equipped by user
  const isItemEquipped = (item: InventoryItem): boolean => {
    if (!userData) return false;
    const active = userData.activeCosmetics;

    if (item.type === 'AVATAR') {
      return active?.avatar?.productId === item.productId || (!!userData.photoURL && (userData.photoURL === item.imageUrl || userData.photoURL === item.design?.avatarUrl));
    }

    if (!active) return false;
    if (item.type === 'FRAME') return active.frame?.productId === item.productId;
    if (item.type === 'BADGE') return active.badge?.productId === item.productId;
    if (item.type === 'NAME_COLOR') return active.nameColor?.productId === item.productId;
    if (item.type === 'NAME_STYLE') return active.nameStyle?.productId === item.productId;
    if (item.type === 'PROFILE_EFFECT') return active.profileEffect?.productId === item.productId;
    if (item.type === 'PROFILE_BG') return active.profileBg?.productId === item.productId;
    if (item.type === 'PROFILE_CARD') return active.profileCard?.productId === item.productId;
    if (item.type === 'CROWN') return active.crown?.productId === item.productId;
    return false;
  };

  // Filter items
  const filteredItems = items.filter(item => {
    const expired = isItemExpired(item);
    const equipped = isItemEquipped(item);

    if (filter === 'active') return equipped && !expired;
    if (filter === 'expired') return expired;
    if (filter === 'all') return true;
    return item.type === filter;
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0a2319] via-[#0e1d17] to-[#0a110e] border border-emerald-500/30 rounded-3xl p-6 md:p-8 text-[#E0E0E0] relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/15 rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#D4AF37]/15 rounded-full blur-[90px] pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 text-center md:text-right">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-bold">
              <Package size={14} />
              <span>مقتنياتي وتخصيص المظهر</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-l from-[#D4AF37] via-amber-200 to-[#E0E0E0]">
              خزانة المقتنيات الخاصة بي
            </h1>
            <p className="text-white/60 text-sm max-w-lg">
              إدارة جميع الإطارات، الشارات، تأثيرات الاسم وهالات الحساب التي تمتلكها وتفعيلها بضغطة زر.
            </p>
          </div>

          <Link
            to="/store"
            className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-l from-[#D4AF37] to-[#F59E0B] text-black font-black rounded-2xl hover:opacity-95 transition-all text-sm shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:scale-105"
          >
            <ShoppingBag size={18} />
            <span>زيارة المتجر</span>
          </Link>
        </div>
      </div>

      {/* Live Profile Card Preview of Currently Equipped Cosmetics */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-bold text-sm text-[#D4AF37] flex items-center gap-2">
            <Sparkles size={16} />
            معاينة حسابك المباشرة بالعناصر المفعلة حالياً
          </h3>
          <span className="text-xs text-white/40">تحديث فوري</span>
        </div>
        <GMProfileCard userObj={userData} />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'all', label: `الكل (${items.length})` },
          { id: 'active', label: `النشطة حالياً` },
          { id: 'AVATAR', label: 'الصور الرمزية' },
          { id: 'FRAME', label: 'الإطارات' },
          { id: 'BADGE', label: 'الشارات' },
          { id: 'NAME_COLOR', label: 'ألوان الاسم' },
          { id: 'NAME_STYLE', label: 'تأثيرات الاسم' },
          { id: 'PROFILE_EFFECT', label: 'تأثير الملف' },
          { id: 'PROFILE_BG', label: 'الخلفيات' },
          { id: 'CROWN', label: 'التيجان' },
          { id: 'expired', label: 'المنتهية ⏳' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={cn(
              "px-4 py-2 rounded-2xl text-xs md:text-sm font-bold transition-all whitespace-nowrap border",
              filter === tab.id
                ? "bg-gradient-to-l from-[#D4AF37] to-[#F59E0B] text-black border-[#D4AF37] shadow-md"
                : "bg-[#101514] text-white/60 border-white/5 hover:border-emerald-500/30 hover:text-white"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse bg-[#101514] h-64 rounded-3xl border border-white/5" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-[#101514] rounded-3xl border border-white/5 space-y-4">
          <Package className="mx-auto text-white/20" size={54} />
          <h3 className="text-lg font-bold text-white/70">لا توجد عناصر في هذا القسم</h3>
          <p className="text-xs text-white/40 max-w-sm mx-auto">
            تفضل بزيارة GM Store لاكتشاف أحدث الإطارات والشارات والتأثيرات الحصرية لحسابك.
          </p>
          <Link
            to="/store"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-900/40 text-emerald-300 border border-emerald-500/30 font-bold rounded-xl text-xs hover:bg-emerald-800/40 transition-colors"
          >
            <ShoppingBag size={14} /> تصفح المتجر الآن
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map(item => {
            const expired = isItemExpired(item);
            const equipped = isItemEquipped(item);
            const rarity = RARITY_INFO[item.rarity] || RARITY_INFO.common;
            const typeInfo = TYPE_LABELS[item.type] || { label: item.type, icon: '📦' };
            const isProcessing = actionLoading === item.id;

            return (
              <div
                key={item.id}
                className={cn(
                  "bg-[#101514] rounded-3xl p-6 border transition-all duration-300 relative flex flex-col justify-between shadow-lg",
                  equipped 
                    ? "border-emerald-500/60 shadow-[0_0_25px_rgba(16,185,129,0.15)] bg-gradient-to-b from-[#121c18] to-[#101514]" 
                    : expired 
                    ? "border-red-900/30 opacity-60" 
                    : "border-white/5 hover:border-emerald-500/30"
                )}
              >
                {/* Active / Expired Ribbon */}
                <div className="flex items-center justify-between mb-4">
                  <span className={cn("text-[10px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wider", rarity.color, rarity.bg, rarity.border)}>
                    {rarity.label}
                  </span>

                  {equipped ? (
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 shadow-sm">
                      <CheckCircle2 size={12} /> مفعّل حالياً
                    </span>
                  ) : expired ? (
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
                      <XCircle size={12} /> منتهي الصلاحية
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/5 text-white/50 border border-white/10">
                      جاهز للتفعيل
                    </span>
                  )}
                </div>

                {/* Item Content & Preview */}
                <div className="flex items-center gap-4 mb-5">
                  <div className="flex-shrink-0">
                    {item.type === 'AVATAR' ? (
                      <GMAvatar
                        userObj={userData}
                        size="md"
                        previewDesign={{
                          ...item.design,
                          avatarUrl: item.imageUrl || item.design?.avatarUrl
                        }}
                        previewType="AVATAR"
                      />
                    ) : item.type === 'FRAME' || item.type === 'PROFILE_EFFECT' ? (
                      <GMAvatar
                        userObj={userData}
                        size="md"
                        previewDesign={item.design}
                        previewType={item.type}
                      />
                    ) : item.type === 'CROWN' || item.type === 'BADGE' ? (
                      <div className="w-14 h-14 rounded-2xl bg-[#16201c] border border-[#D4AF37]/30 flex items-center justify-center text-2xl shadow-inner">
                        <span>{item.design?.badgeIcon || '👑'}</span>
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-[#16201c] border border-emerald-500/30 flex items-center justify-center text-2xl shadow-inner">
                        <span>{typeInfo.icon}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-base text-[#E0E0E0] truncate">
                      {item.name}
                    </h4>
                    <p className="text-xs text-emerald-400/90 font-medium mt-0.5">
                      {typeInfo.label}
                    </p>
                    <p className="text-[11px] text-white/40 mt-1 flex items-center gap-1">
                      <Clock size={11} className="text-[#D4AF37]" />
                      {item.isPermanent ? 'دائم ♾️' : (item.expiresAt ? `ينتهي: ${new Date(item.expiresAt).toLocaleDateString('ar-EG')}` : `${item.durationDays || 30} يوم`)}
                    </p>
                  </div>
                </div>

                {/* Equip / Unequip Actions */}
                <div className="pt-4 border-t border-white/5 flex gap-2">
                  {equipped ? (
                    <button
                      onClick={() => handleUnequip(item)}
                      disabled={isProcessing}
                      className="w-full py-2.5 bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <XCircle size={15} />
                      <span>{isProcessing ? 'جاري...' : 'إلغاء التفعيل'}</span>
                    </button>
                  ) : expired ? (
                    <button
                      disabled
                      className="w-full py-2.5 bg-white/5 text-white/30 border border-white/5 rounded-xl font-bold text-xs cursor-not-allowed flex items-center justify-center gap-1.5"
                    >
                      <AlertTriangle size={15} />
                      انتهت صلاحية العنصر
                    </button>
                  ) : (
                    <button
                      onClick={() => handleEquip(item)}
                      disabled={isProcessing}
                      className="w-full py-2.5 bg-gradient-to-l from-[#D4AF37] to-[#F59E0B] hover:opacity-95 text-black font-black rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <CheckCircle2 size={15} />
                      <span>{isProcessing ? 'جاري التفعيل...' : 'تفعيل على حسابي'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
