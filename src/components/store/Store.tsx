import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, writeBatch, increment, setDoc, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { Product, ProductType } from '../../types/store';
import { DEFAULT_STORE_PRODUCTS, RARITY_INFO, TYPE_LABELS } from '../../lib/cosmetics';
import { ProductPreviewModal } from './ProductPreviewModal';
import { GMAvatar } from '../shared/GMAvatar';
import { GMName } from '../shared/GMName';
import { Link } from 'react-router';
import { 
  ShoppingBag, 
  Search, 
  Gem, 
  Package, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  Flame,
  Crown,
  ShieldCheck,
  Clock,
  Filter
} from 'lucide-react';
import { cn } from '../Layout';

export const Store: React.FC = () => {
  const { user, userData, isAdmin } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [ownedProductIds, setOwnedProductIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedRarity, setSelectedRarity] = useState<string>('ALL');
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  
  const [purchaseState, setPurchaseState] = useState<{
    id: string;
    status: 'loading' | 'success' | 'error';
    msg?: string;
  } | null>(null);

  // Fetch products from Firebase & seed if empty
  useEffect(() => {
    let unsubscribeProducts: () => void;
    let unsubscribeInventory: () => void;

    const initStore = async () => {
      try {
        const prodRef = collection(db, 'products');
        
        unsubscribeProducts = onSnapshot(prodRef, async (snap) => {
          if (snap.empty) {
            // Seed default products
            const batch = writeBatch(db);
            const defaultProds: Product[] = [];
            for (const item of DEFAULT_STORE_PRODUCTS) {
              const newDoc = doc(prodRef);
              const prodObj: Product = { id: newDoc.id, ...item };
              batch.set(newDoc, prodObj);
              defaultProds.push(prodObj);
            }
            await batch.commit();
            setProducts(defaultProds);
          } else {
            const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
            setProducts(fetched);
          }
          setLoading(false);
        });

        // Fetch user's owned items
        if (user) {
          const invRef = collection(db, 'users', user.uid, 'inventory');
          unsubscribeInventory = onSnapshot(invRef, (invSnap) => {
            const ids = new Set<string>();
            invSnap.forEach(d => {
              const data = d.data();
              if (data.productId) ids.add(data.productId);
            });
            setOwnedProductIds(ids);
          });
        }
      } catch (err) {
        console.error("Store fetch error:", err);
        setLoading(false);
      }
    };

    initStore();

    return () => {
      if (unsubscribeProducts) unsubscribeProducts();
      if (unsubscribeInventory) unsubscribeInventory();
    };
  }, [user]);

  // Real purchase workflow
  const handlePurchase = async (product: Product) => {
    if (!user || !userData) {
      alert("يرجى تسجيل الدخول أولاً لإتمام عملية الشراء");
      return;
    }

    if (!product.isActive) {
      setPurchaseState({ id: product.id, status: 'error', msg: 'هذا المنتج غير متاح حالياً' });
      return;
    }

    const currentGems = userData.gmPoints || 0;
    if (!product.isFree && currentGems < product.price) {
      setPurchaseState({ id: product.id, status: 'error', msg: 'رصيدك من الجواهر غير كافٍ!' });
      return;
    }

    // Check Prime Requirement if any
    if (product.requiredPrimeLevel && (userData.totalEarnedPoints || 0) < product.requiredPrimeLevel) {
      setPurchaseState({ id: product.id, status: 'error', msg: `يتطلب مستوى Prime ${product.requiredPrimeLevel}` });
      return;
    }

    setPurchaseState({ id: product.id, status: 'loading' });

    try {
      const userRef = doc(db, 'users', user.uid);
      const batch = writeBatch(db);

      // 1. Deduct Gems
      if (!product.isFree && product.price > 0) {
        batch.update(userRef, {
          gmPoints: increment(-product.price)
        });
      }

      // 2. Calculate Expiration
      let expiresAt: string | null = null;
      if (!product.isPermanent && product.durationDays) {
        const expDate = new Date();
        expDate.setDate(expDate.getDate() + product.durationDays);
        expiresAt = expDate.toISOString();
      }

      // 3. Add to user's inventory subcollection
      const inventoryDocRef = doc(collection(db, 'users', user.uid, 'inventory'));
      const inventoryItem = {
        id: inventoryDocRef.id,
        productId: product.id,
        name: product.name,
        description: product.description || '',
        type: product.type,
        rarity: product.rarity,
        design: product.design,
        imageUrl: product.imageUrl || '',
        isPermanent: product.isPermanent,
        durationDays: product.durationDays || 0,
        purchasedAt: new Date().toISOString(),
        expiresAt: expiresAt,
        isEquipped: false
      };
      batch.set(inventoryDocRef, inventoryItem);

      // 4. Record Transaction log
      const txRef = doc(collection(db, 'pointTransactions'));
      batch.set(txRef, {
        userId: user.uid,
        amount: -product.price,
        reason: `شراء من المتجر: ${product.name}`,
        type: 'purchase',
        productId: product.id,
        createdAt: new Date().toISOString()
      });

      // 5. Increment product sales count
      const prodRef = doc(db, 'products', product.id);
      batch.update(prodRef, {
        salesCount: increment(1)
      });

      // Commit Batch atomically
      await batch.commit();

      setPurchaseState({
        id: product.id,
        status: 'success',
        msg: 'تم الشراء بنجاح! يمكنك تفعيله الآن من صفحة مقتنياتي'
      });

      setOwnedProductIds(prev => new Set([...prev, product.id]));

      setTimeout(() => {
        setPurchaseState(null);
      }, 3500);

    } catch (err: any) {
      console.error("Purchase error:", err);
      setPurchaseState({
        id: product.id,
        status: 'error',
        msg: err.message || 'فشلت عملية الشراء. يرجى المحاولة لاحقاً.'
      });
      setTimeout(() => setPurchaseState(null), 4000);
    }
  };

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.description.toLowerCase().includes(search.toLowerCase());
    const matchesType = selectedType === 'ALL' || p.type === selectedType;
    const matchesRarity = selectedRarity === 'ALL' || p.rarity === selectedRarity;
    return matchesSearch && matchesType && matchesRarity && (p.isActive || isAdmin);
  });

  const categoryTabs = [
    { id: 'ALL', label: 'جميع المنتجات', icon: '✨' },
    { id: 'FRAME', label: 'إطارات الحساب', icon: '🖼️' },
    { id: 'BADGE', label: 'الشارات', icon: '🏷️' },
    { id: 'NAME_COLOR', label: 'ألوان الاسم', icon: '🎨' },
    { id: 'NAME_STYLE', label: 'تأثيرات الاسم', icon: '✨' },
    { id: 'PROFILE_EFFECT', label: 'تأثير الملف', icon: '🔥' },
    { id: 'PROFILE_BG', label: 'الخلفيات', icon: '🌌' },
    { id: 'CROWN', label: 'التيجان', icon: '👑' }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Luxury Store Hero Header */}
      <div className="bg-gradient-to-r from-[#063323] via-[#0b1f18] to-[#0a1410] border border-emerald-500/30 rounded-3xl p-6 md:p-8 text-[#E0E0E0] relative overflow-hidden shadow-2xl">
        {/* Glow lights */}
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-emerald-500/20 rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-[#D4AF37]/20 rounded-full blur-[90px] pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="text-center md:text-right space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-bold">
              <Sparkles size={14} />
              <span>GM STORE — متجر التخصيص والمقتنيات الفاخرة</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-l from-[#D4AF37] via-amber-200 to-[#E0E0E0]">
              متجر GM Muslim
            </h1>
            <p className="text-white/60 text-sm max-w-xl">
              تسوّق إطارات الحساب، الشارات الملكية، ألوان وتأثيرات الأسماء الحقيقية واجعل ملفك الشخصي مميزاً وفريداً.
            </p>
          </div>

          {/* User Balance & Quick Nav to Inventory */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <div className="bg-black/50 backdrop-blur-md border border-[#D4AF37]/40 rounded-2xl p-4 min-w-[150px] text-center shadow-lg">
              <div className="flex items-center justify-center gap-1.5 text-[#D4AF37] text-xs font-bold mb-1">
                <Gem size={15} />
                <span>رصيدك من الجواهر</span>
              </div>
              <p className="text-3xl font-black text-white">{userData?.gmPoints || 0}</p>
            </div>

            <Link
              to="/inventory"
              className="flex items-center gap-2.5 px-5 py-4 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 font-bold rounded-2xl transition-all shadow-lg hover:scale-105 group"
            >
              <Package size={22} className="group-hover:rotate-12 transition-transform" />
              <div className="text-right">
                <span className="block text-xs font-normal text-emerald-400/70">انتقل إلى</span>
                <span className="text-sm font-black">مقتنياتي 📦</span>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categoryTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedType(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs md:text-sm font-bold transition-all whitespace-nowrap border",
              selectedType === tab.id
                ? "bg-gradient-to-l from-[#D4AF37] to-[#F59E0B] text-black border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.3)] scale-105"
                : "bg-[#101514] text-white/60 border-white/5 hover:border-emerald-500/30 hover:text-white hover:bg-[#141c19]"
            )}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
          <input
            type="text"
            placeholder="ابحث عن إطار، شارة، اسم ملون أو تأثير..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#101514] border border-emerald-900/30 rounded-2xl py-3 pr-11 pl-4 text-sm focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent outline-none text-[#E0E0E0] placeholder-white/30"
          />
        </div>

        <select
          value={selectedRarity}
          onChange={(e) => setSelectedRarity(e.target.value)}
          className="bg-[#101514] border border-emerald-900/30 rounded-2xl px-4 py-3 text-xs md:text-sm text-white outline-none focus:border-[#D4AF37]"
        >
          <option value="ALL">جميع مستويات الندرة</option>
          <option value="common">شائع (Common)</option>
          <option value="rare">نادر (Rare)</option>
          <option value="epic">ممتاز (Epic)</option>
          <option value="legendary">أسطوري (Legendary)</option>
          <option value="mythic">خرافي (Mythic)</option>
          <option value="exclusive">VIP حصري</option>
        </select>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse bg-[#101514] h-80 rounded-3xl border border-white/5" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-[#101514] rounded-3xl border border-white/5 space-y-3">
          <Package className="mx-auto text-white/20" size={48} />
          <p className="text-white/60 font-bold">لا توجد منتجات مطابقة لخيارات البحث</p>
          <p className="text-xs text-white/40">جرّب تغيير التصنيف أو كلمة البحث</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => {
            const isOwned = ownedProductIds.has(product.id);
            const state = purchaseState?.id === product.id ? purchaseState : null;
            const rarity = RARITY_INFO[product.rarity] || RARITY_INFO.common;
            const typeInfo = TYPE_LABELS[product.type] || { label: product.type, icon: '🛍️' };

            return (
              <div
                key={product.id}
                className="bg-[#101514] rounded-3xl overflow-hidden border border-emerald-950/60 hover:border-emerald-500/40 transition-all duration-300 flex flex-col group relative shadow-lg hover:shadow-2xl"
              >
                {/* Rarity & Duration Tag */}
                <div className="absolute top-3 right-3 left-3 z-20 flex items-center justify-between pointer-events-none">
                  <span className={cn("text-[10px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wider shadow-sm", rarity.color, rarity.bg, rarity.border)}>
                    {rarity.label}
                  </span>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white/70 border border-white/10 flex items-center gap-1">
                    <Clock size={11} className="text-[#D4AF37]" />
                    {product.isPermanent ? 'دائم' : `${product.durationDays} يوم`}
                  </span>
                </div>

                {/* Visual Preview Showcase Area */}
                <div className="h-44 bg-gradient-to-b from-[#141b18] to-[#0d1210] relative flex items-center justify-center p-4 border-b border-white/5 overflow-hidden">
                  {/* Background effects */}
                  <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors" />

                  {/* Dynamic item visual rendering */}
                  <div className="relative z-10 transform group-hover:scale-110 transition-transform duration-500">
                    {product.type === 'FRAME' || product.type === 'PROFILE_EFFECT' ? (
                      <GMAvatar
                        userObj={userData}
                        size="lg"
                        previewDesign={product.design}
                        previewType={product.type}
                      />
                    ) : product.type === 'NAME_COLOR' || product.type === 'NAME_STYLE' ? (
                      <div className="text-center p-3 bg-black/40 rounded-2xl border border-white/10">
                        <GMName
                          userObj={userData}
                          className="text-lg"
                          previewDesign={product.design}
                          previewType={product.type}
                        />
                      </div>
                    ) : product.type === 'CROWN' || product.type === 'BADGE' ? (
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-4xl drop-shadow-lg animate-bounce">
                          {product.design.badgeIcon || '👑'}
                        </span>
                        {product.design.badgeText && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30">
                            {product.design.badgeText}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-[#16201c] border border-[#D4AF37]/30 flex items-center justify-center text-3xl shadow-lg">
                        {typeInfo.icon}
                      </div>
                    )}
                  </div>

                  {/* Live Preview Overlay Button */}
                  <button
                    onClick={() => setPreviewProduct(product)}
                    className="absolute bottom-2 left-2 z-20 px-2.5 py-1 rounded-xl bg-black/70 hover:bg-black text-white/80 hover:text-white text-[11px] font-bold border border-white/10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Eye size={13} className="text-[#D4AF37]" />
                    معاينة حية
                  </button>
                </div>

                {/* Details Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold mb-1">
                      <span>{typeInfo.icon}</span>
                      <span>{typeInfo.label}</span>
                    </div>
                    <h3 className="font-bold text-base text-[#E0E0E0] group-hover:text-[#D4AF37] transition-colors line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="text-xs text-white/50 mt-1 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  {/* Purchase State Message */}
                  {state && (
                    <div className={cn(
                      "p-2.5 rounded-xl text-xs flex items-center gap-1.5 border",
                      state.status === 'success' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                    )}>
                      {state.status === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                      <span className="line-clamp-2">{state.msg}</span>
                    </div>
                  )}

                  {/* Price & Actions */}
                  <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-[#D4AF37] font-black text-lg">
                      <Gem size={18} className="text-[#D4AF37]" />
                      <span>{product.isFree ? 'مجاني' : product.price}</span>
                    </div>

                    {isOwned ? (
                      <Link
                        to="/inventory"
                        className="px-4 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 font-bold rounded-xl border border-emerald-500/30 text-xs flex items-center gap-1 transition-colors"
                      >
                        <CheckCircle2 size={14} />
                        مقتنى (تفعيل)
                      </Link>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setPreviewProduct(product)}
                          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-colors"
                          title="معاينة"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handlePurchase(product)}
                          disabled={state?.status === 'loading' || !product.isActive}
                          className="px-4 py-2 bg-gradient-to-l from-[#D4AF37] to-[#F59E0B] hover:opacity-95 text-black font-black rounded-xl transition-all text-xs shadow-md disabled:opacity-50"
                        >
                          {state?.status === 'loading' ? 'جاري...' : 'شراء'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Interactive Live Preview Modal */}
      {previewProduct && (
        <ProductPreviewModal
          product={previewProduct}
          userObj={userData}
          isOwned={ownedProductIds.has(previewProduct.id)}
          onClose={() => setPreviewProduct(null)}
          onPurchase={(p) => handlePurchase(p)}
          purchasing={purchaseState?.id === previewProduct.id && purchaseState?.status === 'loading'}
          purchaseMsg={purchaseState?.id === previewProduct.id ? purchaseState : null}
        />
      )}
    </div>
  );
};
