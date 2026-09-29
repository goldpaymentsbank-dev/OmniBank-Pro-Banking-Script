'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  UserPlus, 
  CheckCircle2, 
  ShieldCheck, 
  DollarSign, 
  Building2, 
  Sparkles, 
  Mail, 
  Phone, 
  User, 
  Calendar,
  MapPin,
  Globe,
  Lock,
  Key,
  Camera,
  ArrowRight,
  Upload,
  Check
} from 'lucide-react';
import { useBanking, DetailedUserRegistrationInput } from '@/lib/bankingStore';

interface CreateUserAdminPanelProps {
  onUserCreated?: (userId: string) => void;
  onGoToUsers?: () => void;
}

const AVATAR_OPTIONS = [
  { id: 'avatar-1', label: 'Ejecutivo 1', color: 'from-amber-400 to-amber-600', initials: 'EM' },
  { id: 'avatar-2', label: 'Inversor 2', color: 'from-emerald-400 to-teal-600', initials: 'JD' },
  { id: 'avatar-3', label: 'Premier 3', color: 'from-blue-500 to-indigo-700', initials: 'CL' },
  { id: 'avatar-4', label: 'Empresarial 4', color: 'from-purple-500 to-violet-700', initials: 'SA' },
];

export default function CreateUserAdminPanel({ onUserCreated, onGoToUsers }: CreateUserAdminPanelProps) {
  const { registerDetailedUser, users } = useBanking();

  // Personal Info Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('1992-04-15');
  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('06600');
  const [nationality, setNationality] = useState('Mexicana');

  // Account Config Form State
  const [accountType, setAccountType] = useState<'ahorros' | 'corriente' | 'inversion'>('corriente');
  const [tier, setTier] = useState<'Personal' | 'Premier' | 'Empresarial'>('Personal');
  const [currency, setCurrency] = useState<'USD' | 'MXN' | 'EUR'>('USD');
  const [initialDeposit, setInitialDeposit] = useState('2500');
  const [selectedAvatar, setSelectedAvatar] = useState('avatar-1');
  const [customAvatarPreview, setCustomAvatarPreview] = useState<string | null>(null);

  // Security Form State
  const [password, setPassword] = useState('GoldPay2026!');
  const [pin, setPin] = useState('4921');

  // Success view state
  const [createdUserData, setCreatedUserData] = useState<{
    id: string;
    name: string;
    email: string;
    accountNumber: string;
    clabe: string;
    postalCode: string;
    balance: number;
    currency: string;
    accountType: string;
  } | null>(null);

  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    const depositNum = parseFloat(initialDeposit) || 0;

    const input: DetailedUserRegistrationInput = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim() || '+52 55 ' + Math.floor(10000000 + Math.random() * 90000000),
      birthDate,
      address: address.trim() || 'Av. Paseo de las Palmas 405, CDMX',
      postalCode: postalCode.trim() || '06600',
      nationality: nationality.trim() || 'Mexicana',
      accountType,
      currency,
      avatarUrl: customAvatarPreview || selectedAvatar,
      initialDeposit: depositNum,
      tier,
      password,
      pin,
    };

    const newUser = registerDetailedUser(input);

    setCreatedUserData({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      accountNumber: newUser.accountNumber,
      clabe: newUser.clabe,
      postalCode: newUser.postalCode,
      balance: newUser.balance,
      currency: input.currency || 'USD',
      accountType: input.accountType || 'corriente',
    });

    if (onUserCreated) {
      onUserCreated(newUser.id);
    }
  };

  const handleResetForm = () => {
    setCreatedUserData(null);
    setName('');
    setEmail('');
    setPhone('');
    setAddress('');
    setPostalCode('06600');
    setNationality('Mexicana');
    setInitialDeposit('2500');
    setPassword('GoldPay2026!');
    setPin('4921');
    setCustomAvatarPreview(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="p-1 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <UserPlus size={16} />
              </span>
              <span className="text-[11px] font-bold tracking-widest uppercase text-emerald-400">
                Módulo Gestor Central
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                Total actual: {users.length} cuentas
              </span>
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">
              Create a new user (Alta Manual de Nuevo Usuario)
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Completa los datos del titular para emitir inmediatamente su cuenta bancaria central con número de cuenta, CLABE interbancaria Banxico, validación postal (AVS) y credenciales de acceso.
            </p>
          </div>
        </div>
      </div>

      {createdUserData ? (
        /* SUCCESS SUMMARY CARD */
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl text-center space-y-6 relative overflow-hidden"
        >
          <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 size={36} />
          </div>

          <div>
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              Usuario Registrado Exitosamente
            </span>
            <h3 className="text-2xl font-black text-white mt-3">
              {createdUserData.name}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Cuenta emitida y dada de alta en el sistema central en tiempo real. Contador global actualizado a <strong className="text-emerald-400">{users.length} usuarios</strong>.
            </p>
          </div>

          <div className="max-w-xl mx-auto p-5 bg-slate-950 rounded-2xl border border-slate-800 text-left text-xs space-y-3 font-mono">
            <div className="flex justify-between items-center pb-2 border-b border-slate-850">
              <span className="text-slate-400">Número de Cuenta Asignado:</span>
              <span className="font-bold text-white text-sm">{createdUserData.accountNumber}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-850">
              <span className="text-slate-400">CLABE Banxico (SPEI):</span>
              <span className="font-bold text-amber-400 text-sm select-all">{createdUserData.clabe}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-850">
              <span className="text-slate-400">Código Postal Validado (AVS):</span>
              <span className="font-bold text-slate-200">{createdUserData.postalCode}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-850">
              <span className="text-slate-400">Tipo de Cuenta:</span>
              <span className="font-bold text-emerald-400 uppercase">{createdUserData.accountType}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Saldo Inicial Acreditado:</span>
              <span className="font-bold text-emerald-400 text-sm">
                ${createdUserData.balance.toFixed(2)} {createdUserData.currency}
              </span>
            </div>
          </div>

          <div className="max-w-xl mx-auto p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-left text-xs text-emerald-300 flex items-center gap-2">
            <Mail size={16} className="shrink-0" />
            <span>Alerta oficial de bienvenida y datos de cuenta despachados a <strong>{createdUserData.email}</strong>.</span>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2 max-w-md mx-auto">
            <button
              onClick={handleResetForm}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
            >
              Registrar Otro Usuario
            </button>
            {onGoToUsers && (
              <button
                onClick={onGoToUsers}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-lg shadow-emerald-900/40 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Ver Lista de Usuarios</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </motion.div>
      ) : (
        /* DETAILED FORM VIEW */
        <form onSubmit={handleRegister} className="space-y-6">
          {/* SECTION 1: INFORMACIÓN PERSONAL */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
            <div className="border-b border-slate-800 pb-3 flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-sm font-bold text-white">1. Información Personal</h3>
                <p className="text-xs text-slate-400">Datos oficiales del titular para validación regulatoria y AVS.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nombres y Apellidos Completos *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Rodrigo Salazar Fuentes"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Correo Electrónico Oficial *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rodrigo.salazar@corporativo.mx"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                  <Phone size={13} className="text-emerald-400" />
                  <span>Número de Teléfono *</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+52 55 4912 8820"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                  <Calendar size={13} className="text-emerald-400" />
                  <span>Fecha de Nacimiento *</span>
                </label>
                <input
                  type="date"
                  required
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                  <Globe size={13} className="text-emerald-400" />
                  <span>Nacionalidad *</span>
                </label>
                <input
                  type="text"
                  required
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  placeholder="Mexicana, Estadounidense, etc."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                  <MapPin size={13} className="text-emerald-400" />
                  <span>Dirección de Domicilio *</span>
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Calle, número, colonia, municipio o alcaldía"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                  <Building2 size={13} className="text-amber-400" />
                  <span>Código Postal (AVS Online) *</span>
                </label>
                <input
                  type="text"
                  required
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="Ej. 06600"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">Requerido para validar compras en línea</span>
              </div>
            </div>
          </div>

          {/* SECTION 2: CONFIGURACIÓN DE CUENTA & FOTO DE PERFIL */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
            <div className="border-b border-slate-800 pb-3 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-sm font-bold text-white">2. Configuración de Cuenta y Fotografía</h3>
                <p className="text-xs text-slate-400">Modalidad operativa, divisa base y avatar de cliente.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Tipo de Cuenta *
                </label>
                <select
                  value={accountType}
                  onChange={(e: any) => setAccountType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="corriente">Cuenta Corriente (Cheques / Débito)</option>
                  <option value="ahorros">Cuenta de Ahorros con Interés</option>
                  <option value="inversion">Cuenta de Inversión y Custodia</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nivel de Cuenta (Tier) *
                </label>
                <select
                  value={tier}
                  onChange={(e: any) => setTier(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Personal">Personal (Operativa Diaria)</option>
                  <option value="Premier">Premier (Límites Altos & Asesor)</option>
                  <option value="Empresarial">Empresarial (Corporativa & MIDs)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Divisa Principal *
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['USD', 'MXN', 'EUR'] as const).map((curr) => (
                    <button
                      key={curr}
                      type="button"
                      onClick={() => setCurrency(curr)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                        currency === curr
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-900/30'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {curr}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                <DollarSign size={13} className="text-emerald-400" />
                <span>Depósito Inicial de Apertura ({currency}) *</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">$</span>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={initialDeposit}
                  onChange={(e) => setInitialDeposit(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Profile Picture Upload & Presets */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2 flex items-center gap-1.5">
                <Camera size={14} className="text-amber-400" />
                <span>Fotografía de Perfil / Avatar Bancario</span>
              </label>

              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="relative shrink-0">
                  {customAvatarPreview ? (
                    <img 
                      src={customAvatarPreview} 
                      alt="Avatar" 
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500 shadow-lg"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white font-bold text-lg border-2 border-amber-400/40 shadow-lg">
                      {name ? name.slice(0, 2).toUpperCase() : 'GP'}
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <label className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 border border-slate-700">
                      <Upload size={13} />
                      <span>Subir Fotografía</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarFileUpload}
                        className="hidden"
                      />
                    </label>

                    {customAvatarPreview && (
                      <button
                        type="button"
                        onClick={() => setCustomAvatarPreview(null)}
                        className="px-2.5 py-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
                      >
                        Quitar Foto
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Formatos JPG, PNG o WebP. Se utilizará en la identificación biométrica FIDO2 y credencial virtual del cliente.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: SEGURIDAD Y ACCESO */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
            <div className="border-b border-slate-800 pb-3 flex items-center gap-2">
              <Lock className="w-5 h-5 text-red-400" />
              <div>
                <h3 className="text-sm font-bold text-white">3. Seguridad y Credenciales de Acceso</h3>
                <p className="text-xs text-slate-400">Contraseña de inicio de sesión y PIN transaccional.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                  <Lock size={13} className="text-red-400" />
                  <span>Establecer Contraseña de Acceso *</span>
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-red-500"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">Se enviará cifrada al usuario por correo oficial</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                  <Key size={13} className="text-amber-400" />
                  <span>PIN Transaccional de 4 Dígitos *</span>
                </label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono tracking-widest text-white focus:outline-none focus:border-amber-500"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">Requerido para autorizar transferencias y pagos</span>
              </div>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold rounded-xl text-sm transition-all shadow-xl shadow-emerald-950/50 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles size={18} />
              <span>Register (Registrar Cuenta Inmediatamente)</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
