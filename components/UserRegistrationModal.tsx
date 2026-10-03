'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  UserPlus, 
  CheckCircle2, 
  ShieldCheck, 
  DollarSign, 
  Building2, 
  Sparkles, 
  Mail, 
  Phone, 
  User, 
  CreditCard,
  ArrowRight
} from 'lucide-react';
import { useBanking } from '@/lib/bankingStore';

interface UserRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (userId: string) => void;
}

export default function UserRegistrationModal({
  isOpen,
  onClose,
  onSuccess,
}: UserRegistrationModalProps) {
  const { registerNewUser, switchUser } = useBanking();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [postalCode, setPostalCode] = useState('06600');
  const [accountType, setAccountType] = useState<'corriente' | 'ahorros' | 'inversion'>('corriente');
  const [currency, setCurrency] = useState<'USD' | 'MXN' | 'EUR'>('USD');
  const [pin, setPin] = useState('1234');
  const [password, setPassword] = useState('GoldPay2026!');
  const [tier, setTier] = useState<'Personal' | 'Premier' | 'Empresarial'>('Personal');
  const [initialDeposit, setInitialDeposit] = useState('1000');
  const [autoSwitch, setAutoSwitch] = useState(true);
  const [createdUserId, setCreatedUserId] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    name: string;
    accountNumber: string;
    clabe: string;
    balance: number;
    tier: string;
    postalCode: string;
    currency: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    const dep = parseFloat(initialDeposit) || 0;
    const created = registerNewUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim() || '+52 55 ' + Math.floor(10000000 + Math.random() * 90000000),
      postalCode: postalCode.trim() || '06600',
      initialDeposit: dep,
      tier,
    });

    if (autoSwitch) {
      switchUser(created.id);
    }

    setCreatedUserId(created.id);
    setSuccessData({
      name: created.name,
      accountNumber: created.accountNumber,
      clabe: created.clabe,
      balance: created.balance,
      tier: created.tier,
      postalCode: created.postalCode || postalCode,
      currency,
    });
  };

  const handleResetAndClose = () => {
    const idToReturn = createdUserId;
    setSuccessData(null);
    setCreatedUserId(null);
    setName('');
    setEmail('');
    setPhone('');
    setInitialDeposit('1000');
    setTier('Personal');
    onClose();
    if (idToReturn && onSuccess) {
      onSuccess(idToReturn);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 md:p-8 max-w-lg w-full space-y-6 shadow-2xl text-neutral-100 relative overflow-hidden"
      >
        {/* Glow */}
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <UserPlus size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-neutral-100">
                Apertura y Registro de Cuenta
              </h3>
              <p className="text-xs text-neutral-400">
                Banco Gold Payments &bull; Emisión instantánea CLABE Banxico
              </p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-1.5 rounded-xl hover:bg-neutral-800 text-neutral-400 hover:text-neutral-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* SUCCESS VIEW */}
        {successData ? (
          <div className="space-y-5 text-center py-2">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <h4 className="text-xl font-bold text-neutral-100">¡Cuenta Creada Exitosamente!</h4>
              <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                La cuenta bancaria para <strong className="text-neutral-200">{successData.name}</strong> ha sido dada de alta en el sistema central en tiempo real.
              </p>
            </div>

            <div className="p-4 bg-neutral-950/80 rounded-2xl border border-neutral-800 text-left space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-neutral-850">
                <span className="text-neutral-400">Número de Cuenta:</span>
                <span className="font-mono font-bold text-neutral-100">{successData.accountNumber}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-neutral-850">
                <span className="text-neutral-400">CLABE Interbancaria (SPEI):</span>
                <span className="font-mono font-bold text-amber-400 select-all">{successData.clabe}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-neutral-850">
                <span className="text-neutral-400">Nivel de Cuenta:</span>
                <span className="font-semibold text-emerald-400">{successData.tier}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-neutral-850">
                <span className="text-neutral-400">Código Postal (AVS):</span>
                <span className="font-mono font-bold text-neutral-100">{successData.postalCode}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-neutral-400">Saldo Inicial Disponible:</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  ${successData.balance.toFixed(2)} {successData.currency}
                </span>
              </div>
            </div>

            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-left text-xs text-emerald-300 flex items-center gap-2">
              <Mail size={16} className="shrink-0" />
              <span>Se ha enviado la carta oficial de bienvenida y los datos de acceso por correo electrónico.</span>
            </div>

            <button
              type="button"
              onClick={handleResetAndClose}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20"
            >
              Comenzar a Operar
            </button>
          </div>
        ) : (
          /* FORM VIEW */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
                <User size={13} className="text-amber-400" />
                <span>Nombre Completo del Titular *</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Roberto Martínez García"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
                  <Mail size={13} className="text-amber-400" />
                  <span>Correo Electrónico *</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="cliente@ejemplo.com"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
                  <Phone size={13} className="text-amber-400" />
                  <span>Teléfono Móvil *</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+52 55 1234 5678"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
                  <Building2 size={13} className="text-amber-400" />
                  <span>Código Postal (Validación AVS Pagos) *</span>
                </label>
                <input
                  type="text"
                  required
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="Ej. 06600"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
                  <DollarSign size={13} className="text-emerald-400" />
                  <span>Divisa Principal</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['USD', 'MXN', 'EUR'] as const).map((curr) => (
                    <button
                      key={curr}
                      type="button"
                      onClick={() => setCurrency(curr)}
                      className={`py-2 px-1 rounded-xl border text-xs font-bold transition-all ${
                        currency === curr
                          ? 'bg-amber-500 text-neutral-950 border-amber-500'
                          : 'bg-neutral-950 text-neutral-400 border-neutral-800'
                      }`}
                    >
                      {curr}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Tipo de Cuenta
                </label>
                <select
                  value={accountType}
                  onChange={(e: any) => setAccountType(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-neutral-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="corriente">Cuenta Corriente (Cheques)</option>
                  <option value="ahorros">Cuenta de Ahorros con Rendimiento</option>
                  <option value="inversion">Cuenta de Inversión y Custodia</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Nivel / Tier
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {(['Personal', 'Premier', 'Empresarial'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTier(t)}
                      className={`py-2 px-1 rounded-xl border text-[11px] font-bold transition-all ${
                        tier === t
                          ? 'bg-amber-500 text-neutral-950 border-amber-500'
                          : 'bg-neutral-950 text-neutral-400 border-neutral-800'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-amber-400" />
                  <span>PIN de Seguridad (4 Dígitos) *</span>
                </label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs font-mono tracking-widest text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-amber-400" />
                  <span>Contraseña de Acceso *</span>
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contraseña segura"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
                <DollarSign size={13} className="text-emerald-400" />
                <span>Depósito Inicial (USD)</span>
              </label>
              <div className="flex gap-2 mb-2">
                {['0', '500', '1000', '2500', '5000'].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setInitialDeposit(amt)}
                    className={`flex-1 py-1.5 rounded-lg border text-[11px] font-mono font-semibold transition-colors ${
                      initialDeposit === amt
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    ${amt}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min="0"
                step="50"
                value={initialDeposit}
                onChange={(e) => setInitialDeposit(e.target.value)}
                placeholder="Monto en USD"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs font-mono text-neutral-100 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={autoSwitch}
                onChange={(e) => setAutoSwitch(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 bg-neutral-950 border-neutral-800 focus:ring-amber-500"
              />
              <span>Iniciar sesión automáticamente con esta nueva cuenta tras el registro</span>
            </label>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="flex-1 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-xs font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-extrabold rounded-xl text-xs sm:text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5"
              >
                <Sparkles size={16} />
                <span>Crear Cuenta Ahora</span>
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
