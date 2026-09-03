import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  setDoc, 
  updateDoc, 
  writeBatch,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { 
  Plus, 
  Trash2, 
  Users, 
  ShoppingBag, 
  BookOpen, 
  Heart, 
  Ticket, 
  Crown, 
  Mail, 
  Send, 
  Sun, 
  LayoutDashboard,
  LifeBuoy,
  Edit,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Gem,
  MessageSquare,
  ShieldCheck,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { cn } from '../Layout';
import { PointModal } from './PointModal';
import { Product, ProductType, ProductRarity, CosmeticDesign, SupportTicket, TicketStatus } from '../../types/store';
import { STATUS_LABELS, CATEGORY_NAMES, RARITY_INFO, TYPE_LABELS } from '../../lib/cosmetics';
import { GMAvatar } from '../shared/GMAvatar';
import { GMName } from '../shared/GMName';
import { GMProfileCard } from '../shared/GMProfileCard';
import { AdminSupportCenter } from './AdminSupportCenter';

export const Admin = () => {
  const { isAdmin, user, userData } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'support' | 'products' | 'users' | 'mail' | 'codes' | 'adhkar' | 'duas'>('dashboard');
  
  const [stats, setStats] = useState({ users: 0, products: 0, tickets: 0, openTickets: 0, codes: 0 });
  const [products, setProducts] = useState<Product[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [adhkarList, setAdhkarList] = useState<any[]>([]);
  const [duasList, setDuasList] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [codesList, setCodesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Support Filter State
  const [ticketStatusFilter, setTicketStatusFilter] = useState<'all' | TicketStatus>('all');
  const [selectedTicketForChat, setSelectedTicketForChat] = useState<SupportTicket | null>(null);

  // Product Form State
  const [isEditingProduct, setIsEditingProduct] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<{
    name: string;
    description: string;
    imageUrl?: string;
    type: ProductType;
    price: number;
    isFree: boolean;
    isPermanent: boolean;
    durationDays: number;
    rarity: ProductRarity;
    isActive: boolean;
    isGiftable: boolean;
    design: CosmeticDesign;
  }>({
    name: '',
    description: '',
    imageUrl: '',
    type: 'FRAME',
    price: 250,
    isFree: false,
    isPermanent: true,
    durationDays: 30,
    rarity: 'rare',
    isActive: true,
    isGiftable: true,
    design: {
      borderColor: '#D4AF37',
      borderWidth: 3,
      borderStyle: 'gold-shine',
      glowColor: 'rgba(212, 175, 55, 0.6)',
      glowIntensity: 'medium',
      textColor: '#D4AF37',
      badgeIcon: '⭐',
      badgeText: 'VIP',
      effectType: 'golden_aura',
      cardStyle: 'gold-border'
    }
  });

  const [newDhikr, setNewDhikr] = useState({ text: '', count: 1, category: 'عام' });
  const [newDua, setNewDua] = useState({ text: '', source: '' });
  const [newCode, setNewCode] = useState({ code: '', type: 'points', value: 100, maxUses: 1, durationDays: 7 });
  const [newMail, setNewMail] = useState({ recipientId: 'all', subject: '', body: '', attachedGems: 0 });

  const [selectedUserForPoints, setSelectedUserForPoints] = useState<any>(null);

  useEffect(() => {
    if (!isAdmin) return;

    let unsubTickets: () => void;
    let unsubProducts: () => void;
    let unsubConversations: () => void;

    const fetchData = async () => {
      try {
        const [uSnap, aSnap, dSnap, cSnap] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'adhkar')),
          getDocs(collection(db, 'duas')),
          getDocs(collection(db, 'codes'))
        ]);
        
        setUsersList(uSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setAdhkarList(aSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setDuasList(dSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setCodesList(cSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        // Realtime listener for Products
        unsubProducts = onSnapshot(collection(db, 'products'), (pSnap) => {
          const prods = pSnap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
          setProducts(prods);
          setStats(prev => ({ ...prev, products: pSnap.size }));
        });

        // Realtime listener for Support Conversations
        unsubConversations = onSnapshot(collection(db, 'supportConversations'), (convSnap) => {
          let openCount = 0;
          convSnap.forEach(d => {
            const data = d.data();
            if ((data.unreadForAdmin && data.unreadForAdmin > 0) || data.status === 'needs_reply') {
              openCount++;
            }
          });
          setStats(prev => ({
            ...prev,
            users: uSnap.size,
            tickets: convSnap.size,
            openTickets: openCount,
            codes: cSnap.size
          }));
        });

      } catch (e) {
        console.error("Admin fetch error", e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      if (unsubProducts) unsubProducts();
      if (unsubTickets) unsubTickets();
      if (unsubConversations) unsubConversations();
    };
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="p-12 text-center bg-[#101514] border border-red-500/30 rounded-3xl max-w-lg mx-auto space-y-4">
        <ShieldCheck className="mx-auto text-red-400" size={48} />
        <h2 className="text-xl font-black text-red-400">غير مصرح بالدخول</h2>
        <p className="text-sm text-white/60">هذه الصفحة مخصصة لمدراء نظام GM Muslim فقط.</p>
      </div>
    );
  }

  // Handle Save / Edit Product
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const now = new Date().toISOString();
      if (isEditingProduct) {
        const prodRef = doc(db, 'products', isEditingProduct);
        await updateDoc(prodRef, {
          ...productForm,
          updatedAt: now
        });

        // Audit Log
        if (user) {
          await addDoc(collection(db, 'adminAuditLogs'), {
            adminId: user.uid,
            adminEmail: user.email || userData?.email || 'admin',
            action: 'EDIT_PRODUCT',
            targetId: isEditingProduct,
            details: `Updated product "${productForm.name}" (${productForm.type})`,
            createdAt: now
          });
        }

        alert('تم تعديل المنتج بنجاح في المتجر!');
        setIsEditingProduct(null);
      } else {
        const docRef = await addDoc(collection(db, 'products'), {
          ...productForm,
          salesCount: 0,
          createdAt: now,
          updatedAt: now
        });

        // Audit Log
        if (user) {
          await addDoc(collection(db, 'adminAuditLogs'), {
            adminId: user.uid,
            adminEmail: user.email || userData?.email || 'admin',
            action: 'CREATE_PRODUCT',
            targetId: docRef.id,
            details: `Created new product "${productForm.name}" (${productForm.type}) for ${productForm.price} GP`,
            createdAt: now
          });
        }

        alert('تمت إضافة المنتج ونشره في GM Store بنجاح!');
      }

      // Reset form
      setProductForm({
        name: '',
        description: '',
        imageUrl: '',
        type: 'FRAME',
        price: 250,
        isFree: false,
        isPermanent: true,
        durationDays: 30,
        rarity: 'rare',
        isActive: true,
        isGiftable: true,
        design: {
          borderColor: '#D4AF37',
          borderWidth: 3,
          borderStyle: 'gold-shine',
          glowColor: 'rgba(212, 175, 55, 0.6)',
          glowIntensity: 'medium',
          textColor: '#D4AF37',
          badgeIcon: '⭐',
          badgeText: 'VIP',
          effectType: 'golden_aura',
          cardStyle: 'gold-border'
        }
      });
    } catch (e: any) {
      console.error(e);
      alert('خطأ في حفظ المنتج: ' + e.message);
    }
  };

  const handleEditProductClick = (prod: Product) => {
    setIsEditingProduct(prod.id);
    setProductForm({
      name: prod.name,
      description: prod.description || '',
      imageUrl: prod.imageUrl || '',
      type: prod.type,
      price: prod.price || 0,
      isFree: prod.isFree || false,
      isPermanent: prod.isPermanent ?? true,
      durationDays: prod.durationDays || 30,
      rarity: prod.rarity || 'common',
      isActive: prod.isActive ?? true,
      isGiftable: prod.isGiftable ?? true,
      design: prod.design || {}
    });
  };

  const handleToggleProductStatus = async (prod: Product) => {
    try {
      const prodRef = doc(db, 'products', prod.id);
      await updateDoc(prodRef, {
        isActive: !prod.isActive
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Support Ticket Actions
  const handleUpdateTicketStatus = async (ticketId: string, newStatus: TicketStatus) => {
    try {
      const ticketRef = doc(db, 'supportTickets', ticketId);
      await updateDoc(ticketRef, {
        status: newStatus,
        updatedAt: new Date().toISOString(),
        assignedAdmin: userData?.displayName || 'Admin'
      });
    } catch (err) {
      console.error("Error updating ticket status:", err);
      alert("فشل تحديث حالة التذكرة.");
    }
  };

  const handleSendMail = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'mail'), {
        ...newMail,
        senderId: user?.uid,
        createdAt: new Date().toISOString(),
        claimedBy: []
      });
      alert('تم إرسال البريد بنجاح!');
      setNewMail({ recipientId: 'all', subject: '', body: '', attachedGems: 0 });
    } catch (e) { console.error(e); alert('خطأ في إرسال البريد'); }
  };

  const handleAddDhikr = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const docRef = await addDoc(collection(db, 'adhkar'), newDhikr);
      setAdhkarList([...adhkarList, { id: docRef.id, ...newDhikr }]);
      setNewDhikr({ text: '', count: 1, category: 'عام' });
      alert('تمت الإضافة');
    } catch (e) { console.error(e); }
  };

  const handleAddDua = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const docRef = await addDoc(collection(db, 'duas'), newDua);
      setDuasList([...duasList, { id: docRef.id, ...newDua }]);
      setNewDua({ text: '', source: '' });
      alert('تمت الإضافة');
    } catch (e) { console.error(e); }
  };

  const handleAddCode = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + Number(newCode.durationDays || 7));
      
      const normalizedCode = newCode.code.trim().toUpperCase();
      if (!normalizedCode) {
        alert('يرجى إدخال رمز الكود');
        return;
      }

      const numVal = Math.max(1, Number(newCode.value) || 1);
      const isPoints = newCode.type === 'points';

      const codeData: any = { 
        code: normalizedCode, 
        maxUses: Math.max(1, Number(newCode.maxUses) || 1), 
        usedCount: 0, 
        expiresAt: expiresAt.toISOString(),
        usedBy: [],
        type: newCode.type || 'points',
        value: numVal,
        points: isPoints ? numVal : 0,
        subscriptionDays: !isPoints ? numVal : 0,
        createdAt: new Date().toISOString()
      };
      
      await setDoc(doc(db, 'codes', codeData.code), codeData);
      setCodesList([...codesList.filter(c => c.id !== codeData.code), { id: codeData.code, ...codeData }]);
      setNewCode({ code: '', type: 'points', value: 100, maxUses: 1, durationDays: 7 });
      alert(`تمت إضافة الكود "${codeData.code}" بنجاح (${isPoints ? `${numVal} نقطة` : `${numVal} يوم اشتراك`})`);
    } catch (e) { console.error(e); alert('فشل إضافة الكود'); }
  };

  const handleDelete = async (col: string, id: string, setList?: any, list?: any[]) => {
    if (!confirm('هل أنت متأكد من الحذف نهائياً؟ هذا الإجراء لا يمكن التراجع عنه.')) return;
    try {
      await deleteDoc(doc(db, col, id));
      if (setList && list) {
        setList(list.filter(item => item.id !== id));
      }

      // Record in adminAuditLogs
      if (user) {
        const actionType = col === 'products' ? 'DELETE_PRODUCT' : col === 'codes' ? 'DELETE_CODE' : 'BAN_USER';
        await addDoc(collection(db, 'adminAuditLogs'), {
          adminId: user.uid,
          adminEmail: user.email || userData?.email || 'admin',
          action: actionType,
          targetId: id,
          details: `Deleted ${col} document with ID: ${id}`,
          createdAt: new Date().toISOString()
        });
      }

      alert('تم الحذف بنجاح من قاعدة البيانات وتسجيل العملية.');
    } catch (e: any) { 
      console.error("Deletion error:", e); 
      alert('حدث خطأ أثناء الحذف: ' + (e.message || e));
    }
  };

  const handleAddPointsToUser = (userObj: any) => setSelectedUserForPoints(userObj);

  const submitPointUpdate = async (points: number, reason: string) => {
    if (!selectedUserForPoints) return;
    try {
      const totalEarned = selectedUserForPoints.totalEarnedPoints || 0;
      const currentPoints = selectedUserForPoints.gmPoints || 0;
      
      const updateData = { 
        gmPoints: currentPoints + points,
        totalEarnedPoints: points > 0 ? totalEarned + points : totalEarned 
      };
      
      const batch = writeBatch(db);
      batch.update(doc(db, 'users', selectedUserForPoints.id), updateData);
      
      batch.set(doc(collection(db, 'pointTransactions')), {
        userId: selectedUserForPoints.id,
        adminId: user?.uid,
        amount: points,
        reason: reason || 'تعديل إداري',
        type: points > 0 ? 'add' : 'deduct',
        createdAt: new Date().toISOString()
      });

      await batch.commit();
      setUsersList(usersList.map(u => u.id === selectedUserForPoints.id ? { ...u, ...updateData } : u));
      alert('تم تعديل رصيد المستخدم بنجاح');
    } catch (e) { console.error(e); alert('حدث خطأ'); }
  };

  // Filtered Tickets
  const filteredTickets = tickets.filter(t => {
    if (ticketStatusFilter === 'all') return true;
    return t.status === ticketStatusFilter;
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
      {/* Admin Hero Header */}
      <div className="bg-gradient-to-r from-[#0a271d] via-[#102019] to-[#091410] border border-emerald-500/30 rounded-3xl p-6 md:p-8 text-[#E0E0E0] relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#D4AF37]/15 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-bold mb-2">
              <ShieldCheck size={14} />
              <span>لوحة الإدارة الفائقة — GM Muslim Super Admin</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-l from-[#D4AF37] via-amber-200 to-[#E0E0E0]">
              مركز التحكم والقيادة
            </h1>
            <p className="text-white/60 text-sm mt-1">
              إدارة منتجات المتجر، الرد على تذاكر الدعم، إدارة المستخدمين والجواهر، الأكواد والرسائل.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-black/50 border border-emerald-500/30 p-3.5 rounded-2xl text-center">
              <span className="text-[10px] text-white/50 block font-bold">تذاكر مفتوحة</span>
              <span className="text-2xl font-black text-amber-400">{stats.openTickets}</span>
            </div>
            <div className="bg-black/50 border border-[#D4AF37]/30 p-3.5 rounded-2xl text-center">
              <span className="text-[10px] text-white/50 block font-bold">إجمالي المنتجات</span>
              <span className="text-2xl font-black text-[#D4AF37]">{products.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 bg-[#101514] p-2 rounded-2xl border border-white/5 overflow-x-auto">
        {[
          { id: 'dashboard', icon: LayoutDashboard, label: 'لوحة الإحصائيات' },
          { 
            id: 'support', 
            icon: LifeBuoy, 
            label: stats.openTickets > 0 ? `Support Center (${stats.openTickets} 🔴)` : 'Support Center' 
          },
          { id: 'products', icon: ShoppingBag, label: 'إدارة المتجر والمنتجات' },
          { id: 'users', icon: Users, label: 'المستخدمين و Gems' },
          { id: 'mail', icon: Mail, label: 'البريد والمكافآت' },
          { id: 'codes', icon: Ticket, label: 'الأكواد' },
          { id: 'adhkar', icon: Sun, label: 'الأذكار' },
          { id: 'duas', icon: Heart, label: 'الأدعية' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all whitespace-nowrap border",
              activeTab === tab.id
                ? "bg-gradient-to-l from-[#D4AF37] to-[#F59E0B] text-black border-[#D4AF37] shadow-md scale-105"
                : "bg-[#141a18] text-white/60 border-white/5 hover:border-emerald-500/30 hover:text-white"
            )}
          >
            <tab.icon size={16} /> <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* DASHBOARD TAB */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-[#101514] p-6 rounded-3xl border border-emerald-500/20 text-center space-y-1">
              <p className="text-white/40 text-xs font-bold">المستخدمين</p>
              <p className="text-3xl font-black text-emerald-400">{stats.users}</p>
            </div>
            <div className="bg-[#101514] p-6 rounded-3xl border border-[#D4AF37]/20 text-center space-y-1">
              <p className="text-white/40 text-xs font-bold">منتجات المتجر</p>
              <p className="text-3xl font-black text-[#D4AF37]">{products.length}</p>
            </div>
            <div className="bg-[#101514] p-6 rounded-3xl border border-amber-500/20 text-center space-y-1">
              <p className="text-white/40 text-xs font-bold">تذاكر الدعم</p>
              <p className="text-3xl font-black text-amber-400">{tickets.length}</p>
            </div>
            <div className="bg-[#101514] p-6 rounded-3xl border border-blue-500/20 text-center space-y-1">
              <p className="text-white/40 text-xs font-bold">الأكواد الفعالة</p>
              <p className="text-3xl font-black text-blue-400">{codesList.length}</p>
            </div>
            <div className="bg-[#101514] p-6 rounded-3xl border border-purple-500/20 text-center space-y-1">
              <p className="text-white/40 text-xs font-bold">الأذكار والأدعية</p>
              <p className="text-3xl font-black text-purple-400">{adhkarList.length + duasList.length}</p>
            </div>
          </div>
        </div>
      )}

      {/* SUPPORT CENTER TAB */}
      {activeTab === 'support' && (
        <AdminSupportCenter />
      )}

      {/* PRODUCTS & STORE MANAGEMENT TAB */}
      {activeTab === 'products' && (
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Product Form Editor */}
          <div className="lg:col-span-6 bg-[#101514] border border-emerald-500/30 p-6 rounded-3xl shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
              <h3 className="font-black text-lg text-white flex items-center gap-2">
                <Sparkles className="text-[#D4AF37]" size={20} />
                {isEditingProduct ? 'تعديل منتج في المتجر' : 'إنشاء منتج متجر حقيقي جديد'}
              </h3>
              {isEditingProduct && (
                <button
                  onClick={() => setIsEditingProduct(null)}
                  className="text-xs text-white/50 hover:text-white"
                >
                  إلغاء التعديل
                </button>
              )}
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-white/70">اسم المنتج <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  placeholder="مثال: Royal Golden Frame أو Emerald Name"
                  value={productForm.name}
                  onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full bg-[#141b18] border border-emerald-900/40 rounded-2xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-white/70">وصف المنتج</label>
                <textarea
                  placeholder="اكتب وصفاً جذاباً للمنتج..."
                  value={productForm.description}
                  onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full bg-[#141b18] border border-emerald-900/40 rounded-2xl px-4 py-2 text-sm text-white outline-none focus:border-[#D4AF37] h-20 resize-none"
                  required
                />
              </div>

              {/* Type and Rarity */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-white/70">نوع المنتج</label>
                  <select
                    value={productForm.type}
                    onChange={e => setProductForm({ ...productForm, type: e.target.value as ProductType })}
                    className="w-full bg-[#141b18] border border-emerald-900/40 rounded-2xl px-3 py-2.5 text-xs text-white outline-none focus:border-[#D4AF37]"
                  >
                    <option value="AVATAR">🖼️ صورة بروفايل (Profile Avatar)</option>
                    <option value="FRAME">🖼️ إطار الحساب (FRAME)</option>
                    <option value="BADGE">🏷️ شارة / Badge</option>
                    <option value="NAME_COLOR">🎨 لون الاسم (NAME_COLOR)</option>
                    <option value="NAME_STYLE">✨ تأثير الاسم (NAME_STYLE)</option>
                    <option value="PROFILE_EFFECT">🔥 تأثير الملف (PROFILE_EFFECT)</option>
                    <option value="PROFILE_BG">🌌 خلفية الملف (PROFILE_BG)</option>
                    <option value="PROFILE_CARD">🪪 بطاقة Profile Card</option>
                    <option value="CROWN">👑 تاج ملكي (CROWN)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-white/70">مستوى الندرة</label>
                  <select
                    value={productForm.rarity}
                    onChange={e => setProductForm({ ...productForm, rarity: e.target.value as ProductRarity })}
                    className="w-full bg-[#141b18] border border-emerald-900/40 rounded-2xl px-3 py-2.5 text-xs text-white outline-none focus:border-[#D4AF37]"
                  >
                    <option value="common">شائع (Common)</option>
                    <option value="rare">نادر (Rare)</option>
                    <option value="epic">ممتاز (Epic)</option>
                    <option value="legendary">أسطوري (Legendary)</option>
                    <option value="mythic">خرافي (Mythic)</option>
                    <option value="exclusive">VIP حصري (Exclusive)</option>
                  </select>
                </div>
              </div>

              {/* Price and Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-white/70">السعر (Gems / GP)</label>
                  <input
                    type="number"
                    min="0"
                    value={productForm.price || ''}
                    onChange={e => setProductForm({ ...productForm, price: Number(e.target.value) })}
                    className="w-full bg-[#141b18] border border-emerald-900/40 rounded-2xl px-4 py-2 text-sm text-white outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-white/70">المدة الصلاحية</label>
                  <div className="flex gap-2">
                    <select
                      value={productForm.isPermanent ? 'permanent' : 'temporary'}
                      onChange={e => setProductForm({ ...productForm, isPermanent: e.target.value === 'permanent' })}
                      className="bg-[#141b18] border border-emerald-900/40 rounded-2xl px-3 py-2 text-xs text-white outline-none focus:border-[#D4AF37]"
                    >
                      <option value="permanent">دائم ♾️</option>
                      <option value="temporary">مؤقت ⏳</option>
                    </select>

                    {!productForm.isPermanent && (
                      <input
                        type="number"
                        min="1"
                        placeholder="الأيام"
                        value={productForm.durationDays || ''}
                        onChange={e => setProductForm({ ...productForm, durationDays: Number(e.target.value) })}
                        className="flex-1 bg-[#141b18] border border-emerald-900/40 rounded-2xl px-3 py-2 text-xs text-white outline-none"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Visual Cosmetic Design Properties Customizer */}
              <div className="bg-[#141b18] border border-white/5 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-[#D4AF37] flex items-center gap-1.5">
                  <Sparkles size={14} />
                  تخصيص المظهر والتأثير البصري الحقيقي
                </h4>

                {/* If Avatar */}
                {productForm.type === 'AVATAR' && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] text-white/60 block mb-1">رابط صورة الأفاتار (Image URL)</label>
                      <input
                        type="url"
                        placeholder="https://..."
                        value={productForm.imageUrl || ''}
                        onChange={e => {
                          setProductForm({ 
                            ...productForm, 
                            imageUrl: e.target.value,
                            design: { ...productForm.design, avatarUrl: e.target.value }
                          });
                        }}
                        className="w-full bg-[#101514] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-white/60 block mb-1.5">أو اختر من النماذج الملكية الجاهزة:</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { name: 'فارس إسلامي', url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&auto=format&fit=crop&q=80' },
                          { name: 'عالم زمردي', url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80' },
                          { name: 'سلطان مجري', url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&auto=format&fit=crop&q=80' },
                        ].map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setProductForm({
                                ...productForm,
                                imageUrl: preset.url,
                                design: { ...productForm.design, avatarUrl: preset.url }
                              });
                            }}
                            className={cn(
                              "p-1.5 rounded-xl border text-[11px] font-bold transition-all flex items-center gap-1.5",
                              productForm.imageUrl === preset.url
                                ? "bg-emerald-500/20 border-emerald-400 text-emerald-300"
                                : "bg-white/5 border-white/10 text-white/70 hover:border-white/20"
                            )}
                          >
                            <img src={preset.url} alt={preset.name} className="w-5 h-5 rounded-full object-cover" referrerPolicy="no-referrer" />
                            <span>{preset.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* If Frame or Effect */}
                {(productForm.type === 'FRAME' || productForm.type === 'PROFILE_EFFECT') && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-white/60 block mb-1">ستايل الإطار والتوهج</label>
                      <select
                        value={productForm.design.borderStyle || 'gold-shine'}
                        onChange={e => setProductForm({ ...productForm, design: { ...productForm.design, borderStyle: e.target.value as any } })}
                        className="w-full bg-[#101514] border border-white/10 rounded-xl px-2 py-1.5 text-xs text-white"
                      >
                        <option value="gold-shine">ذهب مشع (Gold Shine)</option>
                        <option value="flame-border">لهب ناري (Flame Pulse)</option>
                        <option value="neon-pulse">نيون سايبر (Neon Pulse)</option>
                        <option value="emerald-glow">زمرد إسلامي (Emerald Glow)</option>
                        <option value="solid">صلب كلاسيكي (Solid)</option>
                        <option value="double">مزدوج ملكي (Double)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-white/60 block mb-1">الهالة والتأثير</label>
                      <select
                        value={productForm.design.effectType || 'golden_aura'}
                        onChange={e => setProductForm({ ...productForm, design: { ...productForm.design, effectType: e.target.value as any } })}
                        className="w-full bg-[#101514] border border-white/10 rounded-xl px-2 py-1.5 text-xs text-white"
                      >
                        <option value="golden_aura">هالة ذهبية</option>
                        <option value="flame">هالة نارية مشتعلة</option>
                        <option value="neon">هالة نيون زرقاء</option>
                        <option value="emerald_sparkle">بريق زمردي</option>
                        <option value="galaxy">سديم مجرة فضائي</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* If Badge or Crown */}
                {(productForm.type === 'BADGE' || productForm.type === 'CROWN') && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-white/60 block mb-1">رمز الأيقونة (Emoji)</label>
                      <input
                        type="text"
                        value={productForm.design.badgeIcon || '👑'}
                        onChange={e => setProductForm({ ...productForm, design: { ...productForm.design, badgeIcon: e.target.value } })}
                        className="w-full bg-[#101514] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-white/60 block mb-1">نص الشارة</label>
                      <input
                        type="text"
                        value={productForm.design.badgeText || ''}
                        onChange={e => setProductForm({ ...productForm, design: { ...productForm.design, badgeText: e.target.value } })}
                        className="w-full bg-[#101514] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white"
                      />
                    </div>
                  </div>
                )}

                {/* If Name Color or Name Style */}
                {(productForm.type === 'NAME_COLOR' || productForm.type === 'NAME_STYLE') && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-white/60 block mb-1">تأثير النص المتحرك</label>
                      <select
                        value={productForm.design.textAnimation || 'galaxy'}
                        onChange={e => setProductForm({ ...productForm, design: { ...productForm.design, textAnimation: e.target.value as any } })}
                        className="w-full bg-[#101514] border border-white/10 rounded-xl px-2 py-1.5 text-xs text-white"
                      >
                        <option value="galaxy">حركة المجرة (Galaxy Cosmic)</option>
                        <option value="flame">حركة اللهب (Flame Glow)</option>
                        <option value="shimmer">بريق ذهبي (Gold Shimmer)</option>
                        <option value="none">ثابت بدون حركة</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-white/60 block mb-1">لون النص (Hex / CSS)</label>
                      <input
                        type="text"
                        value={productForm.design.textColor || '#10B981'}
                        onChange={e => setProductForm({ ...productForm, design: { ...productForm.design, textColor: e.target.value } })}
                        className="w-full bg-[#101514] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Live Preview Inside Form */}
              <div className="bg-[#0b0e0d] border border-white/5 rounded-2xl p-4 text-center space-y-2">
                <span className="text-[11px] text-white/40 block">معاينة شكل المنتج الحقيقية</span>
                <div className="flex items-center justify-center gap-4 py-2">
                  <GMAvatar
                    userObj={userData}
                    size="md"
                    previewDesign={productForm.design}
                    previewType={productForm.type}
                  />
                  <div className="text-base">
                    <GMName
                      userObj={userData}
                      previewDesign={productForm.design}
                      previewType={productForm.type}
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-l from-[#D4AF37] to-[#F59E0B] text-black font-black rounded-2xl hover:opacity-95 transition-all text-sm shadow-md"
              >
                {isEditingProduct ? 'تحديث ونشر التعديل' : 'حفظ ونشر المنتج في المتجر 🚀'}
              </button>
            </form>
          </div>

          {/* Products List in Admin */}
          <div className="lg:col-span-6 space-y-4">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <ShoppingBag className="text-emerald-400" size={18} />
              المنتجات المنشورة في المتجر ({products.length})
            </h3>

            <div className="space-y-3 max-h-[750px] overflow-y-auto pr-1">
              {products.map(prod => {
                const rarity = RARITY_INFO[prod.rarity] || RARITY_INFO.common;
                const typeInfo = TYPE_LABELS[prod.type] || { label: prod.type, icon: '🛍️' };

                return (
                  <div
                    key={prod.id}
                    className="bg-[#101514] border border-white/5 hover:border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between gap-4 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[#141b18] border border-white/5 flex items-center justify-center text-2xl flex-shrink-0">
                        {typeInfo.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-sm">{prod.name}</h4>
                          <span className={cn("text-[9px] font-bold px-1.5 py-0.2 rounded border", rarity.color, rarity.bg, rarity.border)}>
                            {rarity.label}
                          </span>
                        </div>
                        <p className="text-xs text-[#D4AF37] font-bold mt-0.5">
                          {prod.isFree ? 'مجاني' : `${prod.price} Gems`} • {prod.salesCount || 0} مبيعات
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleProductStatus(prod)}
                        className={cn("p-2 rounded-xl transition-colors", prod.isActive ? "text-emerald-400 hover:bg-emerald-500/10" : "text-white/30 hover:bg-white/5")}
                        title={prod.isActive ? "المنتج نشط في المتجر" : "المنتج مخفي"}
                      >
                        {prod.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                      </button>

                      <button
                        onClick={() => handleEditProductClick(prod)}
                        className="p-2 text-white/60 hover:text-[#D4AF37] hover:bg-white/5 rounded-xl transition-colors"
                        title="تعديل"
                      >
                        <Edit size={16} />
                      </button>

                      <button
                        onClick={() => handleDelete('products', prod.id)}
                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                        title="حذف"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* USERS & GEMS TAB */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {usersList.map(u => (
              <div key={u.id} className="bg-[#101514] p-5 rounded-3xl border border-white/5 hover:border-emerald-500/30 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <GMAvatar userObj={u} size="md" />
                    <div>
                      <GMName userObj={u} className="text-base" />
                      <p className="text-xs text-white/40">{u.email}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/5 mt-3">
                  <div>
                    <span className="text-[#D4AF37] font-black text-sm block">{u.gmPoints || 0} Gems 💎</span>
                    <span className="text-white/40 text-[10px] block">إجمالي النقاط: {u.totalEarnedPoints || 0}</span>
                  </div>
                  <button
                    onClick={() => handleAddPointsToUser(u)}
                    className="px-3.5 py-1.5 bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 text-[#D4AF37] border border-[#D4AF37]/30 rounded-xl text-xs font-bold transition-colors"
                  >
                    تعديل الرصيد 💎
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MAIL & REWARDS TAB */}
      {activeTab === 'mail' && (
        <div className="bg-[#101514] border border-emerald-500/30 p-6 md:p-8 rounded-3xl shadow-xl max-w-2xl">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-[#D4AF37]">
            <Send size={20} /> إرسال رسائل ومكافآت (GM Mail)
          </h3>
          <form onSubmit={handleSendMail} className="space-y-4">
            <select
              value={newMail.recipientId}
              onChange={e => setNewMail({ ...newMail, recipientId: e.target.value })}
              className="w-full bg-[#141b18] border border-emerald-900/40 text-white rounded-2xl px-4 py-3 outline-none focus:border-[#D4AF37] text-sm"
            >
              <option value="all">إلى الجميع (جميع المستخدمين)</option>
              {usersList.map(u => (
                <option key={u.id} value={u.id}>{u.displayName || u.email}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="عنوان الرسالة (Subject)"
              value={newMail.subject}
              onChange={e => setNewMail({ ...newMail, subject: e.target.value })}
              className="w-full bg-[#141b18] border border-emerald-900/40 text-white rounded-2xl px-4 py-3 outline-none focus:border-[#D4AF37] text-sm"
              required
            />
            <textarea
              placeholder="محتوى الرسالة..."
              value={newMail.body}
              onChange={e => setNewMail({ ...newMail, body: e.target.value })}
              className="w-full bg-[#141b18] border border-emerald-900/40 text-white rounded-2xl px-4 py-3 outline-none focus:border-[#D4AF37] h-32 resize-none text-sm leading-relaxed"
              required
            />
            <div className="flex gap-4 items-center">
              <label className="text-white/60 text-xs whitespace-nowrap">مكافأة مرفقة (Gems):</label>
              <input
                type="number"
                min="0"
                value={newMail.attachedGems || ''}
                onChange={e => setNewMail({ ...newMail, attachedGems: Number(e.target.value) })}
                className="flex-1 bg-[#141b18] border border-emerald-900/40 text-white rounded-2xl px-4 py-2.5 outline-none focus:border-[#D4AF37] text-sm"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-l from-[#D4AF37] to-[#F59E0B] text-black font-black rounded-2xl py-3.5 hover:opacity-95 transition-opacity text-sm shadow-md"
            >
              إرسال البريد والمكافأة ✉️
            </button>
          </form>
        </div>
      )}

      {/* CODES TAB */}
      {activeTab === 'codes' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-[#101514] border border-emerald-500/30 p-6 rounded-3xl shadow-sm">
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2 text-[#D4AF37]"><Plus size={16} /> إنشاء كود خصم/مكافأة</h3>
            <form onSubmit={handleAddCode} className="space-y-4">
              <input
                type="text"
                placeholder="الكود (مثال: GMMUSLIM2026)"
                value={newCode.code}
                onChange={e => setNewCode({ ...newCode, code: e.target.value.toUpperCase() })}
                className="w-full bg-[#141b18] border border-emerald-900/40 text-white rounded-2xl px-4 py-2.5 outline-none focus:border-[#D4AF37] text-sm"
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <select
                  value={newCode.type}
                  onChange={e => setNewCode({ ...newCode, type: e.target.value })}
                  className="w-full bg-[#141b18] border border-emerald-900/40 text-white rounded-2xl px-4 py-2.5 outline-none focus:border-[#D4AF37] text-xs"
                >
                  <option value="points">نقاط (Gems / GP)</option>
                  <option value="subscription">اشتراك (أيام)</option>
                </select>
                <input
                  type="number"
                  placeholder="القيمة"
                  value={newCode.value || ''}
                  onChange={e => setNewCode({ ...newCode, value: Number(e.target.value) })}
                  className="w-full bg-[#141b18] border border-emerald-900/40 text-white rounded-2xl px-4 py-2.5 outline-none focus:border-[#D4AF37] text-sm"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-white/40 block mb-1">الحد الأقصى للاستخدام</label>
                  <input
                    type="number"
                    min="1"
                    value={newCode.maxUses || ''}
                    onChange={e => setNewCode({ ...newCode, maxUses: Number(e.target.value) })}
                    className="w-full bg-[#141b18] border border-emerald-900/40 text-white rounded-2xl px-4 py-2 outline-none focus:border-[#D4AF37] text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-white/40 block mb-1">الصلاحية (بالأيام)</label>
                  <input
                    type="number"
                    min="1"
                    value={newCode.durationDays || ''}
                    onChange={e => setNewCode({ ...newCode, durationDays: Number(e.target.value) })}
                    className="w-full bg-[#141b18] border border-emerald-900/40 text-white rounded-2xl px-4 py-2 outline-none focus:border-[#D4AF37] text-sm"
                    required
                  />
                </div>
              </div>
              <button type="submit" className="w-full bg-[#D4AF37] text-black font-bold rounded-2xl py-3 hover:bg-[#F59E0B] transition-colors text-sm">
                إنشاء الكود
              </button>
            </form>
          </div>
          
          <div className="space-y-3 overflow-y-auto max-h-[600px]">
            {codesList.map(c => {
              const isPts = c.type === 'points' || (!c.type && (c.points || c.value));
              const rewardAmount = c.points || c.value || 0;
              const subDays = c.subscriptionDays || c.value || 0;
              return (
                <div key={c.id} className="bg-[#101514] p-4 rounded-2xl flex gap-4 items-center border border-white/5 hover:border-emerald-500/20 transition-all">
                  <div className="w-12 h-12 flex-shrink-0 bg-[#141b18] rounded-xl border border-white/5 flex items-center justify-center text-[#D4AF37] font-black text-sm">
                    {isPts ? '💎 GP' : '👑 SUB'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-[#E0E0E0] tracking-wider font-mono text-sm">{c.code}</h4>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isPts ? 'bg-amber-500/10 text-[#D4AF37] border border-[#D4AF37]/30' : 'bg-purple-500/10 text-purple-400 border border-purple-500/30'}`}>
                        {isPts ? `+${rewardAmount} نقطة` : `${subDays} يوم Prime`}
                      </span>
                    </div>
                    <p className="text-xs text-white/40 mt-1">
                      الاستخدام: <span className="text-white/80 font-semibold">{c.usedCount || 0}</span> / {c.maxUses} مستخدمين
                      {c.expiresAt && ` • ينتهي: ${new Date(c.expiresAt).toLocaleDateString('ar-SA')}`}
                    </p>
                  </div>
                  <button onClick={() => handleDelete('codes', c.id, setCodesList, codesList)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors" title="حذف الكود">
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ADHKAR TAB */}
      {activeTab === 'adhkar' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-[#101514] border border-emerald-500/30 p-6 rounded-3xl shadow-sm">
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2 text-[#D4AF37]"><Plus size={16} /> إضافة ذكر جديد</h3>
            <form onSubmit={handleAddDhikr} className="space-y-4">
              <textarea placeholder="النص..." value={newDhikr.text} onChange={e => setNewDhikr({ ...newDhikr, text: e.target.value })} className="w-full bg-[#141b18] border border-emerald-900/40 text-white rounded-2xl px-4 py-2 outline-none focus:border-[#D4AF37]" required />
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="التصنيف (مثال: أذكار الصباح)" value={newDhikr.category} onChange={e => setNewDhikr({ ...newDhikr, category: e.target.value })} className="w-full bg-[#141b18] border border-emerald-900/40 text-white rounded-2xl px-4 py-2 outline-none focus:border-[#D4AF37]" />
                <input type="number" placeholder="عدد التكرار" value={newDhikr.count || ''} onChange={e => setNewDhikr({ ...newDhikr, count: Number(e.target.value) })} className="w-full bg-[#141b18] border border-emerald-900/40 text-white rounded-2xl px-4 py-2 outline-none focus:border-[#D4AF37]" />
              </div>
              <button type="submit" className="w-full bg-[#D4AF37] text-black font-bold rounded-2xl py-3 hover:bg-[#F59E0B] transition-colors">إضافة الذكر</button>
            </form>
          </div>
          
          <div className="space-y-3 overflow-y-auto max-h-[600px]">
            {adhkarList.map(a => (
              <div key={a.id} className="bg-[#101514] p-4 rounded-2xl flex gap-4 items-center border border-white/5">
                <div className="flex-1">
                  <p className="font-arabic text-[#E0E0E0]">{a.text}</p>
                  <p className="text-xs text-[#D4AF37] mt-1">{a.category} - التكرار: {a.count}</p>
                </div>
                <button onClick={() => handleDelete('adhkar', a.id, setAdhkarList, adhkarList)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DUAS TAB */}
      {activeTab === 'duas' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-[#101514] border border-emerald-500/30 p-6 rounded-3xl shadow-sm">
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2 text-[#D4AF37]"><Plus size={16} /> إضافة دعاء جديد</h3>
            <form onSubmit={handleAddDua} className="space-y-4">
              <textarea placeholder="نص الدعاء..." value={newDua.text} onChange={e => setNewDua({ ...newDua, text: e.target.value })} className="w-full bg-[#141b18] border border-emerald-900/40 text-white rounded-2xl px-4 py-2 outline-none focus:border-[#D4AF37]" required />
              <input type="text" placeholder="المصدر (اختياري)" value={newDua.source} onChange={e => setNewDua({ ...newDua, source: e.target.value })} className="w-full bg-[#141b18] border border-emerald-900/40 text-white rounded-2xl px-4 py-2 outline-none focus:border-[#D4AF37]" />
              <button type="submit" className="w-full bg-[#D4AF37] text-black font-bold rounded-2xl py-3 hover:bg-[#F59E0B] transition-colors">إضافة الدعاء</button>
            </form>
          </div>
          
          <div className="space-y-3 overflow-y-auto max-h-[600px]">
            {duasList.map(d => (
              <div key={d.id} className="bg-[#101514] p-4 rounded-2xl flex gap-4 items-center border border-white/5">
                <div className="flex-1">
                  <p className="font-arabic text-[#E0E0E0]">{d.text}</p>
                  {d.source && <p className="text-xs text-white/40 mt-1">{d.source}</p>}
                </div>
                <button onClick={() => handleDelete('duas', d.id, setDuasList, duasList)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Point Modal */}
      {selectedUserForPoints && (
        <PointModal 
          user={selectedUserForPoints} 
          onClose={() => setSelectedUserForPoints(null)} 
          onSubmit={submitPointUpdate} 
        />
      )}
    </div>
  );
};
