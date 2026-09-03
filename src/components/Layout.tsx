import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import { 
  Home, 
  BookOpen, 
  Compass, 
  Heart, 
  ShoppingBag, 
  LifeBuoy, 
  LogOut, 
  LayoutDashboard, 
  Menu, 
  X, 
  User as UserIcon, 
  Ticket, 
  Crown, 
  Sun, 
  Trophy, 
  Package, 
  Mail,
  Gem,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { GMAvatar } from './shared/GMAvatar';
import { GMName } from './shared/GMName';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Layout = () => {
  const { user, userData, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  // 4 Primary Bottom Navigation Tabs as requested by user
  const bottomNavTabs = [
    { name: 'الرئيسية', path: '/', icon: Home },
    { name: 'القرآن', path: '/quran', icon: BookOpen },
    { name: 'الأدعية', path: '/duas', icon: Heart },
    { name: 'الأذكار', path: '/adhkar', icon: Sun }
  ];

  // Full Suite Items for Sidebar & Drawer
  const fullNavItems = [
    { name: 'الرئيسية', path: '/', icon: Home },
    { name: 'القرآن الكريم', path: '/quran', icon: BookOpen },
    { name: 'الأدعية', path: '/duas', icon: Heart },
    { name: 'الأذكار والتحصين', path: '/adhkar', icon: Sun },
    { name: 'الصلاة والمواقيت', path: '/prayer', icon: Compass },
    { name: 'المتجر (GM Store)', path: '/store', icon: ShoppingBag },
    { name: 'مقتنياتي', path: '/inventory', icon: Package },
    { name: 'مركز الدعم', path: '/support', icon: LifeBuoy },
    { name: 'نظام PRIME', path: '/prime', icon: Crown },
    { name: 'لوحة الصدارة', path: '/leaderboard', icon: Trophy },
    { name: 'البريد والمكافآت', path: '/mail', icon: Mail },
    { name: 'الأكواد والجوائز', path: '/redeem', icon: Ticket },
    { name: 'الحساب', path: user ? '/profile' : '/login', icon: UserIcon },
  ];

  if (isAdmin) {
    fullNavItems.push({ name: 'لوحة الإدارة الفائقة', path: '/admin', icon: LayoutDashboard });
  }

  return (
    <div className="min-h-screen bg-[#050807] text-[#E0E0E0] font-sans antialiased selection:bg-[#D4AF37] selection:text-black" dir="rtl">
      {/* Desktop Sidebar (Luxury Dark Green & Rich Black) */}
      <aside className="hidden md:flex fixed inset-y-0 right-0 z-40 w-64 bg-[#080d0b] border-l border-emerald-950/80 shadow-2xl flex-col">
        {/* Brand Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-l from-[#D4AF37] via-amber-200 to-[#F3E5AB]">
              GM Muslim
            </h1>
            <p className="text-[10px] text-emerald-400/80 font-bold uppercase tracking-wider">
              Islamic Luxury & Lifestyle
            </p>
          </div>
          {userData?.gmPoints !== undefined && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-black/60 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-black">
              <Gem size={13} />
              <span>{userData.gmPoints}</span>
            </div>
          )}
        </div>
        
        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-900/30">
          {fullNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl transition-all duration-200 group relative",
                  isActive 
                     ? "text-[#D4AF37] font-black bg-[#D4AF37]/10 border border-[#D4AF37]/25 shadow-sm" 
                     : "text-white/60 hover:bg-[#121c17] hover:text-white"
                )}
              >
                {isActive && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#D4AF37] rounded-l-full" />
                )}
                <Icon size={19} className={cn("transition-transform duration-200", isActive ? "scale-110 text-[#D4AF37]" : "group-hover:scale-110 group-hover:text-emerald-300")} />
                <span className="text-xs font-bold tracking-wide">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Mini Profile Card & Logout */}
        <div className="p-4 border-t border-white/5 bg-[#060a08]">
          {user ? (
            <div className="space-y-2">
              <Link 
                to="/profile" 
                className="flex items-center gap-3 p-2 rounded-2xl hover:bg-white/5 transition-colors group"
              >
                <GMAvatar userObj={userData} size="sm" />
                <div className="min-w-0 flex-1">
                  <GMName userObj={userData} className="text-xs truncate block" />
                  <span className="text-[10px] text-white/40 block truncate">{userData?.email || user.email}</span>
                </div>
              </Link>

              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-red-400/80 hover:bg-red-500/10 hover:text-red-400 transition-colors text-xs font-bold"
              >
                <LogOut size={15} />
                <span>تسجيل الخروج</span>
              </button>
            </div>
          ) : (
            <Link 
              to="/login" 
              className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-l from-[#D4AF37] to-[#F59E0B] text-black font-black rounded-2xl hover:opacity-90 transition-opacity text-xs shadow-md"
            >
              <UserIcon size={16} />
              <span>تسجيل الدخول</span>
            </Link>
          )}
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between px-5 py-3.5 bg-[#080d0b]/90 backdrop-blur-xl border-b border-emerald-950/60 sticky top-0 z-30">
        <h1 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-l from-[#D4AF37] to-[#F3E5AB]">
          GM Muslim
        </h1>

        <div className="flex items-center gap-2.5">
          {userData?.gmPoints !== undefined && (
            <Link to="/store" className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-black/60 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-bold">
              <Gem size={13} />
              <span>{userData.gmPoints}</span>
            </Link>
          )}

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-xl bg-white/5 text-white/80 hover:text-white"
            title="القائمة الكاملة"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={cn(
        "transition-all duration-300 min-h-screen pb-28 md:pb-8",
        "md:pr-64"
      )}>
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
      
      {/* Mobile Bottom Navigation (4 Core Tabs: الرئيسية | المتجر | الدعم | الحساب) */}
      <nav className="md:hidden fixed bottom-3 left-3 right-3 z-50">
        <div className="bg-[#09110d]/95 backdrop-blur-2xl border border-emerald-500/25 rounded-3xl shadow-[0_10px_35px_rgba(0,0,0,0.9)] px-2 py-2 flex justify-around items-center">
          {bottomNavTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = location.pathname === tab.path || (tab.path !== '/' && location.pathname.startsWith(tab.path));
            return (
              <Link
                key={tab.path}
                to={tab.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex flex-col items-center justify-center flex-1 py-1.5 gap-1 relative"
              >
                {isActive && (
                  <div className="absolute top-0 w-8 h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent rounded-full shadow-[0_0_10px_#D4AF37]" />
                )}
                <Icon size={21} className={cn("transition-all duration-200", isActive ? "text-[#D4AF37] scale-110 -translate-y-0.5" : "text-white/50")} />
                <span className={cn("text-[10px] font-bold transition-all duration-200", isActive ? "text-[#D4AF37]" : "text-white/40")}>
                  {tab.name}
                </span>
              </Link>
            );
          })}

          {/* More Drawer Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex flex-col items-center justify-center flex-1 py-1.5 gap-1 relative"
          >
            <div className={cn("transition-all duration-200", isMobileMenuOpen ? "text-[#D4AF37] scale-110" : "text-white/50")}>
              {isMobileMenuOpen ? <X size={21} /> : <Menu size={21} />}
            </div>
            <span className={cn("text-[10px] font-bold", isMobileMenuOpen ? "text-[#D4AF37]" : "text-white/40")}>
              المزيد
            </span>
          </button>
        </div>
      </nav>

      {/* Mobile More Options Drawer Sheet */}
      <div 
        className={cn(
          "md:hidden fixed inset-0 z-40 bg-black/75 backdrop-blur-md transition-opacity duration-300",
          isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )} 
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <div 
          className={cn(
            "absolute bottom-20 left-3 right-3 bg-[#0d1612] border border-emerald-500/30 rounded-3xl p-5 shadow-2xl transition-transform duration-300 ease-out transform max-h-[75vh] overflow-y-auto",
            isMobileMenuOpen ? "translate-y-0 scale-100" : "translate-y-8 scale-95 opacity-0"
          )}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/5">
            <h3 className="font-bold text-sm text-[#D4AF37] flex items-center gap-1.5">
              <Sparkles size={16} />
              جميع أدوات وأقسام GM Muslim
            </h3>
            <button onClick={() => setIsMobileMenuOpen(false)} className="text-white/40 hover:text-white">
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2.5 mb-4">
            {fullNavItems.map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 py-3.5 px-2 rounded-2xl transition-all text-center border",
                    isActive 
                      ? "bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/40 shadow-sm" 
                      : "bg-[#121c17] text-white/70 hover:bg-[#16231d] border-white/5"
                  )}
                >
                  <Icon size={22} className={isActive ? "text-[#D4AF37]" : "text-emerald-400"} />
                  <span className="text-[11px] font-bold truncate max-w-full">{item.name}</span>
                </Link>
              );
            })}
          </div>
          
          <div className="border-t border-white/5 pt-3 flex gap-2">
            {user ? (
              <>
                <Link 
                  to="/profile" 
                  onClick={() => setIsMobileMenuOpen(false)} 
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#121c17] text-white/90 rounded-2xl text-xs font-bold border border-emerald-500/20"
                >
                  <UserIcon size={16} className="text-[#D4AF37]" /> حسابي
                </Link>
                <button 
                  onClick={handleLogout} 
                  className="flex items-center justify-center px-4 bg-red-500/15 text-red-400 rounded-2xl border border-red-500/20 hover:bg-red-500/25 transition-colors text-xs font-bold"
                >
                  <LogOut size={16} />
                </button>
              </>
            ) : (
              <Link 
                to="/login" 
                onClick={() => setIsMobileMenuOpen(false)} 
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-l from-[#D4AF37] to-[#F59E0B] text-black font-black rounded-2xl text-xs shadow-lg"
              >
                <UserIcon size={16} /> تسجيل الدخول
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
