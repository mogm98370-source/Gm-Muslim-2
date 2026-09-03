export type ProductType = 
  | 'AVATAR'
  | 'FRAME' 
  | 'BADGE' 
  | 'NAME_COLOR' 
  | 'NAME_STYLE' 
  | 'PROFILE_EFFECT' 
  | 'PROFILE_BG' 
  | 'PROFILE_CARD' 
  | 'CROWN' 
  | 'SUBSCRIPTION';

export type ProductRarity = 
  | 'common' 
  | 'rare' 
  | 'epic' 
  | 'legendary' 
  | 'mythic' 
  | 'exclusive';

export interface CosmeticDesign {
  // Avatar image or url if type is AVATAR
  avatarUrl?: string;
  avatarShape?: 'circle' | 'squircle' | 'hexagon' | 'octagon';

  // Border & Frame
  borderColor?: string;
  borderWidth?: number;
  borderStyle?: 'solid' | 'double' | 'gradient' | 'gold-shine' | 'flame-border' | 'neon-pulse' | 'galaxy-spin' | 'emerald-glow';
  borderGradient?: string;
  borderRadius?: string;
  
  // Glow & Shadow
  glowColor?: string;
  glowIntensity?: 'none' | 'low' | 'medium' | 'high' | 'ultra';
  
  // Text & Name
  textColor?: string;
  textGradient?: string;
  textShadow?: string;
  textAnimation?: 'none' | 'shimmer' | 'flame' | 'neon' | 'galaxy' | 'rainbow' | 'glow-pulse';
  
  // Badge & Crown
  badgeIcon?: string;
  badgeText?: string;
  badgeColor?: string;
  badgeBg?: string;
  badgePosition?: 'right' | 'left';
  
  // Profile Effects & Aura
  effectType?: 'none' | 'flame' | 'neon' | 'galaxy' | 'golden_aura' | 'emerald_sparkle' | 'royal_shimmer' | 'diamond_glitter' | 'pulse';
  effectColor?: string;
  
  // Background & Card
  bgGradient?: string;
  bgPattern?: string;
  bgImage?: string;
  cardStyle?: 'glass' | 'gold-border' | 'emerald-border' | 'cosmic-dark' | 'royal-velvet' | 'cyber-glow';
}

export interface Product {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  type: ProductType;
  price: number;
  isFree?: boolean;
  isPermanent: boolean;
  durationDays?: number;
  rarity: ProductRarity;
  isGiftable?: boolean;
  requiredPrimeLevel?: number;
  isActive: boolean;
  design: CosmeticDesign;
  salesCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface InventoryItem {
  id: string;
  productId: string;
  name: string;
  description?: string;
  type: ProductType;
  rarity: ProductRarity;
  design: CosmeticDesign;
  imageUrl?: string;
  isPermanent: boolean;
  durationDays?: number;
  purchasedAt: string;
  expiresAt?: string | null;
  isEquipped?: boolean;
}

export interface ActiveCosmetics {
  avatar?: { productId: string; name: string; imageUrl?: string; design: CosmeticDesign; expiresAt?: string | null } | null;
  frame?: { productId: string; name: string; design: CosmeticDesign; expiresAt?: string | null } | null;
  badge?: { productId: string; name: string; design: CosmeticDesign; expiresAt?: string | null } | null;
  nameColor?: { productId: string; name: string; design: CosmeticDesign; expiresAt?: string | null } | null;
  nameStyle?: { productId: string; name: string; design: CosmeticDesign; expiresAt?: string | null } | null;
  profileEffect?: { productId: string; name: string; design: CosmeticDesign; expiresAt?: string | null } | null;
  profileBg?: { productId: string; name: string; design: CosmeticDesign; expiresAt?: string | null } | null;
  profileCard?: { productId: string; name: string; design: CosmeticDesign; expiresAt?: string | null } | null;
  crown?: { productId: string; name: string; design: CosmeticDesign; expiresAt?: string | null } | null;
}

export interface AdminAuditLog {
  id?: string;
  adminId: string;
  adminEmail: string;
  action: 'DELETE_CODE' | 'DELETE_PRODUCT' | 'CREATE_PRODUCT' | 'EDIT_PRODUCT' | 'MODIFY_GEMS' | 'BAN_USER' | 'SEND_MAIL';
  targetId: string;
  details: string;
  createdAt: string;
}

export type SupportStatus = 'open' | 'needs_reply' | 'closed';

export interface SupportMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'user' | 'admin';
  senderPhoto?: string;
  message: string;
  attachment?: string;
  createdAt: string;
  read: boolean;
  type: 'text' | 'image';
}

export interface SupportConversation {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhoto?: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadForAdmin: number;
  unreadForUser: number;
  status: SupportStatus;
  createdAt: string;
  updatedAt: string;
}

export type TicketStatus = 'pending' | 'in_progress' | 'resolved' | 'closed';

export type TicketCategory = 
  | 'account' // مشكلة في الحساب
  | 'store' // مشكلة في المتجر
  | 'gems' // مشكلة في Gems
  | 'product' // مشكلة في منتج
  | 'prime' // مشكلة في Prime
  | 'quran' // مشكلة في القرآن
  | 'prayer' // مشكلة في مواقيت الصلاة
  | 'technical' // مشكلة تقنية
  | 'suggestion' // اقتراح
  | 'other'; // أخرى

export interface TicketMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'user' | 'admin';
  senderPhoto?: string;
  text: string;
  attachment?: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhoto?: string;
  subject: string;
  category: TicketCategory;
  categoryLabel: string;
  message: string;
  attachment?: string;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  assignedAdmin?: string;
  adminReply?: string;
  messages: TicketMessage[];
}

export interface PointTransaction {
  id?: string;
  userId: string;
  amount: number;
  reason: string;
  type: 'purchase' | 'add' | 'deduct' | 'reward' | 'code';
  productId?: string;
  createdAt: string;
  adminId?: string;
}
