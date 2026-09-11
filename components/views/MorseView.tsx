'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  Copy, 
  Check, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight, 
  Send, 
  RefreshCw, 
  AlertCircle, 
  FileText, 
  ExternalLink,
  Lock,
  Globe,
  Coins,
  BadgeCheck,
  UserCheck,
  Zap,
  Info
} from 'lucide-react';
import { useBanking, TransactionItem } from '@/lib/bankingStore';
import { 
  validateAbaRouting, 
  validateAchAccount, 
  MORSE_DEFAULT_BENEFICIARY 
} from '@/lib/bankingValidation';
import TransactionReceiptModal from '@/components/TransactionReceiptModal';
import { cn } from '@/lib/utils';

interface MorseViewProps {
  onBack?: () => void;
  onNavigate?: (view: any) => void;
}

export default function MorseView({ onBack, onNavigate }: MorseViewProps) {
  const { 
    balance, 
    morseBeneficiary, 
    updateMorseBeneficiary, 
    sendMorseAchTransfer,
    eurToUsdRate,
    activeOtp,
    generateNewOtp,
    verifyOtp,
    transactions
  } = useBanking();

  // Active section tab: 'beneficiary' (Agrega Morse como beneficiario) | 'transfer' (Envía la transferencia)
  const [activeTab, setActiveTab] = useState<'beneficiary' | 'transfer'>('transfer');

  // Form states for adding/editing Morse beneficiary
  const [routingInput, setRoutingInput] = useState(morseBeneficiary.routingNumber);
  const [accountInput, setAccountInput] = useState(morseBeneficiary.accountNumber);
  const [holderInput, setHolderInput] = useState(morseBeneficiary.holderName);
  const [bankInput, setBankInput] = useState(morseBeneficiary.bankName);
  const [isEditingBeneficiary, setIsEditingBeneficiary] = useState(false);
  const [beneficiarySaveSuccess, setBeneficiarySaveSuccess] = useState(false);
  const [beneficiaryError, setBeneficiaryError] = useState('');

  // Transfer states
  const [amountUsd, setAmountUsd] = useState('');
  const [destinationRegion, setDestinationRegion] = useState<'europe' | 'international'>('europe');
  const [memo, setMemo] = useState('Transferencia de fondos ACH a cuenta Morse');
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transferError, setTransferError] = useState('');
  
  // Success & Receipt states
  const [successModalData, setSuccessModalData] = useState<{
    trackingKey: string;
    amountUsd: number;
    creditedAmount: number;
    creditedCurrency: string;
    region: 'europe' | 'international';
  } | null>(null);
  const [selectedReceiptTx, setSelectedReceiptTx] = useState<TransactionItem | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Filter Morse transactions
  const morseTransactions = transactions.filter(t => 
    t.category === 'morse' || 
    (t.recipientOrSender && t.recipientOrSender.toLowerCase().includes('morse')) ||
    (t.clabe && t.clabe.toLowerCase().includes('routing'))
  );

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // ABA validation check
  const routingCheck = validateAbaRouting(routingInput);
  const accountCheck = validateAchAccount(accountInput);

  const handleSaveBeneficiary = (e: React.FormEvent) => {
    e.preventDefault();
    setBeneficiaryError('');

    if (!routingCheck.isValid) {
      setBeneficiaryError(routingCheck.error || 'Número de ruta (ABA) inválido.');
      return;
    }
    if (!accountCheck.isValid) {
      setBeneficiaryError(accountCheck.error || 'Número de cuenta inválido.');
      return;
    }
    if (!holderInput.trim()) {
      setBeneficiaryError('Ingresa el nombre del titular tal como aparece en tu cuenta de Morse.');
      return;
    }

    updateMorseBeneficiary({
      routingNumber: routingInput.trim(),
      accountNumber: accountInput.trim(),
      holderName: holderInput.trim(),
      bankName: routingCheck.bankName || bankInput || 'Lead Bank, N.A. (Socio Morse)',
      accountType: 'Checking',
    });

    setIsEditingBeneficiary(false);
    setBeneficiarySaveSuccess(true);
    setTimeout(() => setBeneficiarySaveSuccess(false), 3000);
  };

  const handleResetBeneficiary = () => {
    setRoutingInput(MORSE_DEFAULT_BENEFICIARY.routingNumber);
    setAccountInput(MORSE_DEFAULT_BENEFICIARY.accountNumber);
    setHolderInput(MORSE_DEFAULT_BENEFICIARY.holderName);
    setBankInput(MORSE_DEFAULT_BENEFICIARY.bankName);
    updateMorseBeneficiary(MORSE_DEFAULT_BENEFICIARY);
    setBeneficiarySaveSuccess(true);
    setTimeout(() => setBeneficiarySaveSuccess(false), 3000);
  };

  const parsedAmount = parseFloat(amountUsd) || 0;
  const isEurope = destinationRegion === 'europe';
  const creditedEstimate = isEurope 
    ? (parsedAmount / eurToUsdRate)
    : parsedAmount;
  const creditedCurrencySymbol = isEurope ? '€' : '$';
  const creditedCurrencyCode = isEurope ? 'EUR (Euros Digitales)' : 'USD (Dólares Digitales)';

  const handleSendTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError('');
    setOtpError('');

    if (parsedAmount <= 0) {
      setTransferError('Ingresa un monto válido mayor a $0.00 USD.');
      return;
    }

    if (parsedAmount > balance) {
      setTransferError(`Saldo insuficiente en Gold Payments ($${balance.toFixed(2)} USD disponible, requieres $${parsedAmount.toFixed(2)} USD).`);
      return;
    }

    if (!verifyOtp(otpInput)) {
      setOtpError('Código de seguridad 2FA / OTP incorrecto. Genera uno nuevo o ingresa el código activo.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const result = sendMorseAchTransfer({
        amountUsd: parsedAmount,
        memo: memo.trim(),
        destinationRegion,
      });

      setIsSubmitting(false);

      if (result.success) {
        setSuccessModalData({
          trackingKey: result.trackingKey,
          amountUsd: parsedAmount,
          creditedAmount: result.creditedAmount,
          creditedCurrency: result.creditedCurrency,
          region: destinationRegion,
        });
        setAmountUsd('');
        setOtpInput('');
      } else {
        setTransferError(result.error || 'Ocurrió un error al procesar la transferencia ACH.');
      }
    }, 900);
  };

  const openLatestReceipt = () => {
    if (morseTransactions.length > 0) {
      setSelectedReceiptTx(morseTransactions[0]);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Banner & Morse Branding */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-900/90 to-neutral-950 border border-neutral-800 p-6 sm:p-8 shadow-2xl">
        <div className="absolute -right-16 -bottom-16 w-80 h-80 rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30">
                <Zap size={13} className="animate-pulse" /> Integración Externa ACH
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                <BadgeCheck size={13} /> Morse Financial Technologies
              </span>
              <span className="text-xs text-neutral-400 bg-neutral-800/80 px-2.5 py-1 rounded-full border border-neutral-700 font-mono">
                Red: NACHA / ACH Direct
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-neutral-100 tracking-tight">
              Cuenta Morse &bull; Depósitos ACH Directos
            </h1>

            <p className="text-sm text-neutral-300 leading-relaxed">
              Agrega tu cuenta de <strong className="text-white">Morse</strong> como beneficiario externo en Gold Payments Bank y envía transferencias ACH en dólares. 
              <span className="text-emerald-400 font-semibold block sm:inline mt-1 sm:mt-0"> Si vives en Europa, se convierten en euros digitales; para el resto de usuarios, se acreditan en dólares digitales.</span>
            </p>
          </div>

          <div className="bg-neutral-950/80 border border-neutral-800 rounded-2xl p-4 sm:p-5 shrink-0 min-w-[240px] text-right space-y-1">
            <span className="text-xs text-neutral-400 block font-medium">Saldo Disponible en Gold Payments</span>
            <span className="text-2xl sm:text-3xl font-black font-mono text-neutral-100 block">
              ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-xs text-neutral-400 font-normal ml-1">USD</span>
            </span>
            <span className="text-[11px] text-emerald-400 block font-medium">
              Transferencias ACH sin comisión ($0.00 fee)
            </span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 mt-6 pt-6 border-t border-neutral-800/80">
          <button
            onClick={() => setActiveTab('transfer')}
            className={cn(
              "px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer",
              activeTab === 'transfer'
                ? "bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/20"
                : "bg-neutral-800/60 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700/50"
            )}
          >
            <Send size={16} />
            <span>1. Enviar Transferencia ACH a Morse</span>
          </button>

          <button
            onClick={() => setActiveTab('beneficiary')}
            className={cn(
              "px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer",
              activeTab === 'beneficiary'
                ? "bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/20"
                : "bg-neutral-800/60 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700/50"
            )}
          >
            <UserCheck size={16} />
            <span>2. Datos del Beneficiario Morse</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </button>
        </div>
      </div>

      {/* SECTION 1: TRANSFER FORM (Envía la transferencia) */}
      {activeTab === 'transfer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Transfer Form Box */}
          <div className="lg:col-span-8 bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-neutral-100 flex items-center gap-2">
                  <Send className="text-amber-400" size={20} />
                  Envía la transferencia ACH a tu cuenta Morse
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Los fondos se debitan de tu saldo USD y se transmiten vía red ACH de la Reserva Federal.
                </p>
              </div>
              <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                Same-Day ACH
              </span>
            </div>

            {/* Instruction Rule Box highlighting user's exact requirements */}
            <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800 text-xs space-y-3">
              <div className="flex items-center gap-2 text-neutral-200 font-semibold">
                <Info size={16} className="text-amber-400 shrink-0" />
                <span>Reglas de Conversión y Custodia en la App de Morse:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12px]">
                <div className={cn(
                  "p-3 rounded-xl border transition-all cursor-pointer",
                  destinationRegion === 'europe' 
                    ? "bg-indigo-950/40 border-indigo-500/60 text-indigo-200 shadow-md" 
                    : "bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                )}
                onClick={() => setDestinationRegion('europe')}
                >
                  <div className="flex items-center justify-between font-bold text-neutral-100 mb-1">
                    <span className="flex items-center gap-1.5 text-xs">
                      <span className="text-base">🇪🇺</span> Si vives en Europa:
                    </span>
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-mono">
                      EUR Digital
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Los dólares que envíes <strong className="text-indigo-300">se convierten automáticamente en euros digitales (EURC / € EUR)</strong> en tu saldo Morse.
                  </p>
                </div>

                <div className={cn(
                  "p-3 rounded-xl border transition-all cursor-pointer",
                  destinationRegion === 'international' 
                    ? "bg-amber-950/40 border-amber-500/60 text-amber-200 shadow-md" 
                    : "bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                )}
                onClick={() => setDestinationRegion('international')}
                >
                  <div className="flex items-center justify-between font-bold text-neutral-100 mb-1">
                    <span className="flex items-center gap-1.5 text-xs">
                      <span className="text-base">🌎</span> Resto de usuarios Morse:
                    </span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-mono">
                      USD Digital
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Tu saldo <strong className="text-amber-300">se guarda en dólares digitales (USDC / $ USD)</strong> con paridad 1:1 sin conversión.
                  </p>
                </div>
              </div>
            </div>

            {/* Error banner */}
            {transferError && (
              <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{transferError}</span>
              </div>
            )}

            <form onSubmit={handleSendTransfer} className="space-y-5">
              {/* Region / Currency Selection Tabs */}
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-2">
                  Destino de Residencia del Titular en Morse:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDestinationRegion('europe')}
                    className={cn(
                      "p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer",
                      destinationRegion === 'europe'
                        ? "bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/20"
                        : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                    )}
                  >
                    <span>🇪🇺 Residente en Europa (Euros Digitales)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDestinationRegion('international')}
                    className={cn(
                      "p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer",
                      destinationRegion === 'international'
                        ? "bg-amber-500 text-neutral-950 border-amber-400 shadow-lg shadow-amber-500/20"
                        : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                    )}
                  >
                    <span>🌎 Resto de Usuarios (Dólares Digitales)</span>
                  </button>
                </div>
              </div>

              {/* Recipient summary pill */}
              <div className="bg-neutral-950/80 border border-neutral-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <span className="text-[11px] text-neutral-400">Beneficiario Registrado:</span>
                  <p className="font-bold text-neutral-100 text-sm">{morseBeneficiary.holderName}</p>
                  <p className="text-[11px] text-neutral-400 font-mono">
                    Routing: <span className="text-amber-400 font-bold">{morseBeneficiary.routingNumber}</span> &bull; Cuenta: <span className="text-neutral-200 font-bold">••••{morseBeneficiary.accountNumber.slice(-4)}</span> ({morseBeneficiary.accountType})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('beneficiary')}
                  className="text-xs text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-4 self-start sm:self-center"
                >
                  Modificar datos &rarr;
                </button>
              </div>

              {/* Amount USD input */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-neutral-300">
                    Monto a Transferir en Dólares (USD):
                  </label>
                  <span className="text-xs text-neutral-400">
                    Disponible: <strong className="text-neutral-200">${balance.toFixed(2)} USD</strong>
                  </span>
                </div>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-mono text-xl font-bold">
                    $
                  </span>
                  <input
                    type="number"
                    value={amountUsd}
                    onChange={(e) => setAmountUsd(e.target.value)}
                    placeholder="500.00"
                    min="1"
                    max={balance}
                    step="0.01"
                    required
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl pl-9 pr-20 py-3.5 text-neutral-100 text-xl font-mono font-bold focus:outline-none focus:border-amber-500 transition-colors"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-neutral-400 bg-neutral-900 px-2 py-1 rounded-md border border-neutral-800">
                    USD
                  </span>
                </div>

                {/* Quick amount shortcuts */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {[100, 250, 500, 1000, 2500].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAmountUsd(val.toString())}
                      className="px-3 py-1 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-xs font-mono text-neutral-300 transition-colors cursor-pointer"
                    >
                      +${val}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setAmountUsd(Math.floor(balance).toString())}
                    className="px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg text-xs font-semibold text-amber-400 transition-colors cursor-pointer"
                  >
                    Todo el Saldo
                  </button>
                </div>
              </div>

              {/* Dynamic Credited Preview in Morse */}
              <div className={cn(
                "p-4 rounded-2xl border transition-all",
                isEurope 
                  ? "bg-indigo-950/30 border-indigo-500/40 text-indigo-100" 
                  : "bg-amber-950/30 border-amber-500/40 text-amber-100"
              )}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-neutral-400 uppercase tracking-wider font-semibold">
                    Estimación que recibirás en tu App de Morse:
                  </span>
                  <span className="font-mono text-[11px] text-neutral-400">
                    {isEurope ? `Tasa EUR/USD: ${eurToUsdRate.toFixed(4)}` : 'Paridad 1:1 USDC'}
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black font-mono">
                    {creditedCurrencySymbol}{creditedEstimate > 0 ? creditedEstimate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                  </span>
                  <span className="text-xs font-bold uppercase text-neutral-300">
                    {creditedCurrencyCode}
                  </span>
                </div>

                <p className="text-[11px] text-neutral-400 mt-1">
                  {isEurope
                    ? '✨ Por vivir en Europa, tu banco intermediario convierte automáticamente a Euros Digitales (EURC) al tipo de cambio interbancario.'
                    : '✨ Como usuario internacional, tu saldo se conserva íntegro en Dólares Digitales (USDC) respaldados 1:1.'}
                </p>
              </div>

              {/* Memo / Concept */}
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                  Concepto / Memo de la Transferencia ACH:
                </label>
                <input
                  type="text"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="Transferencia a mi cuenta Morse"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-neutral-200 focus:outline-none focus:border-amber-500 font-medium"
                />
              </div>

              {/* 2FA / OTP Verification */}
              <div className="bg-neutral-950/80 border border-neutral-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                    <Lock size={14} className="text-amber-400" />
                    Autorización de Seguridad 2FA / OTP:
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const code = generateNewOtp();
                      setOtpInput(code);
                    }}
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-2 flex items-center gap-1"
                  >
                    <RefreshCw size={12} />
                    <span>Autocompletar Código ({activeOtp})</span>
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={otpInput}
                    onChange={(e) => {
                      setOtpInput(e.target.value);
                      setOtpError('');
                    }}
                    placeholder="Ingresa los 6 dígitos"
                    maxLength={6}
                    className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-center font-mono font-bold text-lg text-neutral-100 tracking-widest focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setOtpInput(activeOtp)}
                    className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-neutral-200 rounded-xl transition-colors shrink-0 cursor-pointer"
                  >
                    Usar {activeOtp}
                  </button>
                </div>

                {otpError && (
                  <p className="text-[11px] text-rose-400 font-semibold">{otpError}</p>
                )}
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting || parsedAmount <= 0}
                className={cn(
                  "w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg",
                  parsedAmount > 0 && !isSubmitting
                    ? "bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-amber-500/20"
                    : "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                )}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Transmitiendo a la Red ACH...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Enviar ${parsedAmount.toFixed(2)} USD a Cuenta Morse</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: Beneficiary Verification & Network Specs */}
          <div className="lg:col-span-4 space-y-6">
            {/* Beneficiary Card Summary */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-5 shadow-xl">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                    M
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-neutral-100">Beneficiario Vinculado</h3>
                    <p className="text-[11px] text-neutral-400">Datos desde tu App de Morse</p>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                  Activo ✓
                </span>
              </div>

              <div className="space-y-3 text-xs">
                {/* Holder Name */}
                <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800/80">
                  <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-0.5">
                    <span>Nombre del titular:</span>
                    <span className="text-emerald-400 font-medium">Coincide con Morse</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-100 text-sm">{morseBeneficiary.holderName}</span>
                    <button 
                      onClick={() => copyToClipboard(morseBeneficiary.holderName, 'holder')}
                      className="text-neutral-400 hover:text-neutral-200"
                    >
                      {copiedField === 'holder' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                {/* Routing Number */}
                <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800/80">
                  <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-0.5">
                    <span>Número de ruta (routing):</span>
                    <span className="text-amber-400 font-mono text-[10px]">ABA 9 Dígitos</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-neutral-100 text-sm tracking-wider">{morseBeneficiary.routingNumber}</span>
                    <button 
                      onClick={() => copyToClipboard(morseBeneficiary.routingNumber, 'routing')}
                      className="text-neutral-400 hover:text-neutral-200"
                    >
                      {copiedField === 'routing' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                  </div>
                  <span className="text-[10px] text-neutral-500 block mt-1">
                    Entidad: <strong className="text-neutral-300">{morseBeneficiary.bankName}</strong>
                  </span>
                </div>

                {/* Account Number */}
                <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800/80">
                  <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-0.5">
                    <span>Número de cuenta:</span>
                    <span className="text-neutral-400 text-[10px]">Cuenta Directa</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-neutral-100 text-sm tracking-wider">{morseBeneficiary.accountNumber}</span>
                    <button 
                      onClick={() => copyToClipboard(morseBeneficiary.accountNumber, 'account')}
                      className="text-neutral-400 hover:text-neutral-200"
                    >
                      {copiedField === 'account' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                {/* Account Type */}
                <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800/80 flex items-center justify-between">
                  <span className="text-neutral-400 text-[11px]">Tipo de cuenta:</span>
                  <span className="font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-xs">
                    {morseBeneficiary.accountType} (Cuenta corriente)
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('beneficiary')}
                  className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <UserCheck size={14} />
                  <span>Configurar / Editar Datos de Morse</span>
                </button>
              </div>
            </div>

            {/* Network & Guarantee Info */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-3 text-xs">
              <h4 className="font-bold text-neutral-200 flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-400" />
                Garantías de Liquidación Bancaria
              </h4>
              <ul className="space-y-2 text-neutral-400 text-[11px] leading-relaxed">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Sin comisiones de envío:</strong> Gold Payments Bank no cobra comisiones por transferencias ACH salientes hacia Morse.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Validación NACHA:</strong> El número de ruta 101015074 está respaldado por Lead Bank, N.A., miembro de la FDIC.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Comprobante Oficial:</strong> Cada transacción genera un número de rastreo NACHA para consulta y conciliación inmediata.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: BENEFICIARY REGISTRATION & CONFIG (Agrega Morse como beneficiario) */}
      {activeTab === 'beneficiary' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-md">
                  Paso 1 del Proceso
                </span>
                <span className="text-xs text-neutral-400">Banco Receptor Externo</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-neutral-100 mt-1">
                Agrega Morse como beneficiario en tu otro banco
              </h2>
              <p className="text-xs text-neutral-400 mt-1">
                En la app o el sitio web de tu otro banco (Gold Payments Bank), agrega un nuevo beneficiario o cuenta externa usando los 4 campos solicitados:
              </p>
            </div>

            {beneficiarySaveSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-semibold flex items-center gap-2.5">
                <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                <span>¡Beneficiario Morse guardado exitosamente! Ya puedes realizar transferencias ACH hacia esta cuenta.</span>
              </div>
            )}

            {beneficiaryError && (
              <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs font-semibold flex items-center gap-2.5">
                <AlertCircle size={18} className="text-rose-400 shrink-0" />
                <span>{beneficiaryError}</span>
              </div>
            )}

            <form onSubmit={handleSaveBeneficiary} className="space-y-5">
              {/* Field 1: Número de ruta (routing) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[11px] font-bold">
                      1
                    </span>
                    Número de ruta (routing) — desde la app de Morse:
                  </label>
                  {routingCheck.isValid && (
                    <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                      <BadgeCheck size={13} /> {routingCheck.bankName}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={routingInput}
                  onChange={(e) => {
                    setRoutingInput(e.target.value.replace(/\D/g, '').slice(0, 9));
                    setBeneficiaryError('');
                  }}
                  placeholder="101015074"
                  maxLength={9}
                  required
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm font-mono font-bold text-neutral-100 focus:outline-none focus:border-amber-500"
                />
                <p className="text-[11px] text-neutral-500 mt-1">
                  Número de 9 dígitos ABA de la Reserva Federal. Predeterminado: Lead Bank, N.A. (101015074) o el que te asigne Morse.
                </p>
              </div>

              {/* Field 2: Número de cuenta */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[11px] font-bold">
                      2
                    </span>
                    Número de cuenta — desde la app de Morse:
                  </label>
                  {accountCheck.isValid && (
                    <span className="text-[11px] text-emerald-400 font-semibold">
                      Formato Válido ({accountInput.length} dígitos)
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={accountInput}
                  onChange={(e) => {
                    setAccountInput(e.target.value.replace(/\D/g, '').slice(0, 17));
                    setBeneficiaryError('');
                  }}
                  placeholder="883920194821"
                  required
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm font-mono font-bold text-neutral-100 focus:outline-none focus:border-amber-500"
                />
                <p className="text-[11px] text-neutral-500 mt-1">
                  Tu número de cuenta personal provisto en la sección de depósitos de tu app de Morse.
                </p>
              </div>

              {/* Field 3: Tipo de cuenta */}
              <div>
                <label className="text-xs font-bold text-neutral-200 flex items-center gap-1.5 mb-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[11px] font-bold">
                    3
                  </span>
                  Tipo de cuenta:
                </label>
                <div className="p-3.5 bg-neutral-950 border border-emerald-500/30 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-400" />
                    <div>
                      <span className="font-bold text-neutral-100 text-sm">Checking (cuenta corriente)</span>
                      <span className="text-[11px] text-neutral-400 block">
                        Requerido por Morse para procesar transferencias ACH de entrada
                      </span>
                    </div>
                  </div>
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-1 rounded-md">
                    CHECKING
                  </span>
                </div>
              </div>

              {/* Field 4: Nombre del titular */}
              <div>
                <label className="text-xs font-bold text-neutral-200 flex items-center gap-1.5 mb-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[11px] font-bold">
                    4
                  </span>
                  Nombre del titular — tu nombre tal como aparece en tu cuenta de Morse:
                </label>
                <input
                  type="text"
                  value={holderInput}
                  onChange={(e) => {
                    setHolderInput(e.target.value);
                    setBeneficiaryError('');
                  }}
                  placeholder="Oscar Isael Bueno Tochihuitl"
                  required
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm font-bold text-neutral-100 focus:outline-none focus:border-amber-500"
                />
                <p className="text-[11px] text-neutral-500 mt-1">
                  Debe coincidir exactamente con el nombre legal registrado en tu aplicación de Morse para evitar devoluciones.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-neutral-800">
                <button
                  type="submit"
                  className="w-full sm:flex-1 py-3.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-amber-500/10 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 size={16} />
                  <span>Guardar Beneficiario Morse en Gold Payments</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetBeneficiary}
                  className="w-full sm:w-auto px-4 py-3.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Restablecer Predeterminados
                </button>
              </div>
            </form>
          </div>

          {/* Right Info Box for Step 1 */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                <ShieldCheck size={18} className="text-amber-400" />
                Validación de Cuenta Externa
              </h3>

              <p className="text-xs text-neutral-300 leading-relaxed">
                Al registrar este beneficiario externo en Gold Payments Bank, queda pre-autorizado para enviar fondos ACH con confirmación inmediata y recibo de operación.
              </p>

              <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800/80 space-y-2 text-xs">
                <div className="flex justify-between items-center text-neutral-400 text-[11px]">
                  <span>Estado del Beneficiario:</span>
                  <span className="text-emerald-400 font-bold">VERIFICADO</span>
                </div>
                <div className="flex justify-between items-center text-neutral-400 text-[11px]">
                  <span>Canal Autorizado:</span>
                  <span className="text-neutral-200 font-mono">ACH Direct / Fedwire</span>
                </div>
                <div className="flex justify-between items-center text-neutral-400 text-[11px]">
                  <span>Banco Patrocinador:</span>
                  <span className="text-neutral-200 font-medium">Lead Bank, N.A.</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setActiveTab('transfer')}
                  className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-amber-400 font-bold text-xs rounded-xl transition-all border border-neutral-700 flex items-center justify-center gap-2"
                >
                  <span>Ir a Enviar Transferencia ACH</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: RECENT MORSE TRANSFERS TABLE */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
              <Coins size={18} className="text-amber-400" />
              Historial de Transferencias ACH hacia Morse
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Registro de envíos ACH en dólares con folios de rastreo y comprobantes oficiales.
            </p>
          </div>
          <span className="text-xs text-neutral-400 font-mono">
            {morseTransactions.length} Operación(es)
          </span>
        </div>

        {morseTransactions.length === 0 ? (
          <div className="p-8 text-center bg-neutral-950/60 rounded-2xl border border-neutral-800/80 text-xs text-neutral-400">
            Aún no has enviado transferencias ACH a tu cuenta Morse. Completa el formulario de arriba para realizar tu primer envío.
          </div>
        ) : (
          <div className="divide-y divide-neutral-800/80">
            {morseTransactions.map((tx) => (
              <div 
                key={tx.id}
                onClick={() => setSelectedReceiptTx(tx)}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-950/50 p-2.5 -mx-2.5 rounded-2xl transition-colors cursor-pointer"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
                    <Send size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-neutral-100 text-sm">
                      {tx.title}
                    </h4>
                    <p className="text-xs text-neutral-400 font-mono">
                      Folio NACHA: <span className="text-amber-300 font-semibold">{tx.trackingKey}</span> &bull; {tx.date}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 text-right">
                  <div>
                    <span className="font-mono font-bold text-sm text-neutral-100 block">
                      -${tx.amount.toFixed(2)} USD
                    </span>
                    <span className="text-[11px] text-emerald-400 font-medium">
                      Liquidado ACH ✓
                    </span>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedReceiptTx(tx);
                    }}
                    className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-neutral-300 hover:text-white rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <FileText size={13} />
                    <span>Ver Comprobante</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL: SUCCESS CONFIRMATION OF ACH TRANSFER */}
      <AnimatePresence>
        {successModalData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl relative overflow-hidden"
            >
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
                <CheckCircle2 size={36} />
              </div>

              <div className="text-center space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Operación Transmitida con Éxito
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-neutral-100">
                  Transferencia ACH Enviada a Morse
                </h3>
                <p className="text-xs text-neutral-400">
                  Los fondos han sido transmitidos a la red ACH bajo las especificaciones de NACHA.
                </p>
              </div>

              <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 space-y-2.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400">Monto Debitado:</span>
                  <span className="font-mono font-bold text-neutral-100">
                    ${successModalData.amountUsd.toFixed(2)} USD
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400">Acreditación Estimada en Morse:</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    {successModalData.region === 'europe' ? '€' : '$'}
                    {successModalData.creditedAmount.toFixed(2)} {successModalData.creditedCurrency}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-neutral-800/80">
                  <span className="text-neutral-400">Clave de Rastreo ACH (NACHA):</span>
                  <span className="font-mono font-bold text-amber-400 select-all">
                    {successModalData.trackingKey}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400">Titular Destino:</span>
                  <span className="font-semibold text-neutral-200">
                    {morseBeneficiary.holderName}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400">Banco / Routing:</span>
                  <span className="font-mono text-neutral-300">
                    Lead Bank ({morseBeneficiary.routingNumber})
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    const tx = morseTransactions[0] || null;
                    setSuccessModalData(null);
                    if (tx) setSelectedReceiptTx(tx);
                  }}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-amber-500/10 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FileText size={16} />
                  <span>Ver Comprobante Oficial</span>
                </button>

                <button
                  onClick={() => setSuccessModalData(null)}
                  className="px-5 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold text-xs sm:text-sm rounded-xl transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* OFFICIAL TRANSACTION RECEIPT MODAL */}
      {selectedReceiptTx && (
        <TransactionReceiptModal
          transaction={selectedReceiptTx}
          onClose={() => setSelectedReceiptTx(null)}
        />
      )}
    </div>
  );
}
