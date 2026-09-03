import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  updateDoc, 
  serverTimestamp, 
  increment 
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { SupportConversation, SupportMessage } from '../../types/store';
import { 
  parseMessageTimestamp, 
  sortMessagesChronologically, 
  formatSupportTime 
} from '../../lib/support';
import { 
  Send, 
  Image as ImageIcon, 
  Crown, 
  ShieldCheck, 
  Clock, 
  Check, 
  CheckCheck, 
  X, 
  Sparkles, 
  AlertCircle, 
  RefreshCw,
  Maximize2,
  Lock,
  Headphones,
  ChevronRight
} from 'lucide-react';
import { cn } from '../Layout';

export const Support: React.FC = () => {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const [conversation, setConversation] = useState<SupportConversation | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputMessage, setInputMessage] = useState('');
  const [attachment, setAttachment] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isInitialLoadRef = useRef(true);
  const prevMessagesCountRef = useRef(0);

  const conversationId = user?.uid;

  // Reliable scroll-to-bottom helper targeting both container and end anchor
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

  // Real-time listener for conversation document
  useEffect(() => {
    if (!conversationId) {
      setLoading(false);
      return;
    }

    const convRef = doc(db, 'supportConversations', conversationId);
    const unsubConv = onSnapshot(convRef, (snap) => {
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() } as SupportConversation;
        setConversation(data);
        // If unread messages for user, mark as read
        if (data.unreadForUser && data.unreadForUser > 0) {
          updateDoc(convRef, { unreadForUser: 0 }).catch(console.error);
        }
      } else {
        setConversation(null);
      }
      setLoading(false);
    }, (err) => {
      console.error("Error listening to conversation:", err);
      setLoading(false);
    });

    // Real-time listener for messages with strict chronological sorting (oldest top ⬆️ -> newest bottom ⬇️)
    const msgsQuery = query(
      collection(db, 'supportConversations', conversationId, 'messages')
    );

    const unsubMsgs = onSnapshot(msgsQuery, (snap) => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() } as SupportMessage));
      const sorted = sortMessagesChronologically(msgs);
      setMessages(sorted);
      setLoading(false);
    }, (err) => {
      console.error("Error listening to messages:", err);
      setLoading(false);
    });

    return () => {
      unsubConv();
      unsubMsgs();
    };
  }, [conversationId]);

  // Handle automatic scrolling to the latest message:
  // - On opening an existing chat / app launch: instantaneous scroll ('auto') directly to the bottom.
  // - When a new message is sent or received: smooth scroll ('smooth') to the bottom.
  useEffect(() => {
    if (messages.length === 0) return;

    const isFirstLoad = isInitialLoadRef.current;
    const behavior: ScrollBehavior = isFirstLoad ? 'auto' : 'smooth';
    prevMessagesCountRef.current = messages.length;

    // 1. Immediate scroll execution
    scrollToBottom(behavior);

    // 2. Next animation frame
    const rafId = requestAnimationFrame(() => {
      scrollToBottom(behavior);
    });

    // 3. Staggered timers to ensure browser finishes rendering fonts, heights & images
    const t1 = setTimeout(() => {
      scrollToBottom(behavior);
      if (isFirstLoad) {
        isInitialLoadRef.current = false;
      }
    }, 60);

    const t2 = setTimeout(() => {
      scrollToBottom(behavior);
    }, 250);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [messages.length, attachment, loading]);

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

  // Send message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!inputMessage.trim() && !attachment) || !user || !conversationId) return;

    const messageText = inputMessage.trim();
    const currentAttachment = attachment;
    
    // Clear inputs immediately for responsive UX
    setInputMessage('');
    setAttachment(null);
    setIsSending(true);

    // Scroll immediately so user view is focused on the bottom where their message lands
    setTimeout(() => scrollToBottom('smooth'), 10);

    try {
      const now = new Date().toISOString();
      const convRef = doc(db, 'supportConversations', conversationId);

      // Create conversation metadata if not exists or update
      await setDoc(convRef, {
        userId: user.uid,
        userName: userData?.displayName || user.displayName || 'مستخدم GM',
        userEmail: user.email || '',
        userPhoto: userData?.photoURL || user.photoURL || '',
        lastMessage: messageText || '📷 مرفق صورة',
        lastMessageAt: now,
        unreadForAdmin: increment(1),
        unreadForUser: 0,
        status: 'needs_reply',
        updatedAt: now,
        ...(!conversation ? { createdAt: now } : {})
      }, { merge: true });

      // Add message to subcollection
      const messagesRef = collection(db, 'supportConversations', conversationId, 'messages');
      await addDoc(messagesRef, {
        senderId: user.uid,
        senderName: userData?.displayName || user.displayName || 'مستخدم GM',
        senderRole: 'user',
        senderPhoto: userData?.photoURL || user.photoURL || '',
        message: messageText,
        attachment: currentAttachment,
        createdAt: now,
        read: false,
        type: currentAttachment ? 'image' : 'text'
      });

      scrollToBottom('smooth');

    } catch (error) {
      console.error("Error sending message:", error);
      alert("حدث خطأ أثناء إرسال الرسالة، يرجى المحاولة مرة أخرى.");
      setInputMessage(messageText);
      setAttachment(currentAttachment);
    } finally {
      setIsSending(false);
    }
  };

  // Quick prompt click
  const handleQuickPrompt = (prompt: string) => {
    setInputMessage(prompt);
  };

  // Back Navigation Handler
  const handleBack = () => {
    if (window.history.state && typeof window.history.state.idx === 'number' && window.history.state.idx > 0) {
      navigate(-1);
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-4 py-2 sm:py-4 h-[calc(100vh-140px)] min-h-[580px] flex flex-col">
      {/* Top Bar with Back Action */}
      <div className="flex items-center justify-between mb-2.5 px-1 flex-shrink-0">
        <button
          id="support-top-back-button"
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-[#09110d]/90 hover:bg-emerald-950/80 border border-emerald-500/25 hover:border-[#D4AF37]/50 text-white/90 hover:text-[#D4AF37] text-xs font-bold transition-all shadow-md active:scale-95 group cursor-pointer"
          title="الرجوع إلى الصفحة السابقة"
        >
          <ChevronRight size={17} className="text-emerald-400 group-hover:text-[#D4AF37] transition-transform group-hover:translate-x-0.5" />
          <span>الرجوع من المحادثة</span>
        </button>

        <span className="text-[11px] text-white/40 font-medium hidden xs:inline">
          مركز الدعم الفني المباشر
        </span>
      </div>

      {/* Main Chat Container */}
      <div className="flex-1 bg-[#0a120e]/95 backdrop-blur-md rounded-3xl border border-emerald-500/20 shadow-2xl flex flex-col overflow-hidden relative">
        
        {/* Chat Header */}
        <div className="p-3 sm:p-5 bg-gradient-to-r from-[#0d1f17] via-[#0b1712] to-[#0d1f17] border-b border-emerald-500/20 flex items-center justify-between z-10 gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
            {/* Header Back Button */}
            <button
              id="support-header-back-button"
              onClick={handleBack}
              className="flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl sm:rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-[#D4AF37]/60 text-white/90 hover:text-[#D4AF37] transition-all shadow-sm active:scale-95 flex-shrink-0 group cursor-pointer"
              title="رجوع"
              aria-label="الرجوع من المحادثة"
            >
              <ChevronRight size={18} className="text-emerald-400 group-hover:text-[#D4AF37] transition-transform group-hover:translate-x-0.5" />
              <span className="text-xs font-black">رجوع</span>
            </button>

            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-emerald-500 via-[#D4AF37] to-amber-600 p-[2px] shadow-lg shadow-amber-500/10">
                <div className="w-full h-full bg-[#0d1713] rounded-2xl flex items-center justify-center text-[#D4AF37]">
                  <Crown size={22} className="animate-pulse sm:w-6 sm:h-6" />
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-emerald-500 border-2 border-[#0a120e] rounded-full"></span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h2 className="text-sm sm:text-lg font-black text-white tracking-wide flex items-center gap-1.5 truncate">
                  GM Muslim Support
                  <span className="text-[#D4AF37]">👑</span>
                </h2>
                <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 hidden xs:flex items-center gap-1 flex-shrink-0">
                  <ShieldCheck size={12} />
                  رسمي معتمد
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-white/50 flex items-center gap-1.5 mt-0.5 truncate">
                <span className="inline-block w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-ping flex-shrink-0"></span>
                <span className="truncate">فريق إدارة التطبيق متاح للمساعدة والرد المباشر</span>
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="hidden sm:flex items-center gap-2">
            {conversation?.status === 'closed' ? (
              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-white/5 text-white/40 border border-white/10 flex items-center gap-1">
                <Lock size={12} />
                محادثة مغلقة
              </span>
            ) : conversation?.status === 'needs_reply' ? (
              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                <Clock size={12} />
                بانتظار رد الإدارة
              </span>
            ) : (
              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <Sparkles size={12} />
                محادثة نشطة
              </span>
            )}
          </div>
        </div>

        {/* Official Banner */}
        <div className="bg-[#052216]/60 border-b border-emerald-500/10 px-4 py-2 flex items-center justify-between text-[11px] text-emerald-300/80">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-[#D4AF37]" />
            <span>محادثة مشفرة وخاصة بينك وبين إدارة GM Muslim فقط</span>
          </div>
          <span className="text-white/40 text-[10px] hidden md:inline">
            الردود تصلك فورياً دون الحاجة لتحديث الصفحة
          </span>
        </div>

        {/* Chat Messages Body */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-white/40 gap-3">
              <RefreshCw size={28} className="animate-spin text-emerald-400" />
              <p className="text-sm">جاري تحميل المحادثة الرسمية...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-5 max-w-md mx-auto my-auto">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-[#D4AF37]/20 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] shadow-xl">
                <Headphones size={32} />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-black text-white">مرحباً بك في دعم GM Muslim 👑</h3>
                <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
                  تواصل مباشرة مع إدارة التطبيق للاستفسار عن المتجر، الجواهر، رتبة PRIME، أو الإبلاغ عن أي مشكلة فنية.
                </p>
              </div>

              {/* Quick Prompt Suggestions */}
              <div className="w-full space-y-2 pt-2">
                <p className="text-xs text-[#D4AF37] font-semibold">استفسارات شائعة للبدء السريع:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {[
                    'عندي مشكلة في استلام الجواهر أو المشتريات 💎',
                    'استفسار بخصوص مزايا رتبة PRIME 👑',
                    'اقتراح ميزة جديدة لتطبيق GM Muslim 💡',
                    'مشكلة تقنية في مواقيت الصلاة أو الأذكار 🕌'
                  ].map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleQuickPrompt(prompt)}
                      className="text-xs bg-[#102018] hover:bg-emerald-900/40 text-emerald-200/90 hover:text-white px-3 py-1.5 rounded-xl border border-emerald-500/20 transition-all text-right hover:border-emerald-500/40"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Welcome Badge in thread */}
              <div className="flex justify-center my-2">
                <span className="bg-[#102018] text-emerald-400 text-[11px] font-semibold px-3.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5 shadow-sm">
                  <ShieldCheck size={13} className="text-[#D4AF37]" />
                  بدأت المحادثة الرسمية مع إدارة GM Muslim
                </span>
              </div>

              {/* Message Bubbles */}
              {messages.map((msg, index) => {
                const isAdminMsg = msg.senderRole === 'admin';
                return (
                  <div
                    key={msg.id || index}
                    className={cn(
                      "flex flex-col gap-1 max-w-[85%] sm:max-w-[75%]",
                      isAdminMsg ? "mr-auto items-start" : "ml-auto items-end"
                    )}
                  >
                    {/* Sender Tag */}
                    <div className="flex items-center gap-1.5 text-[11px] px-1">
                      {isAdminMsg ? (
                        <div className="flex items-center gap-1 font-bold text-[#D4AF37]">
                          <Crown size={12} className="fill-[#D4AF37]" />
                          <span>إدارة GM Muslim</span>
                          <span className="bg-[#D4AF37]/10 text-[#D4AF37] px-1.5 py-0.2 rounded text-[9px] border border-[#D4AF37]/30">ADMIN</span>
                        </div>
                      ) : (
                        <span className="text-white/40 font-medium">أنت</span>
                      )}
                    </div>

                    {/* Bubble Content */}
                    <div
                      className={cn(
                        "rounded-2xl p-3.5 sm:p-4 text-sm leading-relaxed relative shadow-md transition-all",
                        isAdminMsg
                          ? "bg-gradient-to-br from-[#121c16] via-[#162720] to-[#121c16] border border-[#D4AF37]/40 text-white rounded-tl-none shadow-[#D4AF37]/5"
                          : "bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white rounded-tr-none border border-emerald-400/30"
                      )}
                    >
                      {/* Text Message */}
                      {msg.message && (
                        <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                      )}

                      {/* Image Attachment */}
                      {msg.attachment && (
                        <div className="mt-2.5 relative group rounded-xl overflow-hidden border border-white/10">
                          <img
                            src={msg.attachment}
                            alt="Attachment"
                            className="max-h-60 rounded-xl object-cover cursor-pointer transition-transform group-hover:scale-[1.02]"
                            onClick={() => setZoomedImage(msg.attachment || null)}
                            onLoad={() => scrollToBottom('auto')}
                          />
                          <button
                            onClick={() => setZoomedImage(msg.attachment || null)}
                            className="absolute bottom-2 left-2 p-1.5 bg-black/60 backdrop-blur-md rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Maximize2 size={14} />
                          </button>
                        </div>
                      )}

                      {/* Time & Read Status */}
                      <div
                        className={cn(
                          "flex items-center gap-1.5 text-[10px] mt-1.5 pt-1",
                          isAdminMsg ? "text-white/40 justify-start" : "text-emerald-200/70 justify-end"
                        )}
                      >
                        <span>{formatSupportTime(msg.createdAt)}</span>
                        {!isAdminMsg && (
                          <span title={msg.read ? "تمت القراءة بواسطة الإدارة" : "تم الإرسال"}>
                            {msg.read ? (
                              <CheckCheck size={14} className="text-[#D4AF37]" />
                            ) : (
                              <Check size={14} className="text-emerald-300/80" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              <div ref={messagesEndRef} className="h-px w-full shrink-0" aria-hidden="true" />
            </>
          )}
        </div>

        {/* Image Attachment Preview before sending */}
        {attachment && (
          <div className="p-3 bg-[#0d1a14] border-t border-emerald-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-emerald-500/40">
                <img src={attachment} alt="Upload preview" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">صورة جاهزة للإرسال</p>
                <p className="text-[10px] text-emerald-400">اضغط إرسال لمشاركتها مع الإدارة</p>
              </div>
            </div>
            <button
              onClick={() => setAttachment(null)}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Closed conversation notification */}
        {conversation?.status === 'closed' && (
          <div className="px-4 py-2 bg-amber-500/10 border-t border-amber-500/20 flex items-center justify-between text-xs text-amber-300">
            <span>تم إغلاق هذه المحادثة من قبل الإدارة. إرسال أي رسالة جديدة سيعيد فتحها تلقائياً.</span>
          </div>
        )}

        {/* Input Bar */}
        <form
          onSubmit={handleSendMessage}
          className="p-3 sm:p-4 bg-[#0a120e] border-t border-emerald-500/20 flex items-center gap-2 sm:gap-3"
        >
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/*"
            className="hidden"
          />

          {/* Attach Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "p-2.5 sm:p-3 rounded-2xl border transition-all flex items-center justify-center",
              attachment
                ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                : "bg-[#121c17] hover:bg-[#192720] border-white/10 text-white/60 hover:text-white"
            )}
            title="إرفاق صورة"
          >
            <ImageIcon size={20} />
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="اكتب رسالتك للإدارة هنا..."
            className="flex-1 bg-[#121c17] text-white text-sm px-4 py-3 rounded-2xl border border-white/10 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none placeholder:text-white/30 transition-all"
            disabled={isSending}
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={(!inputMessage.trim() && !attachment) || isSending}
            className={cn(
              "px-4 sm:px-5 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg",
              (!inputMessage.trim() && !attachment) || isSending
                ? "bg-white/10 text-white/30 cursor-not-allowed border border-white/5"
                : "bg-gradient-to-r from-emerald-500 to-[#D4AF37] text-black font-black hover:opacity-95 shadow-amber-500/20 active:scale-95"
            )}
          >
            {isSending ? (
              <RefreshCw size={18} className="animate-spin text-black" />
            ) : (
              <>
                <span className="hidden sm:inline">إرسال</span>
                <Send size={18} className="rotate-180" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Lightbox / Zoom Modal */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute -top-12 left-0 p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all"
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
