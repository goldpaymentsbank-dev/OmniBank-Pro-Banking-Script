'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Users, 
  ArrowUpRight, 
  ArrowDownRight, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Plus, 
  Mail, 
  Settings, 
  AlertCircle, 
  Building2, 
  DollarSign, 
  RefreshCcw, 
  UserCheck, 
  FileText,
  Key,
  Eye,
  Sliders,
  Check,
  Send,
  Download
} from 'lucide-react';
import { useBanking, UserAccountItem, TransactionItem, EmailNotificationLog } from '@/lib/bankingStore';
import EmailNotificationModal from '@/components/EmailNotificationModal';
import MercadoPagoProductionInspector from '@/components/MercadoPagoProductionInspector';

export default function AdminView() {
  const {
    users,
    activeUserId,
    transactions,
    securityConfig,
    emailLogs,
    adminCreditAccount,
    adminDebitAccount,
    adminToggleAccountBlock,
    adminApproveTransfer,
    adminRejectTransfer,
    updateSecurityConfig,
    registerNewUser,
    switchUser,
  } = useBanking();

  const [activeTab, setActiveTab] = useState<'users' | 'approvals' | 'security' | 'emails' | 'mercadopago'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [userFilter, setUserFilter] = useState<'all' | 'active' | 'blocked'>('all');

  // Modal States
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isDebitModalOpen, setIsDebitModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserAccountItem | null>(null);
  const [selectedTxToReject, setSelectedTxToReject] = useState<TransactionItem | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<EmailNotificationLog | null>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  // Form States
  const [depositAmount, setDepositAmount] = useState('');
  const [depositConcept, setDepositConcept] = useState('Depósito administrativo en ventanilla');
  const [debitAmount, setDebitAmount] = useState('');
  const [debitConcept, setDebitConcept] = useState('Ajuste de débito administrativo');
  const [rejectReason, setRejectReason] = useState('Falta de código de verificación COT/IMF o inconsistencia de datos');
  const [actionSuccessMessage, setActionSuccessMessage] = useState('');

  // Register Form State
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserDeposit, setNewUserDeposit] = useState('1000');
  const [newUserTier, setNewUserTier] = useState<'Personal' | 'Premier' | 'Empresarial'>('Personal');

  // Security Form State
  const [requireCot, setRequireCot] = useState(securityConfig.requireCot);
  const [requireImf, setRequireImf] = useState(securityConfig.requireImf);
  const [requireSwift, setRequireSwift] = useState(securityConfig.requireSwift);
  const [cotCode, setCotCode] = useState(securityConfig.cotCode);
  const [imfCode, setImfCode] = useState(securityConfig.imfCode);
  const [swiftCode, setSwiftCode] = useState(securityConfig.swiftCode);
  const [requireAdminApproval, setRequireAdminApproval] = useState(securityConfig.requireAdminApproval);
  const [minAmountForApproval, setMinAmountForApproval] = useState(securityConfig.minAmountForApproval.toString());
  const [savedSecurityFeedback, setSavedSecurityFeedback] = useState(false);

  // Computed Metrics
  const totalUsers = users.length;
  const totalBalance = users.reduce((acc, u) => acc + u.balance, 0);
  const pendingTransactions = transactions.filter(t => t.status === 'pending');
  const blockedUsersCount = users.filter(u => u.status === 'blocked').length;

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.accountNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.clabe.includes(searchQuery);
    if (userFilter === 'active') return matchesSearch && u.status === 'active';
    if (userFilter === 'blocked') return matchesSearch && u.status === 'blocked';
    return matchesSearch;
  });

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !depositAmount) return;
    const num = parseFloat(depositAmount);
    if (isNaN(num) || num <= 0) return;

    adminCreditAccount(selectedUser.id, num, depositConcept);
    setActionSuccessMessage(`Se han acreditado +$${num.toFixed(2)} USD a ${selectedUser.name}. Notificación enviada.`);
    setIsDepositModalOpen(false);
    setDepositAmount('');
    setTimeout(() => setActionSuccessMessage(''), 4000);
  };

  const handleDebitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !debitAmount) return;
    const num = parseFloat(debitAmount);
    if (isNaN(num) || num <= 0) return;

    const res = adminDebitAccount(selectedUser.id, num, debitConcept);
    if (res.success) {
      setActionSuccessMessage(`Se debitaron -$${num.toFixed(2)} USD de ${selectedUser.name}.`);
      setIsDebitModalOpen(false);
      setDebitAmount('');
      setTimeout(() => setActionSuccessMessage(''), 4000);
    } else {
      alert(res.error);
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) return;

    const initialDep = parseFloat(newUserDeposit) || 0;
    const created = registerNewUser({
      name: newUserName,
      email: newUserEmail,
      phone: newUserPhone,
      initialDeposit: initialDep,
      tier: newUserTier,
    });

    setActionSuccessMessage(`Cuenta creada con éxito para ${created.name} (${created.accountNumber}).`);
    setIsRegisterModalOpen(false);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserPhone('');
    setNewUserDeposit('1000');
    setTimeout(() => setActionSuccessMessage(''), 4000);
  };

  const handleApproveTx = (txId: string) => {
    const res = adminApproveTransfer(txId);
    if (res.success) {
      setActionSuccessMessage(`Transferencia autorizada y liquidada exitosamente.`);
      setTimeout(() => setActionSuccessMessage(''), 4000);
    }
  };

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTxToReject) return;
    adminRejectTransfer(selectedTxToReject.id, rejectReason);
    setIsRejectModalOpen(false);
    setActionSuccessMessage(`Transferencia rechazada y fondos reintegrados al usuario.`);
    setTimeout(() => setActionSuccessMessage(''), 4000);
  };

  const handleSaveSecurityConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateSecurityConfig({
      requireCot,
      requireImf,
      requireSwift,
      cotCode,
      imfCode,
      swiftCode,
      requireAdminApproval,
      minAmountForApproval: parseFloat(minAmountForApproval) || 5000,
    });
    setSavedSecurityFeedback(true);
    setTimeout(() => setSavedSecurityFeedback(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Gestor Identification */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-emerald-950/60 border border-emerald-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <span className="text-xs uppercase font-bold tracking-widest text-emerald-400">
                Módulo Gestor Central
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Modo Operador Bancario
              </span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Panel de Control y Administración Bancaria
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl mt-1">
              Administración de cuentas de usuarios, acreditación de depósitos, procesamiento de débitos, congelamiento de cuentas, aprobación de transferencias y configuración de códigos de seguridad (COT / IMF / SWIFT).
            </p>
          </div>

          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-900/30 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            Registrar Nueva Cuenta
          </button>
        </div>

        {/* Global Action Feedback Alert */}
        {actionSuccessMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccessMessage}</span>
          </motion.div>
        )}
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">Cuentas Registradas</p>
            <p className="text-2xl font-bold text-white mt-1">{totalUsers}</p>
            <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
              <UserCheck className="w-3 h-3" /> Base activa de clientes
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-800 text-slate-300">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">Saldo Total en Custodia</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">
              ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">USD Fondos consolidados</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">Transferencias Pendientes</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">{pendingTransactions.length}</p>
            <p className="text-[11px] text-amber-300/80 mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Requieren revisión manual
            </p>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">Cuentas Bloqueadas</p>
            <p className="text-2xl font-bold text-red-400 mt-1">{blockedUsersCount}</p>
            <p className="text-[11px] text-red-300/80 mt-1 flex items-center gap-1">
              <Lock className="w-3 h-3" /> En restricción operativa
            </p>
          </div>
          <div className="p-3 rounded-xl bg-red-500/10 text-red-400">
            <Lock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-800 overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'users'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          Gestión de Cuentas y Usuarios ({users.length})
        </button>

        <button
          onClick={() => setActiveTab('approvals')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer shrink-0 relative ${
            activeTab === 'approvals'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          Aprobación de Transferencias
          {pendingTransactions.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950">
              {pendingTransactions.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'security'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Key className="w-4 h-4" />
          Seguridad y Códigos (IMF / COT / SWIFT)
        </button>

        <button
          onClick={() => setActiveTab('emails')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'emails'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Mail className="w-4 h-4" />
          Registro de Correos Automáticos ({emailLogs.length})
        </button>

        <button
          onClick={() => setActiveTab('mercadopago')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'mercadopago'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          Mercado Pago (PRODUCCIÓN LIVE)
        </button>
      </div>

      {/* TAB 1: GESTIÓN DE USUARIOS */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre, email, cuenta o CLABE..."
                className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-slate-400">Filtrar:</span>
              <button
                onClick={() => setUserFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  userFilter === 'all' ? 'bg-slate-700 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                }`}
              >
                Todas ({users.length})
              </button>
              <button
                onClick={() => setUserFilter('active')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  userFilter === 'active' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                }`}
              >
                Activas
              </button>
              <button
                onClick={() => setUserFilter('blocked')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  userFilter === 'blocked' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                }`}
              >
                Bloqueadas ({blockedUsersCount})
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Usuario / Titular</th>
                    <th className="py-3 px-4">Cuenta & CLABE</th>
                    <th className="py-3 px-4">Nivel</th>
                    <th className="py-3 px-4 text-right">Saldo Actual</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                    <th className="py-3 px-4 text-right">Acciones Gestor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredUsers.map((u) => (
                    <tr 
                      key={u.id}
                      className={`hover:bg-slate-850/60 transition-colors ${
                        u.id === activeUserId ? 'bg-emerald-500/5' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                            u.status === 'blocked' 
                              ? 'bg-red-500/20 text-red-400' 
                              : 'bg-emerald-500/20 text-emerald-400'
                          }`}>
                            {u.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-white flex items-center gap-1.5">
                              {u.name}
                              {u.id === activeUserId && (
                                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono">
                                  Tú
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-slate-400">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px]">
                        <p className="text-white font-medium">{u.accountNumber}</p>
                        <p className="text-slate-400">{u.clabe}</p>
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300">
                          {u.tier}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <span className="font-mono font-bold text-white text-sm">
                          ${u.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] text-slate-400 block">USD</span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        {u.status === 'active' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Activa
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                            <Lock className="w-3 h-3" />
                            Bloqueada
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            title="Realizar Depósito Administrativo"
                            onClick={() => {
                              setSelectedUser(u);
                              setIsDepositModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors cursor-pointer"
                          >
                            <ArrowDownRight className="w-4 h-4" />
                          </button>

                          <button
                            title="Procesar Débito Administrativo"
                            onClick={() => {
                              setSelectedUser(u);
                              setIsDebitModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-colors cursor-pointer"
                          >
                            <ArrowUpRight className="w-4 h-4" />
                          </button>

                          <button
                            title={u.status === 'blocked' ? 'Desbloquear Cuenta' : 'Bloquear/Congelar Cuenta'}
                            onClick={() => adminToggleAccountBlock(u.id)}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              u.status === 'blocked'
                                ? 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border-red-500/40'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                            }`}
                          >
                            {u.status === 'blocked' ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                          </button>

                          {u.id !== activeUserId && (
                            <button
                              title="Operar en sesión de este usuario"
                              onClick={() => switchUser(u.id)}
                              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-slate-700 transition-colors cursor-pointer"
                            >
                              Cambiar a este usuario
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: APROBACIÓN DE TRANSFERENCIAS BANCARIAS */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-400" />
                  Cola de Transferencias Pendientes de Autorización
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Operaciones bancarias retenidas para validación por superar el umbral de seguridad (${securityConfig.minAmountForApproval.toLocaleString()} USD) o requerir códigos COT / IMF.
                </p>
              </div>

              <span className="text-xs font-mono font-bold px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full">
                {pendingTransactions.length} pendientes
              </span>
            </div>

            {pendingTransactions.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                <p className="text-sm font-semibold text-white">No hay transferencias pendientes</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Todas las operaciones enviadas han sido aprobadas o liquidadas en tiempo real.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-4 rounded-xl bg-slate-950/80 border border-amber-500/30 hover:border-amber-500/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 uppercase">
                          Pendiente Gestor
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          Folio: {tx.trackingKey || tx.id}
                        </span>
                        <span className="text-xs text-slate-500">• {tx.date}</span>
                      </div>

                      <h4 className="text-sm font-bold text-white">{tx.title}</h4>
                      <p className="text-xs text-slate-300">
                        Destinatario: <span className="font-semibold text-white">{tx.recipientOrSender}</span>
                      </p>
                      {tx.clabe && (
                        <p className="text-[11px] text-slate-400 font-mono">
                          Destino: {tx.clabe}
                        </p>
                      )}
                      {tx.reference && (
                        <p className="text-[11px] text-slate-400 italic">
                          Referencia: {tx.reference}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-4 shrink-0">
                      <div className="text-right">
                        <span className="text-lg font-black text-amber-400 font-mono">
                          ${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          Comisión: ${tx.fee.toFixed(2)} USD
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleApproveTx(tx.id)}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950 transition-all cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          Aprobar
                        </button>

                        <button
                          onClick={() => {
                            setSelectedTxToReject(tx);
                            setIsRejectModalOpen(true);
                          }}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 text-xs font-bold transition-all cursor-pointer"
                        >
                          <XCircle className="w-4 h-4" />
                          Rechazar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SEGURIDAD Y CÓDIGOS (IMF / COT / SWIFT) */}
      {activeTab === 'security' && (
        <form onSubmit={handleSaveSecurityConfig} className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-emerald-400" />
                Configuración de Códigos de Transferencia Bancaria
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Configura los requisitos de validación previa que los usuarios deben ingresar para completar envíos de dinero. Puedes activar o desactivar cualquiera de estos códigos según las políticas del sistema.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Código COT */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Código COT</h4>
                    <p className="text-[11px] text-slate-400">Cost of Transfer / Certificado</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requireCot}
                      onChange={(e) => setRequireCot(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Código COT Maestro:</label>
                  <input
                    type="text"
                    value={cotCode}
                    onChange={(e) => setCotCode(e.target.value)}
                    disabled={!requireCot}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-emerald-500 disabled:opacity-40"
                  />
                </div>
                <p className="text-[10px] text-slate-500">
                  {requireCot ? 'Exigido en transferencias bancarias.' : 'Desactivado: Las transferencias no pedirán COT.'}
                </p>
              </div>

              {/* Código IMF */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Código IMF</h4>
                    <p className="text-[11px] text-slate-400">Fondo Monetario Internacional</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requireImf}
                      onChange={(e) => setRequireImf(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Código IMF Maestro:</label>
                  <input
                    type="text"
                    value={imfCode}
                    onChange={(e) => setImfCode(e.target.value)}
                    disabled={!requireImf}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-emerald-500 disabled:opacity-40"
                  />
                </div>
                <p className="text-[10px] text-slate-500">
                  {requireImf ? 'Exigido en transferencias de alta seguridad.' : 'Desactivado: Las transferencias no pedirán IMF.'}
                </p>
              </div>

              {/* Código SWIFT / PIN */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Código SWIFT / PIN</h4>
                    <p className="text-[11px] text-slate-400">Verificación Internacional</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requireSwift}
                      onChange={(e) => setRequireSwift(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Código SWIFT Maestro:</label>
                  <input
                    type="text"
                    value={swiftCode}
                    onChange={(e) => setSwiftCode(e.target.value)}
                    disabled={!requireSwift}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-emerald-500 disabled:opacity-40"
                  />
                </div>
                <p className="text-[10px] text-slate-500">
                  {requireSwift ? 'Exigido en envíos internacionales.' : 'Desactivado: No se requerirá PIN SWIFT.'}
                </p>
              </div>
            </div>

            {/* Threshold Approval Config */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Aprobación Obligatoria del Gestor para Montos Altos
                </h4>
                <p className="text-xs text-slate-400">
                  Cualquier envío que supere este monto quedará en estado &ldquo;Pendiente de Aprobación&rdquo; hasta que el Gestor lo autorice.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requireAdminApproval}
                    onChange={(e) => setRequireAdminApproval(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>

                <div className="flex items-center gap-1 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                  <span className="text-xs text-slate-400">$</span>
                  <input
                    type="number"
                    value={minAmountForApproval}
                    onChange={(e) => setMinAmountForApproval(e.target.value)}
                    disabled={!requireAdminApproval}
                    className="w-24 bg-transparent text-xs font-mono font-bold text-white focus:outline-none disabled:opacity-40"
                  />
                  <span className="text-xs text-slate-400">USD</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-emerald-400">
                {savedSecurityFeedback && '¡Configuración guardada y activa en el sistema bancario!'}
              </span>

              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg transition-all cursor-pointer"
              >
                Guardar Configuración de Seguridad
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 4: REGISTRO DE NOTIFICACIONES POR CORREO ELECTRÓNICO */}
      {activeTab === 'emails' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Mail className="w-5 h-5 text-emerald-400" />
                  Registro Central de Notificaciones por Correo Electrónico
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  El sistema emite comprobantes oficiales por correo electrónico automáticamente tras cada depósito, débito, transferencia o cambio de estado.
                </p>
              </div>

              <span className="text-xs font-mono font-bold px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full">
                {emailLogs.length} notificaciones emitidas
              </span>
            </div>

            <div className="divide-y divide-slate-800">
              {emailLogs.map((log) => (
                <div
                  key={log.id}
                  onClick={() => {
                    setSelectedEmail(log);
                    setIsEmailModalOpen(true);
                  }}
                  className="py-3.5 px-3 -mx-3 rounded-xl hover:bg-slate-850/60 transition-colors flex items-center justify-between gap-4 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-white">{log.subject}</p>
                        <span className="text-[10px] px-2 py-0.2 rounded-full font-mono bg-slate-800 text-slate-400">
                          {log.to}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{log.preview}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[11px] text-slate-500 font-mono">{log.sentAt}</span>
                    <button className="text-xs font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      Ver Correo
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: MERCADO PAGO PRODUCCIÓN LIVE & WEBHOOKS */}
      {activeTab === 'mercadopago' && (
        <MercadoPagoProductionInspector />
      )}

      {/* MODAL: REALIZAR DEPÓSITO */}
      {isDepositModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl text-slate-100">
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
              <ArrowDownRight className="w-5 h-5 text-emerald-400" />
              Realizar Depósito Administrativo
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Acreditar fondos a <strong>{selectedUser.name}</strong> ({selectedUser.accountNumber}) con notificación inmediata por correo.
            </p>

            <form onSubmit={handleDepositSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Monto a Acreditar (USD):</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">$</span>
                  <input
                    type="number"
                    step="any"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="Ej. 5000.00"
                    required
                    className="w-full pl-7 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Concepto / Referencia Oficial:</label>
                <input
                  type="text"
                  value={depositConcept}
                  onChange={(e) => setDepositConcept(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1 font-mono">
                <p>Destinatario: {selectedUser.name}</p>
                <p>CLABE: {selectedUser.clabe}</p>
                <p>Saldo previo: ${selectedUser.balance.toFixed(2)} USD</p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDepositModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg cursor-pointer"
                >
                  Acreditar Depósito
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PROCESAR DÉBITO */}
      {isDebitModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl text-slate-100">
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
              <ArrowUpRight className="w-5 h-5 text-amber-400" />
              Procesar Débito Administrativo
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Debitar fondos de <strong>{selectedUser.name}</strong> ({selectedUser.accountNumber}).
            </p>

            <form onSubmit={handleDebitSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Monto a Debitar (USD):</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">$</span>
                  <input
                    type="number"
                    step="any"
                    value={debitAmount}
                    onChange={(e) => setDebitAmount(e.target.value)}
                    placeholder="Ej. 1500.00"
                    required
                    className="w-full pl-7 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Causa / Justificación de Débito:</label>
                <input
                  type="text"
                  value={debitConcept}
                  onChange={(e) => setDebitConcept(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1 font-mono">
                <p>Titular: {selectedUser.name}</p>
                <p>Saldo disponible: ${selectedUser.balance.toFixed(2)} USD</p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDebitModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-bold shadow-lg cursor-pointer"
                >
                  Ejecutar Débito
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR NUEVA CUENTA */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl text-slate-100">
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
              <Plus className="w-5 h-5 text-emerald-400" />
              Alta y Registro de Nueva Cuenta Bancaria
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Crea un nuevo usuario en la base de datos con asignación automática de cuenta y CLABE Banxico.
            </p>

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Nombre Completo:</label>
                  <input
                    type="text"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="Ej. Rodrigo Salazar"
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Correo Electrónico:</label>
                  <input
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="rodrigo@ejemplo.com"
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Teléfono:</label>
                  <input
                    type="text"
                    value={newUserPhone}
                    onChange={(e) => setNewUserPhone(e.target.value)}
                    placeholder="+52 55 1234 5678"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Tipo de Cuenta (Tier):</label>
                  <select
                    value={newUserTier}
                    onChange={(e: any) => setNewUserTier(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Personal">Personal</option>
                    <option value="Premier">Premier</option>
                    <option value="Empresarial">Empresarial</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Depósito Inicial de Apertura (USD):</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">$</span>
                  <input
                    type="number"
                    step="any"
                    value={newUserDeposit}
                    onChange={(e) => setNewUserDeposit(e.target.value)}
                    className="w-full pl-7 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg cursor-pointer"
                >
                  Crear y Activar Cuenta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RECHAZAR TRANSFERENCIA */}
      {isRejectModalOpen && selectedTxToReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl text-slate-100">
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
              <XCircle className="w-5 h-5 text-red-400" />
              Rechazar Transferencia Bancaria
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              La operación será cancelada y el monto de ${selectedTxToReject.amount.toFixed(2)} USD será reembolsado al saldo del cliente.
            </p>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Motivo Oficial del Rechazo:</label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg cursor-pointer"
                >
                  Confirmar Rechazo y Reembolso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VISUALIZAR CORREO COMPLETO */}
      <EmailNotificationModal
        email={selectedEmail}
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
      />
    </div>
  );
}
