'use client';

import { useState } from 'react';
import { 
  User, 
  Shield, 
  Key, 
  FileText, 
  CheckCircle2, 
  Building2, 
  Copy, 
  Check, 
  RefreshCw, 
  Upload, 
  X,
  AlertCircle,
  Smartphone,
  Send,
  BadgeCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBanking } from '@/lib/bankingStore';
import { validateClabe, validateAbaRouting, validateAchAccount, MORSE_DEFAULT_BENEFICIARY } from '@/lib/bankingValidation';
import MercadoPagoWithdrawModal from '@/components/MercadoPagoWithdrawModal';

type SettingsTab = 'profile' | 'security' | 'clabe' | 'kyc' | 'morse';

export default function SettingsView() {
  const { 
    userClabe, 
    userAccount, 
    userName, 
    userEmail, 
    userPhone, 
    regenerateClabe,
    activeOtp,
    generateNewOtp,
    morseBeneficiary,
    updateMorseBeneficiary
  } = useBanking();

  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [isMpWithdrawModalOpen, setIsMpWithdrawModalOpen] = useState(false);

  // Morse settings state
  const [morseRouting, setMorseRouting] = useState(morseBeneficiary.routingNumber);
  const [morseAccount, setMorseAccount] = useState(morseBeneficiary.accountNumber);
  const [morseHolder, setMorseHolder] = useState(morseBeneficiary.holderName);
  const [morseSaveSuccess, setMorseSaveSuccess] = useState(false);
  const [morseError, setMorseError] = useState('');

  // Profile form state
  const [name, setName] = useState(userName);
  const [email, setEmail] = useState(userEmail);
  const [phone, setPhone] = useState(userPhone);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Security state
  const [is2faEnabled, setIs2faEnabled] = useState(true);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // CLABE state
  const [copiedClabe, setCopiedClabe] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [clabeNotice, setClabeNotice] = useState('');

  // KYC state
  const [kycFiles, setKycFiles] = useState<{ [key: string]: boolean }>({
    ine: true,
    domicilio: true,
    rfc: false,
  });
  const [kycSuccessNotice, setKycSuccessNotice] = useState('');

  const clabeInfo = validateClabe(userClabe);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const copyClabe = () => {
    navigator.clipboard?.writeText(userClabe);
    setCopiedClabe(true);
    setTimeout(() => setCopiedClabe(false), 2000);
  };

  const copyAccount = () => {
    navigator.clipboard?.writeText(userAccount);
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  const handleRegenerateClabe = () => {
    const newCode = regenerateClabe();
    setClabeNotice(`Nueva CLABE generada y validada según normativa Banxico: ${newCode}`);
    setTimeout(() => setClabeNotice(''), 4000);
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || newPassword.length < 6) return;
    setPasswordSuccess('Contraseña actualizada con éxito');
    setTimeout(() => {
      setPasswordSuccess('');
      setIsPasswordModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
    }, 1500);
  };

  const handleSimulateUpload = (docKey: string) => {
    setKycFiles(prev => ({ ...prev, [docKey]: true }));
    setKycSuccessNotice(`Documento recibido y validado con éxito por el motor de verificación.`);
    setTimeout(() => setKycSuccessNotice(''), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-100 flex items-center gap-2">
          <span>Configuración de Cuenta & Seguridad</span>
        </h1>
        <p className="text-neutral-400 text-sm mt-0.5">
          Administra tu identidad, cuentas bancarias CLABE registradas y parámetros de seguridad.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="md:col-span-1 space-y-2">
          <button 
            type="button"
            onClick={() => setActiveTab('profile')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-colors text-left",
              activeTab === 'profile'
                ? "bg-amber-500 text-neutral-950 font-bold shadow-md shadow-amber-500/10"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
            )}
          >
            <User size={18} />
            <span>Perfil</span>
          </button>

          <button 
            type="button"
            onClick={() => setActiveTab('clabe')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-colors text-left",
              activeTab === 'clabe'
                ? "bg-amber-500 text-neutral-950 font-bold shadow-md shadow-amber-500/10"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
            )}
          >
            <Building2 size={18} />
            <span>CLABE & SPEI</span>
          </button>

          <button 
            type="button"
            onClick={() => setActiveTab('security')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-colors text-left",
              activeTab === 'security'
                ? "bg-amber-500 text-neutral-950 font-bold shadow-md shadow-amber-500/10"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
            )}
          >
            <Shield size={18} />
            <span>Seguridad & 2FA</span>
          </button>

          <button 
            type="button"
            onClick={() => setActiveTab('kyc')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-colors text-left",
              activeTab === 'kyc'
                ? "bg-amber-500 text-neutral-950 font-bold shadow-md shadow-amber-500/10"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
            )}
          >
            <FileText size={18} />
            <span>KYC / Verificación</span>
          </button>

          <button 
            type="button"
            onClick={() => setActiveTab('morse')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-colors text-left",
              activeTab === 'morse'
                ? "bg-amber-500 text-neutral-950 font-bold shadow-md shadow-amber-500/10"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
            )}
          >
            <Send size={18} />
            <span>Beneficiario Morse</span>
            <span className="ml-auto text-[10px] bg-emerald-500/20 text-emerald-400 font-mono px-1.5 py-0.5 rounded">ACH</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="md:col-span-3 space-y-6">
          {/* TAB 1: Profile */}
          {activeTab === 'profile' && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
              <h2 className="text-xl font-bold text-neutral-100">Información del Titular</h2>
              
              <div className="flex items-center gap-6 pb-6 border-b border-neutral-800">
                <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 font-extrabold text-2xl">
                  {name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-neutral-200 text-base">{name}</h3>
                  <p className="text-xs text-neutral-400 font-mono mt-0.5">ID Cliente: {userAccount}</p>
                  <span className="inline-block mt-2 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold">
                    Cuenta Verificada Nivel 2
                  </span>
                </div>
              </div>

              {saveSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span>¡Datos del perfil actualizados correctamente!</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-2">Nombre Completo</label>
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-neutral-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-2">Correo Electrónico</label>
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-neutral-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-2">Número Telefónico</label>
                    <input 
                      type="tel" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-neutral-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-2">País de Residencia</label>
                    <input 
                      type="text" 
                      defaultValue="México (SPEI / MXN / USD)"
                      disabled
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-neutral-400 cursor-not-allowed"
                    />
                  </div>
                </div>
                
                <div className="pt-4 flex justify-end">
                  <button 
                    type="submit"
                    className="px-6 py-3 bg-amber-500 text-neutral-950 font-bold rounded-xl hover:bg-amber-400 transition-colors text-sm shadow-lg shadow-amber-500/10"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: CLABE & SPEI Accounts */}
          {activeTab === 'clabe' && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
              <div>
                <h2 className="text-xl font-bold text-neutral-100">Cuentas Bancarias CLABE & SPEI</h2>
                <p className="text-neutral-400 text-xs mt-1">
                  Tu identificador bancario estandarizado de 18 dígitos para recibir depósitos interbancarios en México.
                </p>
              </div>

              {clabeNotice && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                  {clabeNotice}
                </div>
              )}

              {/* CLABE Card Details */}
              <div className="p-6 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                      <Building2 size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-neutral-200">CLABE Interbancaria Activa</h3>
                      <p className="text-[11px] text-neutral-500">Banco de México (SPEI) &bull; Clave 846 / STP</p>
                    </div>
                  </div>
                  <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-bold">
                    Validada Banxico ✓
                  </span>
                </div>

                <div className="p-4 bg-neutral-900 rounded-xl border border-neutral-800 flex items-center justify-between">
                  <span className="font-mono text-xl md:text-2xl font-bold tracking-widest text-amber-400 select-all">
                    {userClabe}
                  </span>
                  <button 
                    onClick={copyClabe}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-semibold transition-colors"
                  >
                    {copiedClabe ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    <span>{copiedClabe ? 'Copiada' : 'Copiar'}</span>
                  </button>
                </div>

                {/* Mathematical Checksum Breakdown */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs pt-2">
                  <div className="p-2.5 bg-neutral-900/60 rounded-lg border border-neutral-800/80">
                    <span className="text-neutral-500 text-[10px] block">Código Banco</span>
                    <span className="font-mono font-bold text-neutral-200">{clabeInfo.bankCode} (STP/GP)</span>
                  </div>
                  <div className="p-2.5 bg-neutral-900/60 rounded-lg border border-neutral-800/80">
                    <span className="text-neutral-500 text-[10px] block">Plaza / Ciudad</span>
                    <span className="font-mono font-bold text-neutral-200">{clabeInfo.plaza} (CDMX)</span>
                  </div>
                  <div className="p-2.5 bg-neutral-900/60 rounded-lg border border-neutral-800/80">
                    <span className="text-neutral-500 text-[10px] block">Cuenta Base (11 dig)</span>
                    <span className="font-mono font-bold text-neutral-200">{clabeInfo.account}</span>
                  </div>
                  <div className="p-2.5 bg-neutral-900/60 rounded-lg border border-neutral-800/80">
                    <span className="text-neutral-500 text-[10px] block">Dígito Verificador</span>
                    <span className="font-mono font-bold text-emerald-400">{clabeInfo.controlDigit} (Ponderado OK)</span>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button 
                    onClick={handleRegenerateClabe}
                    className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-semibold transition-colors"
                  >
                    <RefreshCw size={14} />
                    <span>Generar Nueva CLABE Válida</span>
                  </button>
                </div>
              </div>

              {/* Mercado Pago SPEI Withdrawal Integration Card */}
              <div className="p-6 rounded-2xl bg-neutral-950 border border-sky-500/30 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400 font-bold text-lg">
                      MP
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-neutral-200">
                        Dispersión Directa a CLABE con Mercado Pago
                      </h3>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Conecta tus retiros con tu cuenta oficial de Mercado Pago para enviar MXN mediante SPEI a tu CLABE registrada.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2.5 py-1 rounded-full font-bold shrink-0">
                    SPEI Activo
                  </span>
                </div>

                <div className="p-4 bg-neutral-900 rounded-xl border border-neutral-800 text-xs text-neutral-300 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400">Cuenta CLABE de Destino:</span>
                    <span className="font-mono font-bold text-amber-400">{userClabe}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400">Canal de Liquidación:</span>
                    <span className="font-semibold text-emerald-400">SPEI Banco de México / API Mercado Pago</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400">Tiempo de Acreditación:</span>
                    <span className="text-neutral-200">Inmediato (24/7 los 365 días)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <p className="text-[11px] text-neutral-500">
                    Las órdenes de retiro descuentan tu balance USD y dispersan los fondos en pesos mexicanos (MXN).
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsMpWithdrawModalOpen(true)}
                    className="px-4 py-2 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-neutral-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-sky-500/20 flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <span>Solicitar Retiro a CLABE</span>
                    <span>&rarr;</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Security & 2FA */}
          {activeTab === 'security' && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
              <h2 className="text-xl font-bold text-neutral-100">Seguridad & Doble Factor (2FA)</h2>
              
              <div className="space-y-4">
                {/* 2FA Card */}
                <div className="flex items-start justify-between p-5 bg-neutral-950 rounded-2xl border border-neutral-800">
                  <div className="flex gap-4">
                    <div className="mt-1 text-emerald-400">
                      <CheckCircle2 size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-neutral-200">Autenticación de Dos Factores (2FA / OTP)</h3>
                      <p className="text-xs text-neutral-400 mt-1">
                        Protege todas las transferencias bancarias y compras con código dinámico de 6 dígitos.
                      </p>
                      <div className="mt-2 text-xs font-mono text-amber-400">
                        Código OTP de prueba activo: <strong>{activeOtp}</strong>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => generateNewOtp()}
                    className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-semibold transition-colors"
                  >
                    Generar Nuevo OTP
                  </button>
                </div>

                {/* Password Card */}
                <div className="flex items-center justify-between p-5 bg-neutral-950 rounded-2xl border border-neutral-800">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center text-neutral-300">
                      <Key size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-neutral-200">Contraseña de Inicio de Sesión</h3>
                      <p className="text-xs text-neutral-400">Última actualización: hace 3 meses</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsPasswordModalOpen(true)}
                    className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-semibold transition-colors"
                  >
                    Actualizar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: KYC & Verification */}
          {activeTab === 'kyc' && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
              <div>
                <h2 className="text-xl font-bold text-neutral-100">Verificación KYC & Expediente Fiscal</h2>
                <p className="text-neutral-400 text-xs mt-1">
                  Requisitos normativos para operaciones interbancarias de alto volumen sin límite de retiro.
                </p>
              </div>

              {kycSuccessNotice && (
                <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
                  {kycSuccessNotice}
                </div>
              )}

              <div className="space-y-3">
                {/* INE / Passport */}
                <div className="flex items-center justify-between p-4 bg-neutral-950 rounded-2xl border border-neutral-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                      <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-neutral-200">Identificación Oficial (INE / Pasaporte)</p>
                      <p className="text-xs text-neutral-500">Documento verificado biométricamente</p>
                    </div>
                  </div>
                  <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-bold">
                    Aprobado
                  </span>
                </div>

                {/* Proof of Address */}
                <div className="flex items-center justify-between p-4 bg-neutral-950 rounded-2xl border border-neutral-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                      <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-neutral-200">Comprobante de Domicilio</p>
                      <p className="text-xs text-neutral-500">Recibo CFE / Agua menor a 3 meses</p>
                    </div>
                  </div>
                  <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-bold">
                    Aprobado
                  </span>
                </div>

                {/* RFC / Tax ID */}
                <div className="flex items-center justify-between p-4 bg-neutral-950 rounded-2xl border border-neutral-800">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      kycFiles.rfc ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                    )}>
                      {kycFiles.rfc ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-neutral-200">Constancia de Situación Fiscal (RFC con Homoclave)</p>
                      <p className="text-xs text-neutral-500">Requerido para límites mayores a $50,000 USD</p>
                    </div>
                  </div>
                  {kycFiles.rfc ? (
                    <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-bold">
                      Aprobado
                    </span>
                  ) : (
                    <button 
                      type="button"
                      onClick={() => handleSimulateUpload('rfc')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-neutral-950 rounded-xl text-xs font-bold hover:bg-amber-400 transition-colors"
                    >
                      <Upload size={14} />
                      <span>Cargar Documento</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: Morse Beneficiary Settings */}
          {activeTab === 'morse' && (
            <div className="space-y-6">
              <div className="border-b border-neutral-800 pb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                    Cuenta Externa ACH
                  </span>
                  <span className="text-xs text-neutral-400">Vinculación Externa</span>
                </div>
                <h3 className="text-lg font-bold text-neutral-100 mt-1">
                  Agrega Morse como beneficiario en tu otro banco
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Parámetros oficiales configurados para enviar transferencias ACH hacia tu saldo en Morse.
                </p>
              </div>

              {morseSaveSuccess && (
                <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span>Beneficiario Morse actualizado correctamente con certificación ACH.</span>
                </div>
              )}

              {morseError && (
                <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>{morseError}</span>
                </div>
              )}

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  setMorseError('');
                  const rCheck = validateAbaRouting(morseRouting);
                  const aCheck = validateAchAccount(morseAccount);
                  if (!rCheck.isValid) {
                    setMorseError(rCheck.error || 'Número de ruta (ABA) inválido.');
                    return;
                  }
                  if (!aCheck.isValid) {
                    setMorseError(aCheck.error || 'Número de cuenta inválido.');
                    return;
                  }
                  updateMorseBeneficiary({
                    routingNumber: morseRouting.trim(),
                    accountNumber: morseAccount.trim(),
                    holderName: morseHolder.trim(),
                    bankName: rCheck.bankName || 'Lead Bank, N.A. (Socio Morse)'
                  });
                  setMorseSaveSuccess(true);
                  setTimeout(() => setMorseSaveSuccess(false), 3000);
                }} 
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    1. Número de ruta (routing) — desde la app de Morse:
                  </label>
                  <input
                    type="text"
                    value={morseRouting}
                    onChange={(e) => {
                      setMorseRouting(e.target.value.replace(/\D/g, '').slice(0, 9));
                      setMorseError('');
                    }}
                    maxLength={9}
                    required
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm font-mono font-bold text-neutral-100 focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-[11px] text-neutral-500 block mt-1">
                    Algoritmo de la Reserva Federal (Ponderación 3, 7, 1). Banco: Lead Bank, N.A.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    2. Número de cuenta — desde la app de Morse:
                  </label>
                  <input
                    type="text"
                    value={morseAccount}
                    onChange={(e) => {
                      setMorseAccount(e.target.value.replace(/\D/g, '').slice(0, 17));
                      setMorseError('');
                    }}
                    required
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm font-mono font-bold text-neutral-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    3. Tipo de cuenta:
                  </label>
                  <div className="p-3 bg-neutral-950 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs font-bold text-emerald-400">
                    <span>Checking (cuenta corriente)</span>
                    <span className="px-2 py-0.5 bg-emerald-500/10 rounded">Requerido por Morse</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    4. Nombre del titular — tu nombre tal como aparece en tu cuenta de Morse:
                  </label>
                  <input
                    type="text"
                    value={morseHolder}
                    onChange={(e) => setMorseHolder(e.target.value)}
                    required
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm font-bold text-neutral-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs sm:text-sm rounded-xl transition-colors cursor-pointer"
                  >
                    Guardar Beneficiario Morse
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMorseRouting(MORSE_DEFAULT_BENEFICIARY.routingNumber);
                      setMorseAccount(MORSE_DEFAULT_BENEFICIARY.accountNumber);
                      setMorseHolder(MORSE_DEFAULT_BENEFICIARY.holderName);
                      updateMorseBeneficiary(MORSE_DEFAULT_BENEFICIARY);
                      setMorseSaveSuccess(true);
                      setTimeout(() => setMorseSaveSuccess(false), 3000);
                    }}
                    className="px-4 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    Restablecer
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Update Password */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 md:p-8 max-w-sm w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-neutral-100">Actualizar Contraseña</h3>
              <button 
                onClick={() => setIsPasswordModalOpen(false)}
                className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-neutral-100"
              >
                <X size={18} />
              </button>
            </div>

            {passwordSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-center text-sm font-semibold">
                {passwordSuccess}
              </div>
            ) : (
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-2">Contraseña Actual</label>
                  <input 
                    type="password" 
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-neutral-100 focus:outline-none focus:border-amber-500"
                    placeholder="••••••••"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-2">Nueva Contraseña</label>
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-neutral-100 focus:outline-none focus:border-amber-500"
                    placeholder="Mínimo 8 caracteres"
                    minLength={6}
                    required
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full py-3 bg-amber-500 text-neutral-950 font-bold rounded-xl hover:bg-amber-400 transition-colors text-sm"
                >
                  Guardar Contraseña
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Mercado Pago SPEI Withdrawal Modal */}
      <MercadoPagoWithdrawModal
        isOpen={isMpWithdrawModalOpen}
        onClose={() => setIsMpWithdrawModalOpen(false)}
      />
    </div>
  );
}
