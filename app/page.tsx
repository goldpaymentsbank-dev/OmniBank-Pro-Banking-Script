'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  ArrowRightLeft, 
  CreditCard, 
  Bitcoin, 
  PiggyBank, 
  Settings, 
  Bell, 
  Search, 
  Menu, 
  X, 
  LogOut, 
  User,
  CheckCircle2,
  AlertCircle,
  Info,
  Building2,
  Lock,
  ExternalLink,
  ShieldCheck,
  Send
} from 'lucide-react';
import DashboardView from '@/components/views/DashboardView';
import TransferView from '@/components/views/TransferView';
import CardsView from '@/components/views/CardsView';
import CryptoView from '@/components/views/CryptoView';
import LoansView from '@/components/views/LoansView';
import SettingsView from '@/components/views/SettingsView';
import MeruView from '@/components/views/MeruView';
import MidsView from '@/components/views/MidsView';
import MorseView from '@/components/views/MorseView';
import AdminView from '@/components/views/AdminView';
import LiveSupportChat from '@/components/LiveSupportChat';
import TransactionReceiptModal from '@/components/TransactionReceiptModal';
import Plus500PaymentModal from '@/components/Plus500PaymentModal';
import { cn } from '@/lib/utils';
import { BankingProvider, useBanking, TransactionItem } from '@/lib/bankingStore';

type View = 'dashboard' | 'admin' | 'transfer' | 'cards' | 'crypto' | 'loans' | 'settings' | 'meru' | 'mids' | 'morse';

function BankingAppContent() {
  const { 
    userName, 
    userEmail, 
    notifications, 
    markNotificationsAsRead, 
    transactions,
    cards,
    users,
    activeUserId,
    switchUser,
  } = useBanking();

  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserSwitcherOpen, setIsUserSwitcherOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isPlus500ModalOpen, setIsPlus500ModalOpen] = useState(true);
  const [selectedReceiptTx, setSelectedReceiptTx] = useState<TransactionItem | null>(null);

  const unreadCount = notifications.filter(n => !n.read).length;
  const pendingApprovalsCount = transactions.filter(t => t.status === 'pending').length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { 
      id: 'admin', 
      label: 'Panel Gestor (Admin)', 
      icon: ShieldCheck, 
      badge: pendingApprovalsCount > 0 ? `${pendingApprovalsCount} PEND.` : 'GESTOR' 
    },
    { id: 'transfer', label: 'Transferencias SPEI / SEPA', icon: ArrowRightLeft },
    { id: 'morse', label: 'Beneficiario Morse', icon: Send, badge: 'ACH' },
    { id: 'mids', label: 'Comercios (MIDs)', icon: Building2, badge: 'PROD' },
    { id: 'meru', label: 'Depósito Meru', icon: ShieldCheck, badge: '1,720 MXN' },
    { id: 'cards', label: 'Tarjetas Virtuales', icon: CreditCard },
    { id: 'crypto', label: 'Cripto Custodia', icon: Bitcoin },
    { id: 'loans', label: 'Préstamos', icon: PiggyBank },
    { id: 'settings', label: 'Configuración & CLABE', icon: Settings },
  ] as const;

  const renderView = () => {
    switch (activeView) {
      case 'dashboard': return <DashboardView onNavigate={setActiveView} />;
      case 'admin': return <AdminView />;
      case 'morse': return <MorseView onBack={() => setActiveView('dashboard')} onNavigate={setActiveView} />;
      case 'mids': return <MidsView onNavigate={setActiveView} />;
      case 'meru': return <MeruView onBack={() => setActiveView('dashboard')} onNavigate={setActiveView} />;
      case 'transfer': return <TransferView onNavigate={setActiveView} />;
      case 'cards': return <CardsView />;
      case 'crypto': return <CryptoView />;
      case 'loans': return <LoansView onNavigate={setActiveView} />;
      case 'settings': return <SettingsView />;
      default: return <DashboardView onNavigate={setActiveView} />;
    }
  };

  // Live search results
  const searchResults = searchQuery.trim() ? {
    transactions: transactions.filter(t => 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.recipientOrSender.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.trackingKey && t.trackingKey.toLowerCase().includes(searchQuery.toLowerCase()))
    ).slice(0, 3),
    cards: cards.filter(c => 
      c.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.number.includes(searchQuery)
    ).slice(0, 2),
  } : null;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col md:flex-row font-sans">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-neutral-900 border-b border-neutral-800 sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md shadow-amber-500/20">
            <span className="font-extrabold text-neutral-950 text-sm">G</span>
          </div>
          <span className="font-bold text-base tracking-tight text-neutral-100">Gold Payments</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="mobile-pay-plus500-btn"
            onClick={() => setIsPlus500ModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500 text-neutral-950 font-bold text-xs shadow-sm"
          >
            <Send size={12} />
            <span>Pagar</span>
          </button>
          <button 
            onClick={() => {
              setIsNotifOpen(!isNotifOpen);
              if (!isNotifOpen) markNotificationsAsRead();
            }}
            className="relative p-2 text-neutral-400 hover:text-neutral-100 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-neutral-900"></span>
            )}
          </button>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-neutral-400 hover:text-neutral-100 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-neutral-900 border-r border-neutral-800 h-screen sticky top-0 shrink-0">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <span className="font-extrabold text-xl text-neutral-950">G</span>
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-neutral-100 block">Gold Payments</span>
            <span className="text-[10px] text-amber-400 font-semibold tracking-wider uppercase">Banxico SPEI & Luhn</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 text-sm",
                activeView === item.id 
                  ? "bg-amber-500 text-neutral-950 font-bold shadow-md shadow-amber-500/10" 
                  : "text-neutral-400 hover:bg-neutral-800/60 hover:text-neutral-200 font-medium"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon size={18} className={activeView === item.id ? "text-neutral-950" : ""} />
                <span>{item.label}</span>
              </div>
              {'badge' in item && item.badge && (
                <span className={cn(
                  "text-[10px] font-mono px-1.5 py-0.5 rounded font-bold uppercase",
                  activeView === item.id 
                    ? "bg-neutral-950/20 text-neutral-950" 
                    : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                )}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* User Card in Sidebar */}
        <div className="p-4 mt-auto border-t border-neutral-800 space-y-2">
          <div 
            onClick={() => setActiveView('settings')}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800/80 cursor-pointer hover:border-neutral-700 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-amber-400 font-bold text-sm">
              {userName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-neutral-200 truncate">{userName}</p>
              <p className="text-[11px] text-emerald-400 truncate flex items-center gap-1 font-medium">
                <CheckCircle2 size={11} /> Verificado Nivel 2
              </p>
            </div>
          </div>
          <button 
            onClick={() => setIsSignOutModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40 rounded-lg transition-colors"
          >
            <LogOut size={14} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer (with backdrop) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden"
            />
            <motion.div 
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.25 }}
              className="fixed inset-y-0 left-0 z-50 w-64 bg-neutral-900 border-r border-neutral-800 flex flex-col h-screen md:hidden"
            >
              <div className="p-4 flex items-center justify-between border-b border-neutral-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md shadow-amber-500/20">
                    <span className="font-extrabold text-neutral-950 text-sm">G</span>
                  </div>
                  <span className="font-bold text-base tracking-tight text-neutral-100">Gold Payments</span>
                </div>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 text-neutral-400 hover:text-neutral-100 rounded-lg hover:bg-neutral-800"
                >
                  <X size={18} />
                </button>
              </div>

              <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveView(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 text-sm",
                      activeView === item.id 
                        ? "bg-amber-500 text-neutral-950 font-bold shadow-md shadow-amber-500/10" 
                        : "text-neutral-400 hover:bg-neutral-800/60 hover:text-neutral-200 font-medium"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={18} className={activeView === item.id ? "text-neutral-950" : ""} />
                      <span>{item.label}</span>
                    </div>
                    {'badge' in item && item.badge && (
                      <span className={cn(
                        "text-[10px] font-mono px-1.5 py-0.5 rounded font-bold uppercase",
                        activeView === item.id 
                          ? "bg-neutral-950/20 text-neutral-950" 
                          : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                      )}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </nav>

              <div className="p-4 mt-auto border-t border-neutral-800 space-y-2">
                <div 
                  onClick={() => {
                    setActiveView('settings');
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800/80 cursor-pointer hover:border-neutral-700 transition-colors"
                >
                  <div className="w-9 h-9 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-amber-400 font-bold text-sm">
                    {userName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-neutral-200 truncate">{userName}</p>
                    <p className="text-[11px] text-emerald-400 truncate flex items-center gap-1 font-medium">
                      <CheckCircle2 size={11} /> Verificado Nivel 2
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsSignOutModalOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40 rounded-lg transition-colors"
                >
                  <LogOut size={14} />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 h-screen overflow-hidden flex flex-col bg-neutral-950">
        {/* Top Header */}
        <header className="h-18 hidden md:flex items-center justify-between px-8 border-b border-neutral-900 bg-neutral-950/80 backdrop-blur-xl z-30">
          {/* Search bar */}
          <div className="relative w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar transferencias, folios, tarjetas..." 
              className="w-full bg-neutral-900 border border-neutral-800 rounded-full py-2 pl-10 pr-4 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 text-neutral-200 placeholder-neutral-500"
            />

            {/* Quick Search Dropdown */}
            {searchResults && (searchResults.transactions.length > 0 || searchResults.cards.length > 0) && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-neutral-900 border border-neutral-800 rounded-2xl p-3 shadow-2xl z-50 text-xs space-y-2">
                {searchResults.transactions.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">Movimientos</span>
                    {searchResults.transactions.map(t => (
                      <div 
                        key={t.id}
                        onClick={() => {
                          setSelectedReceiptTx(t);
                          setSearchQuery('');
                        }}
                        className="p-2 hover:bg-neutral-800 rounded-lg cursor-pointer flex justify-between items-center"
                      >
                        <span className="text-neutral-200 truncate">{t.title}</span>
                        <span className="font-mono text-amber-400 font-semibold">${t.amount}</span>
                      </div>
                    ))}
                  </div>
                )}
                {searchResults.cards.length > 0 && (
                  <div className="pt-1 border-t border-neutral-800">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">Tarjetas</span>
                    {searchResults.cards.map(c => (
                      <div 
                        key={c.id}
                        onClick={() => {
                          setActiveView('cards');
                          setSearchQuery('');
                        }}
                        className="p-2 hover:bg-neutral-800 rounded-lg cursor-pointer flex justify-between items-center"
                      >
                        <span className="text-neutral-200">Tarjeta {c.brand} (•••• {c.number.slice(-4)})</span>
                        <span className="text-emerald-400 text-[10px]">Luhn OK</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3 relative">
            {/* User Profile & Switcher */}
            <div className="relative">
              <button
                onClick={() => setIsUserSwitcherOpen(!isUserSwitcherOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-xs text-neutral-200 transition-colors cursor-pointer"
              >
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[10px]">
                  {userName.charAt(0)}
                </div>
                <span className="font-semibold max-w-[110px] truncate">{userName}</span>
                <span className="text-[10px] text-neutral-500 font-mono">▼</span>
              </button>

              <AnimatePresence>
                {isUserSwitcherOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-72 bg-neutral-900 border border-neutral-800 rounded-2xl p-2.5 shadow-2xl z-50 text-xs space-y-1.5"
                  >
                    <div className="px-2.5 py-1 text-[10px] uppercase font-bold text-neutral-400 border-b border-neutral-800 flex justify-between items-center">
                      <span>Cuentas del Sistema</span>
                      <span className="text-emerald-400 font-mono">{users.length} cuentas</span>
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-1">
                      {users.map((u) => (
                        <div
                          key={u.id}
                          onClick={() => {
                            switchUser(u.id);
                            setIsUserSwitcherOpen(false);
                          }}
                          className={`p-2 rounded-xl cursor-pointer flex items-center justify-between transition-colors ${
                            u.id === activeUserId
                              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold'
                              : 'hover:bg-neutral-800 text-neutral-300'
                          }`}
                        >
                          <div>
                            <p className="font-semibold flex items-center gap-1">
                              {u.name}
                              {u.status === 'blocked' && (
                                <span className="text-[9px] px-1 rounded bg-red-500/20 text-red-300">Bloqueada</span>
                              )}
                            </p>
                            <p className="text-[10px] text-neutral-500 font-mono">{u.accountNumber}</p>
                          </div>
                          <span className="text-[11px] font-mono text-emerald-400 font-bold">
                            ${u.balance.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-1.5 border-t border-neutral-800">
                      <button
                        onClick={() => {
                          setActiveView('admin');
                          setIsUserSwitcherOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 font-bold text-[11px] flex items-center gap-1.5 cursor-pointer"
                      >
                        <ShieldCheck size={14} />
                        Acceder al Panel Gestor Central
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              id="header-pay-plus500-btn"
              onClick={() => setIsPlus500ModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all shadow-sm shadow-amber-500/10"
            >
              <Send size={13} />
              <span>Pagar Plus500 (MXN)</span>
            </button>

            <div className="relative">
              <button 
                onClick={() => {
                  setIsNotifOpen(!isNotifOpen);
                  if (!isNotifOpen) markNotificationsAsRead();
                }}
                className="relative p-2.5 text-neutral-400 hover:text-neutral-100 rounded-xl hover:bg-neutral-900 transition-colors"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-amber-500 rounded-full"></span>
                )}
              </button>

              {/* Notifications Popover */}
              <AnimatePresence>
                {isNotifOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-3 w-80 bg-neutral-900 border border-neutral-800 rounded-3xl p-4 shadow-2xl z-50 space-y-3"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                      <h4 className="font-bold text-sm text-neutral-100">Notificaciones</h4>
                      <button 
                        onClick={markNotificationsAsRead}
                        className="text-[11px] text-amber-500 hover:text-amber-400 font-medium"
                      >
                        Marcar como leídas
                      </button>
                    </div>

                    <div className="max-h-72 overflow-y-auto space-y-2 pr-1 divide-y divide-neutral-800/80">
                      {notifications.map(n => (
                        <div key={n.id} className="pt-2 first:pt-0 space-y-0.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-neutral-200">{n.title}</span>
                            <span className="text-[10px] text-neutral-500">{n.time}</span>
                          </div>
                          <p className="text-[11px] text-neutral-400 leading-relaxed">{n.message}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* View Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          {/* Plus500 Quick-Pay Priority Banner */}
          <div className="max-w-7xl mx-auto mb-6">
            <div className="rounded-2xl bg-gradient-to-r from-neutral-900 via-amber-950/40 to-neutral-900 border border-amber-500/40 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl shadow-amber-500/5">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                  <Building2 size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
                      Orden de Pago Plus500SEY Ltd
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      Deutsche Bank AG
                    </span>
                  </div>
                  <p className="text-xs text-neutral-300 mt-1">
                    Beneficiario: <strong className="text-neutral-100">Plus500SEY Ltd</strong> • IBAN: <strong className="font-mono text-amber-300">DE98 5007 0010 0176 9009 04</strong> • Ref Obligatoria: <strong className="font-mono text-amber-300">185591571</strong> (MXN)
                  </p>
                </div>
              </div>
              <button
                id="banner-pay-plus500-btn"
                onClick={() => setIsPlus500ModalOpen(true)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-amber-500/20 shrink-0"
              >
                <Send size={15} />
                <span>Pagar Orden Ahora</span>
              </button>
            </div>
          </div>

          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="max-w-7xl mx-auto"
          >
            {renderView()}
          </motion.div>
        </div>
      </main>

      {/* Sign Out Modal */}
      {isSignOutModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 md:p-8 max-w-sm w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-neutral-100">Sesión de Usuario</h3>
              <button 
                onClick={() => setIsSignOutModalOpen(false)}
                className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-neutral-100"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed">
              ¿Deseas bloquear la sesión temporalmente o cerrar sesión del portal financiero?
            </p>

            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => {
                  setIsLocked(true);
                  setIsSignOutModalOpen(false);
                }}
                className="flex-1 py-3 bg-neutral-800 text-neutral-200 font-semibold rounded-xl hover:bg-neutral-700 transition-colors text-xs"
              >
                Bloquear Sesión
              </button>
              <button 
                onClick={() => {
                  setIsSignOutModalOpen(false);
                }}
                className="flex-1 py-3 bg-amber-500 text-neutral-950 font-bold rounded-xl hover:bg-amber-400 transition-colors text-xs"
              >
                Mantener Activa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lock Screen simulation */}
      {isLocked && (
        <div className="fixed inset-0 z-50 bg-neutral-950 flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-8 text-center space-y-5 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto">
              <Lock size={28} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-neutral-100">Sesión Bloqueada</h2>
              <p className="text-xs text-neutral-400 mt-1">Ingresa para reanudar el acceso a Gold Payments Bank</p>
            </div>
            <button 
              onClick={() => setIsLocked(false)}
              className="w-full py-3.5 bg-amber-500 text-neutral-950 font-bold rounded-xl hover:bg-amber-400 transition-colors text-sm shadow-lg shadow-amber-500/10"
            >
              Desbloquear Cuenta
            </button>
          </div>
        </div>
      )}

      {/* Plus500 Direct Payment Modal */}
      <Plus500PaymentModal
        isOpen={isPlus500ModalOpen}
        onClose={() => setIsPlus500ModalOpen(false)}
        onViewReceipt={(tx) => setSelectedReceiptTx(tx)}
      />

      {/* Global Transaction Receipt Modal (e.g. from search) */}
      <TransactionReceiptModal
        transaction={selectedReceiptTx}
        onClose={() => setSelectedReceiptTx(null)}
      />

      {/* 24/7 Live Support Customer Chat */}
      <LiveSupportChat />
    </div>
  );
}

export default function BankingApp() {
  return (
    <BankingProvider>
      <BankingAppContent />
    </BankingProvider>
  );
}
