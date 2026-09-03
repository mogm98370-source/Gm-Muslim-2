import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  updateDoc, 
  addDoc, 
  increment,
  getDocs,
  where,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { SupportConversation, SupportMessage, SupportStatus } from '../../types/store';
import { 
  sortMessagesChronologically, 
  formatSupportTime 
} from '../../lib/support';
import { 
  Search, 
  Send, 
  Image as ImageIcon, 
  Crown, 
  ShieldCheck, 
  Clock, 
  CheckCheck, 
  Check, 
  X, 
  Lock, 
  Unlock, 
  User, 
  Copy, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Maximize2,
  Trash2,
  MessageSquare,
  Sparkles,
  Inbox,
  Filter,
  ChevronRight
} from 'lucide-react';
import { cn } from '../Layout';

export const AdminSupportCenter: React.FC = () => {
  const { user, userData } = useAuth();
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConv, setSelectedConv] = useState<SupportConversation | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | SupportStatus>('all');
  const [chatSearchTerm, setChatSearchTerm] = useState('');

  // Chat Input State
  const [replyText, setReplyText] = useState('');
  const [attachment, setAttachment] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [copiedUid, setCopiedUid] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isInitialLoadRef = useRef(true);
  const prevMessagesCountRef = useRef(0);

  // Reliable scroll helper targeting container and end marker
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (chatContainerRef.current) {
      if (behavior === 'auto') {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      } else {
        chatContainerRef.current.scrollTo({
          top: chatContainerRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }
    }
    if (messagesEndRef.current) {
      try {
        messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
      } catch {
        messagesEndRef.current.scrollIntoView(false);
      }
    }
  };

  // Real-time listener for all support conversations
  useEffect(() => {
    const q = query(
      collection(db, 'supportConversations'),
      orderBy('lastMessageAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const convList: SupportConversation[] = [];
      snapshot.forEach((d) => {
        convList.push({ id: d.id, ...d.data() } as SupportConversation);
      });
      setConversations(convList);
      setLoading(false);

      // Keep selected conversation updated in state
      if (selectedConv) {
        const updated = convList.find(c => c.id === selectedConv.id);
        if (updated) setSelectedConv(updated);
      }
    }, (error) => {
      console.error("Error fetching support conversations:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedConv?.id]);

  // Reset scroll state on switching selected conversation
  useEffect(() => {
    isInitialLoadRef.current = true;
    prevMessagesCountRef.current = 0;
  }, [selectedConv?.id]);

  // Real-time listener for selected conversation's messages
  useEffect(() => {
    if (!selectedConv) {
      setMessages([]);
      return;
    }

    setMessagesLoading(true);
    const msgsQuery = query(
      collection(db, 'supportConversations', selectedConv.id, 'messages')
    );

    const unsubscribe = onSnapshot(msgsQuery, (snapshot) => {
      const msgList: SupportMessage[] = [];
      snapshot.forEach((d) => {
        msgList.push({ id: d.id, ...d.data() } as SupportMessage);
      });
      const sorted = sortMessagesChronologically(msgList);
      setMessages(sorted);
      setMessagesLoading(false);

      // Mark unread for admin as 0
      if (selectedConv.unreadForAdmin && selectedConv.unreadForAdmin > 0) {
        updateDoc(doc(db, 'supportConversations', selectedConv.id), {
          unreadForAdmin: 0
        }).catch(console.error);
      }

      // Mark user messages as read
      sorted.forEach(m => {
        if (m.senderRole === 'user' && !m.read) {
          updateDoc(doc(db, 'supportConversations', selectedConv.id, 'messages', m.id), {
            read: true
          }).catch(console.error);
        }
      });

    }, (err) => {
      console.error("Error loading messages:", err);
      setMessagesLoading(false);
    });

    return () => unsubscribe();
  }, [selectedConv?.id]);

  // Scroll to latest message automatically on load or new message arrival
  useEffect(() => {
    if (messages.length === 0) return;

    const isFirstLoad = isInitialLoadRef.current;
    const behavior: ScrollBehavior = isFirstLoad ? 'auto' : 'smooth';
    prevMessagesCountRef.current = messages.length;

    scrollToBottom(behavior);

    const rafId = requestAnimationFrame(() => {
      scrollToBottom(behavior);
    });

    const t1 = setTimeout(() => {
      scrollToBottom(behavior);
      if (isFirstLoad) {
        isInitialLoadRef.current = false;
      }
    }, 60);

    const t2 = setTimeout(() => {
      scrollToBottom(behavior);
    }, 250);

    const t3 = setTimeout(() => {
      scrollToBottom(behavior);
    }, 500);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [messages.length, attachment, messagesLoading]);

  // Handle Image Selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      alert('حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 3 ميجابايت');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachment(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Send Admin Reply
  const handleSendReply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!replyText.trim() && !attachment) || !selectedConv || !user) return;

    const text = replyText.trim();
    const currAttachment = attachment;

    setReplyText('');
    setAttachment(null);
    setIsSending(true);

    // Scroll immediately so admin view goes to bottom
    setTimeout(() => scrollToBottom('smooth'), 10);

    try {
      const now = new Date().toISOString();
      const convRef = doc(db, 'supportConversations', selectedConv.id);

      // Add message to subcollection
      const messagesRef = collection(db, 'supportConversations', selectedConv.id, 'messages');
      await addDoc(messagesRef, {
        senderId: user.uid,
        senderName: 'إدارة GM Muslim',
        senderRole: 'admin',
        senderPhoto: userData?.photoURL || user.photoURL || '',
        message: text,
        attachment: currAttachment,
        createdAt: now,
        read: false,
        type: currAttachment ? 'image' : 'text'
      });

      scrollToBottom('smooth');

      // Update conversation metadata
      await updateDoc(convRef, {
        lastMessage: text || '📷 مرفق صورة من الإدارة',
        lastMessageAt: now,
        unreadForUser: increment(1),
        unreadForAdmin: 0,
        status: 'open',
        updatedAt: now
      });

    } catch (error) {
      console.error("Error sending admin reply:", error);
      alert("حدث خطأ أثناء إرسال الرد");
      setReplyText(text);
      setAttachment(currAttachment);
    } finally {
      setIsSending(false);
    }
  };

  // Update Status
  const handleUpdateStatus = async (status: SupportStatus) => {
    if (!selectedConv) return;
    try {
      await updateDoc(doc(db, 'supportConversations', selectedConv.id), {
        status,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  // Delete Conversation
  const handleDeleteConversation = async (convId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه المحادثة بالكامل؟')) return;
    try {
      // Delete subcollection messages first
      const msgs = await getDocs(collection(db, 'supportConversations', convId, 'messages'));
      const deletes = msgs.docs.map(m => deleteDoc(m.ref));
      await Promise.all(deletes);
      await deleteDoc(doc(db, 'supportConversations', convId));
      if (selectedConv?.id === convId) setSelectedConv(null);
    } catch (error) {
      console.error("Error deleting conversation:", error);
      alert("حدث خطأ أثناء الحذف");
    }
  };

  // Copy User ID
  const handleCopyUid = (uid: string) => {
    navigator.clipboard.writeText(uid);
    setCopiedUid(true);
    setTimeout(() => setCopiedUid(false), 2000);
  };

  // Filter Conversations
  const filteredConversations = conversations.filter(conv => {
    // Search match
    const matchesSearch = 
      (conv.userName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (conv.userEmail || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (conv.userId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (conv.lastMessage || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // Status filter
    if (statusFilter === 'all') return true;
    if (statusFilter === 'needs_reply') {
      return (conv.unreadForAdmin && conv.unreadForAdmin > 0) || conv.status === 'needs_reply';
    }
    return conv.status === statusFilter;
  });

  // Filter messages by chat search term
  const displayedMessages = messages.filter(m => {
    if (!chatSearchTerm.trim()) return true;
    return (m.message || '').toLowerCase().includes(chatSearchTerm.toLowerCase());
  });

  // Total unread count for admin badge
  const totalUnreadConversations = conversations.filter(c => (c.unreadForAdmin && c.unreadForAdmin > 0) || c.status === 'needs_reply').length;

  return (
    <div className="space-y-6">
      {/* Support Center Top Header Bar */}
      <div className="bg-gradient-to-r from-[#0d1f17] via-[#10241b] to-[#0d1f17] p-6 rounded-3xl border border-emerald-500/20 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Crown className="text-[#D4AF37]" size={26} />
              مركز الدعم المباشر — Support Center
            </h2>
            {totalUnreadConversations > 0 && (
              <span className="px-3 py-1 bg-red-500/20 border border-red-500/40 text-red-400 font-bold text-xs rounded-full animate-pulse flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                {totalUnreadConversations} محادثات تحتاج رد
              </span>
            )}
          </div>
          <p className="text-white/60 text-xs sm:text-sm mt-1">
            إدارة كافة محادثات المستخدمين المباشرة، الرد الفوري، إرسال المرفقات، ومتابعة حالات الدعم الفني.
          </p>
        </div>

        {/* Quick Stats Pill */}
        <div className="flex items-center gap-2 bg-[#08120e] p-2 rounded-2xl border border-white/5 text-xs font-bold">
          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400">
            إجمالي المحادثات: {conversations.length}
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-400">
            تحتاج رد: {totalUnreadConversations}
          </div>
        </div>
      </div>

      {/* Main Support Grid (Sidebar + Chat Area) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[720px]">
        
        {/* Left Column: Conversations List (lg: 4 cols) */}
        <div className={cn(
          "lg:col-span-4 bg-[#0a120e] rounded-3xl border border-emerald-500/20 flex flex-col overflow-hidden shadow-xl",
          selectedConv ? "hidden lg:flex" : "flex"
        )}>
          
          {/* Search & Filters */}
          <div className="p-4 bg-[#0d1913] border-b border-emerald-500/15 space-y-3">
            {/* Search Box */}
            <div className="relative">
              <Search className="absolute right-3.5 top-3 text-white/40" size={16} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="بحث بالاسم، البريد، أو المعرف..."
                className="w-full bg-[#121c17] text-white text-xs pr-9 pl-4 py-2.5 rounded-xl border border-white/10 focus:border-[#D4AF37] outline-none placeholder:text-white/30"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute left-3 top-3 text-white/40 hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 text-[11px] font-bold">
              {[
                { id: 'all', label: 'الكل' },
                { id: 'needs_reply', label: '🟡 تحتاج رد' },
                { id: 'open', label: '🟢 مفتوحة' },
                { id: 'closed', label: '⚫ مغلقة' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id as any)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl transition-all whitespace-nowrap border",
                    statusFilter === tab.id
                      ? "bg-[#D4AF37] text-black border-[#D4AF37] shadow-sm font-black"
                      : "bg-[#121c17] text-white/60 border-white/5 hover:text-white"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Conversations List Body */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/5">
            {loading ? (
              <div className="p-12 text-center text-white/40 space-y-3">
                <RefreshCw size={24} className="animate-spin text-emerald-400 mx-auto" />
                <p className="text-xs">جاري تحميل المحادثات...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-12 text-center text-white/40 space-y-2">
                <Inbox size={32} className="mx-auto text-white/20" />
                <p className="text-xs font-semibold">لا توجد محادثات مطابقة</p>
              </div>
            ) : (
              filteredConversations.map(conv => {
                const isSelected = selectedConv?.id === conv.id;
                const hasUnread = (conv.unreadForAdmin && conv.unreadForAdmin > 0) || conv.status === 'needs_reply';

                return (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConv(conv)}
                    className={cn(
                      "p-4 cursor-pointer transition-all flex items-start gap-3 relative group",
                      isSelected
                        ? "bg-[#11241c] border-r-4 border-r-[#D4AF37]"
                        : "hover:bg-[#0e1c15]"
                    )}
                  >
                    {/* User Avatar */}
                    <div className="relative">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 p-[1px] flex-shrink-0">
                        <div className="w-full h-full bg-[#0b1410] rounded-2xl flex items-center justify-center text-emerald-300 font-bold overflow-hidden">
                          {conv.userPhoto ? (
                            <img src={conv.userPhoto} alt={conv.userName} className="w-full h-full object-cover" />
                          ) : (
                            conv.userName?.[0] || 'U'
                          )}
                        </div>
                      </div>
                      {hasUnread && (
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 border-2 border-[#0a120e] rounded-full animate-ping"></span>
                      )}
                    </div>

                    {/* Conversation Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <h4 className="text-xs font-bold text-white truncate flex items-center gap-1">
                          {conv.userName || 'مستخدم بدون اسم'}
                        </h4>
                        <span className="text-[10px] text-white/40 flex-shrink-0">
                          {conv.lastMessageAt ? formatSupportTime(conv.lastMessageAt) : ''}
                        </span>
                      </div>

                      <p className={cn(
                        "text-xs truncate leading-relaxed",
                        hasUnread ? "text-amber-300 font-bold" : "text-white/50"
                      )}>
                        {conv.lastMessage || 'لا توجد رسائل بعد'}
                      </p>

                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/5">
                        <span className="text-[9px] text-white/30 truncate max-w-[140px]">
                          {conv.userEmail || conv.userId}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {/* Unread Counter Badge */}
                          {conv.unreadForAdmin && conv.unreadForAdmin > 0 ? (
                            <span className="px-2 py-0.5 rounded-full bg-red-500 text-white font-black text-[10px] shadow-sm">
                              {conv.unreadForAdmin}
                            </span>
                          ) : null}

                          {/* Status Pill */}
                          <span className={cn(
                            "text-[9px] font-bold px-2 py-0.5 rounded-md border",
                            conv.status === 'closed'
                              ? "bg-white/5 text-white/40 border-white/10"
                              : conv.status === 'needs_reply'
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          )}>
                            {conv.status === 'closed' ? 'مغلقة' : conv.status === 'needs_reply' ? 'تحتاج رد' : 'مفتوحة'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Chat View & Actions (lg: 8 cols) */}
        <div className={cn(
          "lg:col-span-8 bg-[#0a120e] rounded-3xl border border-emerald-500/20 flex flex-col overflow-hidden shadow-xl",
          !selectedConv ? "hidden lg:flex" : "flex"
        )}>
          {selectedConv ? (
            <>
              {/* Chat Active Header */}
              <div className="p-4 bg-[#0d1c15] border-b border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 z-10">
                <div className="flex items-center gap-3">
                  {/* Back button to return to conversations list (always visible on all screens) */}
                  <button
                    id="back-to-conversations-list-btn"
                    onClick={() => setSelectedConv(null)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 hover:border-[#D4AF37]/50 text-white hover:text-[#D4AF37] active:scale-95 transition-all shadow-sm cursor-pointer flex-shrink-0 group"
                    title="الرجوع إلى شريط وقائمة المحادثات"
                  >
                    <ChevronRight size={18} className="text-emerald-400 group-hover:text-[#D4AF37] transition-transform group-hover:translate-x-0.5" />
                    <span className="text-xs font-bold whitespace-nowrap">شريط المحادثات</span>
                  </button>

                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-[#D4AF37] p-[1.5px]">
                    <div className="w-full h-full bg-[#0b1410] rounded-2xl flex items-center justify-center text-white font-black overflow-hidden">
                      {selectedConv.userPhoto ? (
                        <img src={selectedConv.userPhoto} alt="" className="w-full h-full object-cover" />
                      ) : (
                        selectedConv.userName?.[0] || 'U'
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-white">{selectedConv.userName}</h3>
                      <button
                        onClick={() => handleCopyUid(selectedConv.userId)}
                        className="text-[10px] text-emerald-400/80 hover:text-emerald-300 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20"
                        title="نسخ User ID"
                      >
                        {copiedUid ? <Check size={10} /> : <Copy size={10} />}
                        <span>ID: {selectedConv.userId.slice(0, 6)}...</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-white/50">{selectedConv.userEmail}</p>
                  </div>
                </div>

                {/* Status Changer & Search inside chat */}
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  {/* In-Chat Search */}
                  <div className="relative">
                    <Search className="absolute right-2.5 top-2.5 text-white/30" size={13} />
                    <input
                      type="text"
                      value={chatSearchTerm}
                      onChange={(e) => setChatSearchTerm(e.target.value)}
                      placeholder="بحث بالرسائل..."
                      className="bg-[#121c17] text-white text-[11px] pr-7 pl-2.5 py-1.5 rounded-xl border border-white/10 outline-none w-28 sm:w-36 focus:w-44 transition-all"
                    />
                  </div>

                  {/* Status Dropdown */}
                  <select
                    value={selectedConv.status || 'open'}
                    onChange={(e) => handleUpdateStatus(e.target.value as SupportStatus)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold border outline-none bg-[#121c17] text-[#D4AF37] border-[#D4AF37]/30"
                  >
                    <option value="open">🟢 مفتوحة</option>
                    <option value="needs_reply">🟡 تحتاج رد</option>
                    <option value="closed">⚫ مغلقة</option>
                  </select>

                  {/* Delete Conversation */}
                  <button
                    onClick={() => handleDeleteConversation(selectedConv.id)}
                    className="p-2 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
                    title="حذف المحادثة"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Chat Messages Stream */}
              <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {messagesLoading ? (
                  <div className="h-full flex flex-col items-center justify-center text-white/40 gap-2">
                    <RefreshCw size={24} className="animate-spin text-emerald-400" />
                    <p className="text-xs">جاري تحميل الرسائل...</p>
                  </div>
                ) : displayedMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-white/40 text-center">
                    <MessageSquare size={32} className="text-white/20 mb-2" />
                    <p className="text-xs font-bold">لا توجد رسائل مطابقة</p>
                  </div>
                ) : (
                  displayedMessages.map(msg => {
                    const isAdmin = msg.senderRole === 'admin';
                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex flex-col gap-1 max-w-[85%] sm:max-w-[75%]",
                          isAdmin ? "mr-auto items-start" : "ml-auto items-end"
                        )}
                      >
                        <div className="flex items-center gap-1 text-[10px] text-white/40 px-1">
                          {isAdmin ? (
                            <span className="font-bold text-[#D4AF37] flex items-center gap-1">
                              <Crown size={11} />
                              أنت (الإدارة)
                            </span>
                          ) : (
                            <span>{selectedConv.userName}</span>
                          )}
                          <span>•</span>
                          <span>{formatSupportTime(msg.createdAt)}</span>
                        </div>

                        <div
                          className={cn(
                            "rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-md",
                            isAdmin
                              ? "bg-[#14231b] border border-[#D4AF37]/40 text-white rounded-tl-none"
                              : "bg-emerald-700 text-white rounded-tr-none border border-emerald-500/30"
                          )}
                        >
                          {msg.message && (
                            <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                          )}

                          {msg.attachment && (
                            <div className="mt-2 relative group rounded-xl overflow-hidden border border-white/10">
                              <img
                                src={msg.attachment}
                                alt="Attachment"
                                className="max-h-56 rounded-xl object-cover cursor-pointer"
                                onClick={() => setZoomedImage(msg.attachment || null)}
                                onLoad={() => scrollToBottom('auto')}
                              />
                            </div>
                          )}

                          <div className={cn(
                            "flex items-center gap-1 text-[9px] mt-1 pt-0.5",
                            isAdmin ? "text-white/40 justify-start" : "text-emerald-200/70 justify-end"
                          )}>
                            {msg.read ? (
                              <span className="text-[#D4AF37] flex items-center gap-0.5">
                                <CheckCheck size={12} />
                                مقروءة
                              </span>
                            ) : (
                              <span className="flex items-center gap-0.5">
                                <Check size={12} />
                                تم الإرسال
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} className="h-px w-full shrink-0" aria-hidden="true" />
              </div>

              {/* Quick Canned Responses Bar */}
              <div className="px-4 py-2 bg-[#0c1812] border-t border-white/5 flex items-center gap-1.5 overflow-x-auto text-[11px]">
                <span className="text-white/30 text-[10px] whitespace-nowrap pl-1">ردود سريعة:</span>
                {[
                  'أهلاً بك! تم استلام رسالتك وجاري مراجعتها 👑',
                  'تم حل المشكلة وتزويد حسابك بالجواهر المطلوبة 💎',
                  'شكراً لتواصلك معنا وسعدنا بخدمتك دائماً 🌸',
                  'يرجى تزويدنا بتفاصيل إضافية أو صورة للمشكلة'
                ].map((reply, idx) => (
                  <button
                    key={idx}
                    onClick={() => setReplyText(reply)}
                    className="px-2.5 py-1 rounded-lg bg-[#14231b] hover:bg-emerald-900/50 text-emerald-200/90 hover:text-white border border-emerald-500/20 whitespace-nowrap transition-colors"
                  >
                    {reply}
                  </button>
                ))}
              </div>

              {/* Attachment Preview */}
              {attachment && (
                <div className="p-3 bg-[#0d1a14] border-t border-emerald-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img src={attachment} alt="preview" className="w-12 h-12 rounded-lg object-cover border border-emerald-500/30" />
                    <p className="text-xs text-emerald-300 font-bold">مرفق صورة جاهز للإرسال للمستخدم</p>
                  </div>
                  <button onClick={() => setAttachment(null)} className="p-1 text-white/50 hover:text-white">
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* Admin Chat Input Form */}
              <form
                onSubmit={handleSendReply}
                className="p-3 bg-[#0a120e] border-t border-emerald-500/20 flex items-center gap-2"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  accept="image/*"
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 rounded-xl bg-[#121c17] hover:bg-[#192720] border border-white/10 text-white/70 hover:text-white transition-colors"
                  title="إرفاق صورة"
                >
                  <ImageIcon size={18} />
                </button>

                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`اكتب رداً إدارياً للمستخدم ${selectedConv.userName}...`}
                  className="flex-1 bg-[#121c17] text-white text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-white/10 focus:border-[#D4AF37] outline-none placeholder:text-white/30"
                  disabled={isSending}
                />

                <button
                  type="submit"
                  disabled={(!replyText.trim() && !attachment) || isSending}
                  className={cn(
                    "px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all",
                    (!replyText.trim() && !attachment) || isSending
                      ? "bg-white/10 text-white/30 cursor-not-allowed"
                      : "bg-[#D4AF37] text-black font-black hover:bg-[#F59E0B] shadow-md active:scale-95"
                  )}
                >
                  {isSending ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <>
                      <span>إرسال رد</span>
                      <Send size={14} className="rotate-180" />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-white/40 space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-[#12221a] border border-emerald-500/20 flex items-center justify-center text-[#D4AF37]">
                <MessageSquare size={32} />
              </div>
              <h4 className="text-base font-bold text-white">اختر مستخدماً من القائمة</h4>
              <p className="text-xs text-white/50 max-w-sm">
                اضغط على أي محادثة في القائمة الجانبية لبدء قراءة الرسائل والرد الفوري على المستخدم.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox / Zoom Modal */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute -top-12 left-0 p-2 text-white/80 hover:text-white bg-white/10 rounded-full"
            >
              <X size={20} />
            </button>
            <img 
              src={zoomedImage} 
              alt="Zoomed attachment" 
              className="max-h-[85vh] max-w-full rounded-2xl object-contain border border-white/20 shadow-2xl" 
            />
          </div>
        </div>
      )}
    </div>
  );
};
