import { CosmeticDesign, InventoryItem, Product, ProductType, TicketCategory, TicketStatus } from '../types/store';

export const CATEGORY_NAMES: Record<TicketCategory, string> = {
  account: 'مشكلة في الحساب',
  store: 'مشكلة في المتجر',
  gems: 'مشكلة في Gems 💎',
  product: 'مشكلة في منتج',
  prime: 'مشكلة في Prime 👑',
  quran: 'مشكلة في القرآن',
  prayer: 'مشكلة في مواقيت الصلاة',
  technical: 'مشكلة تقنية ⚡',
  suggestion: 'اقتراح 💡',
  other: 'أخرى 📌'
};

export const STATUS_LABELS: Record<TicketStatus, { label: string; color: string; bg: string; border: string }> = {
  pending: {
    label: 'قيد المراجعة 🟡',
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
    border: 'border-amber-400/30'
  },
  in_progress: {
    label: 'جاري التعامل 🔵',
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
    border: 'border-blue-400/30'
  },
  resolved: {
    label: 'تم الحل 🟢',
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    border: 'border-emerald-400/30'
  },
  closed: {
    label: 'مغلق 🔴',
    color: 'text-red-400',
    bg: 'bg-red-400/10',
    border: 'border-red-400/30'
  }
};

export const TYPE_LABELS: Record<ProductType, { label: string; icon: string; desc: string }> = {
  AVATAR: { label: 'صورة بروفايل (Avatar)', icon: '🖼️', desc: 'أفاتار فاخر ومميز يزين حسابك' },
  FRAME: { label: 'إطار الحساب', icon: '🖼️', desc: 'إطار مميز حول صورة ملفك الشخصي' },
  BADGE: { label: 'شعار / Badge', icon: '🏷️', desc: 'شارة خاصة تظهر بجانب اسمك' },
  NAME_COLOR: { label: 'لون الاسم', icon: '🎨', desc: 'تلوين اسمك في كافة أرجاء التطبيق' },
  NAME_STYLE: { label: 'تأثير الاسم', icon: '✨', desc: 'تأثيرات متحركة وتوهج ولمعان لاسمك' },
  PROFILE_EFFECT: { label: 'تأثير الملف', icon: '🔥', desc: 'تأثير وهالة حية حول بطاقة حسابك' },
  PROFILE_BG: { label: 'خلفية Profile', icon: '🌌', desc: 'خلفية مخصصة وفخمة لملفك الشخصي' },
  PROFILE_CARD: { label: 'بطاقة VIP', icon: '🪪', desc: 'تصميم متكامل لبطاقة العضوية' },
  CROWN: { label: 'تاج ملكي', icon: '👑', desc: 'تاج فخم بجانب اسمك' },
  SUBSCRIPTION: { label: 'اشتراك Prime', icon: '🏆', desc: 'باقة اشتراك سنوية أو شهرية' }
};

export const RARITY_INFO: Record<string, { label: string; color: string; border: string; bg: string }> = {
  common: { label: 'شائع', color: 'text-zinc-400', border: 'border-zinc-500/30', bg: 'bg-zinc-500/10' },
  rare: { label: 'نادر', color: 'text-blue-400', border: 'border-blue-500/30', bg: 'bg-blue-500/10' },
  epic: { label: 'ممتاز (Epic)', color: 'text-purple-400', border: 'border-purple-500/30', bg: 'bg-purple-500/10' },
  legendary: { label: 'أسطوري', color: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/10' },
  mythic: { label: 'خرافي (Mythic)', color: 'text-rose-400', border: 'border-rose-500/30', bg: 'bg-rose-500/10' },
  exclusive: { label: 'VIP حصري', color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10' }
};

/**
 * Checks if a cosmetic or inventory item is expired
 */
export function isItemExpired(item: { expiresAt?: string | null }): boolean {
  if (!item || !item.expiresAt) return false;
  return new Date(item.expiresAt).getTime() < Date.now();
}

/**
 * Generates initial default real products for GM Store if empty in Firestore
 */
export const DEFAULT_STORE_PRODUCTS: Omit<Product, 'id'>[] = [
  {
    name: 'Royal Islamic Knight Avatar',
    description: 'صورة بروفايل ملكية لفارس إسلامي بدروع ذهبية ووشاح زمردي فاخر',
    type: 'AVATAR',
    imageUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&auto=format&fit=crop&q=80',
    price: 300,
    isPermanent: true,
    rarity: 'legendary',
    isActive: true,
    isGiftable: true,
    design: {
      borderColor: '#D4AF37',
      borderWidth: 3,
      borderStyle: 'gold-shine',
      glowColor: 'rgba(212, 175, 55, 0.6)',
      glowIntensity: 'high',
      effectType: 'royal_shimmer'
    },
    salesCount: 68,
    createdAt: new Date().toISOString()
  },
  {
    name: 'Emerald Scholar Avatar',
    description: 'أفاتار فاخر للعالم المسلم بنور العلم وهيبة الرداء الزمردي الأنيق',
    type: 'AVATAR',
    imageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80',
    price: 250,
    isPermanent: true,
    rarity: 'epic',
    isActive: true,
    isGiftable: true,
    design: {
      borderColor: '#10B981',
      borderWidth: 3,
      borderStyle: 'emerald-glow',
      glowColor: 'rgba(16, 185, 129, 0.6)',
      glowIntensity: 'medium',
      effectType: 'emerald_sparkle'
    },
    salesCount: 45,
    createdAt: new Date().toISOString()
  },
  {
    name: 'Cosmic Galaxy Sheikh Avatar',
    description: 'أفاتار كوني أسطوري محاط بوهج المجرات وأطياف النجوم اللامعة',
    type: 'AVATAR',
    imageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&auto=format&fit=crop&q=80',
    price: 500,
    isPermanent: true,
    rarity: 'mythic',
    isActive: true,
    isGiftable: true,
    design: {
      borderColor: '#A855F7',
      borderWidth: 3,
      borderStyle: 'galaxy-spin',
      glowColor: 'rgba(168, 85, 247, 0.8)',
      glowIntensity: 'ultra',
      effectType: 'galaxy'
    },
    salesCount: 82,
    createdAt: new Date().toISOString()
  },
  {
    name: 'Golden Royal Frame',
    description: 'إطار ذهبي ملكي متوهج ومطرز بالذهب الخالص حول صورة الحساب',
    type: 'FRAME',
    price: 350,
    isPermanent: true,
    rarity: 'legendary',
    isActive: true,
    isGiftable: true,
    design: {
      borderColor: '#D4AF37',
      borderWidth: 4,
      borderStyle: 'gold-shine',
      glowColor: 'rgba(212, 175, 55, 0.7)',
      glowIntensity: 'high',
      effectType: 'golden_aura'
    },
    salesCount: 42,
    createdAt: new Date().toISOString()
  },
  {
    name: 'Emerald Name Color',
    description: 'اسم باللون الأخضر الزمردي الإسلامي الفاخر يظهر في كل مكان',
    type: 'NAME_COLOR',
    price: 150,
    isPermanent: true,
    rarity: 'rare',
    isActive: true,
    isGiftable: true,
    design: {
      textColor: '#10B981',
      textGradient: 'linear-gradient(90deg, #34D399 0%, #10B981 50%, #059669 100%)',
      textShadow: '0 0 12px rgba(16, 185, 129, 0.5)'
    },
    salesCount: 88,
    createdAt: new Date().toISOString()
  },
  {
    name: 'Elite VIP Badge',
    description: 'شعار النخبة الذهبي بجانب اسم المستخدم مع بريق ولمعان دائم',
    type: 'BADGE',
    price: 200,
    isPermanent: true,
    rarity: 'epic',
    isActive: true,
    isGiftable: true,
    design: {
      badgeIcon: '⭐',
      badgeText: 'ELITE',
      badgeColor: '#F59E0B',
      badgeBg: 'rgba(245, 158, 11, 0.15)',
      glowColor: 'rgba(245, 158, 11, 0.5)'
    },
    salesCount: 65,
    createdAt: new Date().toISOString()
  },
  {
    name: 'Flame Profile Effect',
    description: 'تأثير ناري مشتعل وحيوي يحيط بملفك الشخصي وصورتك',
    type: 'PROFILE_EFFECT',
    price: 500,
    isPermanent: false,
    durationDays: 30,
    rarity: 'mythic',
    isActive: true,
    isGiftable: true,
    design: {
      effectType: 'flame',
      glowColor: 'rgba(249, 115, 22, 0.8)',
      glowIntensity: 'ultra',
      borderColor: '#EA580C',
      borderStyle: 'flame-border'
    },
    salesCount: 29,
    createdAt: new Date().toISOString()
  },
  {
    name: 'Galaxy Cosmic Name',
    description: 'تأثير المجرة الكوني المتحرك مع تدرج أرجواني وسماوي لاسمك',
    type: 'NAME_STYLE',
    price: 450,
    isPermanent: true,
    rarity: 'mythic',
    isActive: true,
    isGiftable: true,
    design: {
      textAnimation: 'galaxy',
      textGradient: 'linear-gradient(90deg, #A855F7 0%, #EC4899 50%, #3B82F6 100%)',
      textShadow: '0 0 16px rgba(168, 85, 247, 0.6)'
    },
    salesCount: 54,
    createdAt: new Date().toISOString()
  },
  {
    name: 'Royal Crown Badge',
    description: 'تاج ملكي مرصع بالجواهر يعلو اسمك بكل فخامة',
    type: 'CROWN',
    price: 600,
    isPermanent: true,
    rarity: 'exclusive',
    isActive: true,
    isGiftable: true,
    design: {
      badgeIcon: '👑',
      badgeText: 'ROYAL',
      badgeColor: '#FCD34D',
      badgeBg: 'rgba(252, 211, 77, 0.2)',
      glowColor: 'rgba(212, 175, 55, 0.8)'
    },
    salesCount: 37,
    createdAt: new Date().toISOString()
  },
  {
    name: 'Cyber Neon Frame',
    description: 'إطار نيون سايبر مشع بضوء أزرق سماوي نابض',
    type: 'FRAME',
    price: 280,
    isPermanent: false,
    durationDays: 14,
    rarity: 'epic',
    isActive: true,
    isGiftable: true,
    design: {
      borderColor: '#06B6D4',
      borderWidth: 3,
      borderStyle: 'neon-pulse',
      glowColor: 'rgba(6, 182, 212, 0.8)',
      glowIntensity: 'high',
      effectType: 'neon'
    },
    salesCount: 19,
    createdAt: new Date().toISOString()
  },
  {
    name: 'Islamic Damascus Card',
    description: 'خلفية وبطاقة إسلامية فاخرة بنقوش دمشقية وخيوط الذهب',
    type: 'PROFILE_BG',
    price: 400,
    isPermanent: true,
    rarity: 'legendary',
    isActive: true,
    isGiftable: true,
    design: {
      bgGradient: 'linear-gradient(135deg, #064E3B 0%, #022C22 50%, #011610 100%)',
      cardStyle: 'emerald-border',
      glowColor: 'rgba(16, 185, 129, 0.4)'
    },
    salesCount: 22,
    createdAt: new Date().toISOString()
  }
];
