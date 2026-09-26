'use client';

import { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  Building2, 
  CreditCard, 
  Heart, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  RotateCw, 
  Download, 
  ExternalLink,
  Globe,
  Printer,
  CalendarClock,
  Sparkles,
  ArrowDownLeft,
  Play,
  Pause,
  FileText,
  BadgeCheck,
  Repeat,
  Clock,
  Send,
  X,
  Lock,
  Key,
  Globe2,
  Fingerprint,
  Scan
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useBanking, TransactionItem } from '@/lib/bankingStore';
import TransactionReceiptModal from '@/components/TransactionReceiptModal';
import Plus500PaymentModal from '@/components/Plus500PaymentModal';
import MercadoPagoWithdrawModal from '@/components/MercadoPagoWithdrawModal';
import BiometricAuthModal from '@/components/BiometricAuthModal';
import { 
  validateClabe, 
  validateLuhnCard, 
  validateGoFundMe, 
  generateValidClabe, 
  generateValidLuhnCard,
  validateIban,
  EUROPEAN_PAYMENT_BENEFICIARY
} from '@/lib/bankingValidation';

type TransferType = 'spei' | 'recurrent' | 'international' | 'card' | 'gofundme' | 'internal';

export default function TransferView({ onNavigate }: { onNavigate?: (view: any) => void }) {
  const { 
    userName,
    balance, 
    sendTransfer, 
    activeOtp, 
    generateNewOtp, 
    verifyOtp,
    cards,
    transactions,
    scheduledPayments,
    eurToUsdRate,
    executeScheduledPayment,
    toggleScheduledPaymentStatus,
    isAccountBlocked,
    securityConfig
  } = useBanking();

  const [transferType, setTransferType] = useState<TransferType>('spei');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [concept, setConcept] = useState('Pago de servicios y transferencias');
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');
  const [cotInput, setCotInput] = useState('');
  const [imfInput, setImfInput] = useState('');
  const [swiftInput, setSwiftInput] = useState('');
  const [isTxPendingApproval, setIsTxPendingApproval] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [lastTrackingKey, setLastTrackingKey] = useState('');
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [selectedReceipt, setSelectedReceipt] = useState<TransactionItem | null>(null);
  const [isPlus500ModalOpen, setIsPlus500ModalOpen] = useState(false);
  const [isMpWithdrawModalOpen, setIsMpWithdrawModalOpen] = useState(false);
  const [isBiometricTransferModalOpen, setIsBiometricTransferModalOpen] = useState(false);
  const [isBiometricallyConfirmed, setIsBiometricallyConfirmed] = useState(false);

  // European Recurrent Payment states
  const [isMandateModalOpen, setIsMandateModalOpen] = useState(false);
  const [recurrentSuccessMsg, setRecurrentSuccessMsg] = useState<string | null>(null);
  const [isExecutingRecurrent, setIsExecutingRecurrent] = useState(false);

  const types = [
    { 
      id: 'spei', 
      label: 'CLABE SPEI (México)', 
      icon: Building2, 
      desc: 'Transferencia interbancaria 18 dígitos validada por Banxico.',
      badge: 'SPEI 24/7'
    },
    { 
      id: 'recurrent', 
      label: 'Pago Semanal SEPA (Europa)', 
      icon: CalendarClock, 
      desc: 'Domiciliación automática de 2,500.00 EUR (Luxemburgo).',
      badge: '2,500 € / Sem'
    },
    { 
      id: 'international', 
      label: 'Internacional (SWIFT / IBAN)', 
      icon: Globe, 
      desc: 'Transferencia wire y SEPA a Europa / EE.UU. con MOD-97.',
      badge: 'SEPA / Wire'
    },
    { 
      id: 'card', 
      label: 'Tarjeta Débito / Crédito', 
      icon: CreditCard, 
      desc: 'Envío directo a tarjeta de 16 dígitos con validación Luhn.',
      badge: 'Visa / MC'
    },
    { 
      id: 'gofundme', 
      label: 'GoFundMe / Donación', 
      icon: Heart, 
      desc: 'Financiamiento directo de causas verificadas con recibo fiscal.',
      badge: 'Donaciones'
    },
    { 
      id: 'internal', 
      label: 'Transferencia Interna', 
      icon: ArrowRight, 
      desc: 'Envío inmediato entre cuentas Gold Payments sin comisiones.',
      badge: 'Instantáneo'
    },
  ] as const;

  // Real-time recipient validation
  const clabeValidation = transferType === 'spei' ? validateClabe(recipient) : null;
  const cardValidation = transferType === 'card' ? validateLuhnCard(recipient) : null;
  const gofundmeValidation = transferType === 'gofundme' ? validateGoFundMe(recipient) : null;
  const ibanValidation = transferType === 'international' ? validateIban(recipient) : null;

  // Validation status boolean
  let isRecipientValid = false;
  if (transferType === 'spei') {
    isRecipientValid = clabeValidation?.isValid ?? false;
  } else if (transferType === 'card') {
    isRecipientValid = cardValidation?.isValid ?? false;
  } else if (transferType === 'gofundme') {
    isRecipientValid = gofundmeValidation?.isValid ?? false;
  } else if (transferType === 'internal') {
    isRecipientValid = recipient.trim().length >= 4 && (recipient.includes('@') || recipient.toUpperCase().startsWith('GP-'));
  } else if (transferType === 'international') {
    isRecipientValid = ibanValidation ? ibanValidation.isValid : recipient.trim().length >= 15;
  } else if (transferType === 'recurrent') {
    isRecipientValid = true;
  }

  // Financial calculations
  const parsedAmount = parseFloat(amount) || 0;
  const cotFee = transferType === 'spei' ? 0 : parsedAmount * 0.02; // SPEI is free, international/cards 2%
  const totalAmount = parsedAmount + cotFee;
  const hasSufficientBalance = parsedAmount > 0 && totalAmount <= balance;

  const canProceed = isRecipientValid && hasSufficientBalance;

  // Start OTP timer on step 2
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpCooldown > 0) {
      timer = setTimeout(() => setOtpCooldown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [otpCooldown]);

  const handleNext = () => {
    if (!canProceed) return;
    if (isAccountBlocked) {
      alert('Tu cuenta bancaria está bloqueada por el departamento de administración y cumplimiento.');
      return;
    }
    generateNewOtp();
    setOtpCooldown(45);
    setOtpInput('');
    setOtpError('');
    // Prefill helper or let user input
    setCotInput('');
    setImfInput('');
    setSwiftInput('');
    setStep(2);
  };

  const handleResendOtp = () => {
    if (otpCooldown > 0) return;
    const newCode = generateNewOtp();
    setOtpCooldown(45);
    setOtpError('');
  };

  const handleAuthorize = () => {
    if (isAccountBlocked) {
      setOtpError('Tu cuenta bancaria ha sido bloqueada/congelada. No puedes transferir fondos.');
      return;
    }

    // Validate COT code if required
    if (securityConfig.requireCot) {
      if (!cotInput.trim()) {
        setOtpError('Se requiere ingresar el Código COT (Cost of Transfer).');
        return;
      }
      if (cotInput.trim().toUpperCase() !== securityConfig.cotCode.trim().toUpperCase()) {
        setOtpError(`Código COT incorrecto. Revisa el código asignado por el Gestor.`);
        return;
      }
    }

    // Validate IMF code if required
    if (securityConfig.requireImf) {
      if (!imfInput.trim()) {
        setOtpError('Se requiere ingresar el Código IMF (Autorización Monetaria).');
        return;
      }
      if (imfInput.trim().toUpperCase() !== securityConfig.imfCode.trim().toUpperCase()) {
        setOtpError(`Código IMF incorrecto. Revisa el código asignado por el Gestor.`);
        return;
      }
    }

    // Validate SWIFT code if required
    if (securityConfig.requireSwift) {
      if (!swiftInput.trim()) {
        setOtpError('Se requiere ingresar el Código SWIFT / PIN de Transferencia.');
        return;
      }
      if (swiftInput.trim().toUpperCase() !== securityConfig.swiftCode.trim().toUpperCase()) {
        setOtpError(`Código SWIFT / PIN incorrecto.`);
        return;
      }
    }

    if (!otpInput) {
      setOtpError('Por favor ingrese el código OTP de 6 dígitos');
      return;
    }

    if (!verifyOtp(otpInput)) {
      setOtpError(`Código OTP incorrecto. Ingrese el código activo: ${activeOtp}`);
      return;
    }

    // High-value transfer security check (>= $1,000 USD or equivalent)
    if (parsedAmount >= 1000 && !isBiometricallyConfirmed) {
      setIsBiometricTransferModalOpen(true);
      return;
    }

    executeFinalTransferDispatch();
  };

  const executeFinalTransferDispatch = () => {
    // Determine title
    let txTitle = 'Transferencia SPEI';
    let recipientLabel = recipient;

    if (transferType === 'spei') {
      txTitle = `SPEI a ${clabeValidation?.bankName || 'Banco'}`;
      recipientLabel = `${clabeValidation?.bankName} (CLABE: ••••${recipient.slice(-4)})`;
    } else if (transferType === 'card') {
      txTitle = `Transferencia a Tarjeta ${cardValidation?.brand || 'VISA'}`;
      recipientLabel = `Tarjeta ${cardValidation?.brand} (••••${recipient.slice(-4)})`;
    } else if (transferType === 'gofundme') {
      txTitle = `Donación GoFundMe: ${gofundmeValidation?.campaignName || 'Campaña'}`;
      recipientLabel = `GoFundMe (${gofundmeValidation?.campaignName})`;
    } else if (transferType === 'internal') {
      txTitle = 'Transferencia Interna Gold Payments';
    } else if (transferType === 'international') {
      const isOscar = recipient.toUpperCase().replace(/\s/g, '').includes('LU504080000046125444');
      txTitle = isOscar 
        ? `Pago SEPA Direct (${(parsedAmount / eurToUsdRate).toFixed(2)} EUR)` 
        : `Transferencia Internacional SWIFT/SEPA`;
      recipientLabel = isOscar 
        ? `${EUROPEAN_PAYMENT_BENEFICIARY.holderName} (${EUROPEAN_PAYMENT_BENEFICIARY.bankName})` 
        : (ibanValidation?.bankName ? `${ibanValidation.bankName} (${recipient})` : recipient);
    } else {
      txTitle = 'Transferencia Internacional';
    }

    const isPending = securityConfig.requireAdminApproval && parsedAmount >= securityConfig.minAmountForApproval;
    setIsTxPendingApproval(isPending);

    const result = sendTransfer({
      type: transferType === 'recurrent' ? 'international' : transferType,
      recipient: recipientLabel,
      amount: parsedAmount,
      fee: cotFee,
      title: txTitle,
      clabe: transferType === 'spei' ? recipient : undefined,
      cardLast4: transferType === 'card' ? recipient.slice(-4) : undefined,
    });

    if (result.success) {
      setLastTrackingKey(result.trackingKey);
      setStep(3);
    } else {
      setOtpError(result.error || 'Ocurrió un error al procesar la transferencia');
    }
  };

  const handleReset = () => {
    setStep(1);
    setAmount('');
    setRecipient('');
    setOtpInput('');
    setOtpError('');
  };

  // Quick preset helper
  const setQuickExample = () => {
    if (transferType === 'spei') {
      const validClabe = generateValidClabe('012', '180'); // BBVA CDMX
      setRecipient(validClabe);
    } else if (transferType === 'card') {
      const validCard = generateValidLuhnCard('VISA');
      setRecipient(validCard.number);
    } else if (transferType === 'gofundme') {
      setRecipient('https://gofundme.com/f/apoyo-comunitario-salud');
    } else if (transferType === 'internal') {
      setRecipient('soporte@goldpayments.com');
    } else if (transferType === 'international') {
      setRecipient(EUROPEAN_PAYMENT_BENEFICIARY.iban);
      setAmount((2500 * eurToUsdRate).toFixed(2));
      setConcept(`Pago SEPA a ${EUROPEAN_PAYMENT_BENEFICIARY.holderName} (2,500.00 EUR)`);
    }
  };

  const handleExecuteRecurrentNow = (paymentId: string) => {
    setIsExecutingRecurrent(true);
    setTimeout(() => {
      const res = executeScheduledPayment(paymentId);
      setIsExecutingRecurrent(false);
      if (res.success) {
        setRecurrentSuccessMsg(`Pago recurrente ejecutado con éxito: 2,500.00 EUR ($${(2500 * eurToUsdRate).toFixed(2)} USD). Folio: ${res.trackingKey}`);
        setLastTrackingKey(res.trackingKey);
        setTimeout(() => setRecurrentSuccessMsg(null), 7000);
      } else {
        alert(res.error || 'Error al ejecutar el pago programado');
      }
    }, 750);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-100 flex items-center gap-2">
            <span>Transferencias y Envíos</span>
            <span className="text-xs bg-emerald-500/10 text-emerald-400 font-semibold px-2.5 py-1 rounded-full border border-emerald-500/20">
              SPEI & Luhn Validados
            </span>
          </h1>
          <p className="text-neutral-400 text-sm mt-1">
            Validación de cuentas en tiempo real según normativas de Banco de México e ISO/IEC 7812.
          </p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl px-4 py-2.5 flex items-center justify-between gap-4">
          <span className="text-xs text-neutral-400">Saldo Disponible:</span>
          <span className="font-bold text-lg text-amber-400">${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</span>
        </div>
      </div>

      {/* Quick Action Card for Morse ACH Transfer */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-900/90 to-neutral-950 border border-amber-500/30 rounded-3xl p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-black text-xl shrink-0">
            M
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-neutral-100 text-sm">Beneficiario & Cuenta Morse</span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold px-2 py-0.5 rounded-full">
                ACH DIRECT
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Número de ruta (routing), cuenta Checking y transferencias ACH directas a euros o dólares digitales.
            </p>
          </div>
        </div>
        <button
          onClick={() => onNavigate?.('morse')}
          className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold rounded-xl transition-all border border-neutral-700 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
        >
          <span>Abrir Cuenta Morse</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Quick Action Card for Plus500SEY Ltd International Payment */}
      <div className="bg-gradient-to-r from-neutral-900 via-amber-950/25 to-neutral-950 border border-amber-500/40 rounded-3xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-black text-xl shrink-0">
            <Building2 size={24} />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-neutral-100 text-sm">Orden de Pago Plus500SEY Ltd</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold px-2 py-0.5 rounded-full">
                Deutsche Bank AG
              </span>
              <span className="text-[10px] bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded-md font-mono">
                MXN
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              IBAN: <strong className="font-mono text-neutral-200">DE98 5007 0010 0176 9009 04</strong> &bull; Referencia: <strong className="font-mono text-amber-300">185591571</strong>
            </p>
          </div>
        </div>
        <button
          id="btn-transferview-pay-plus500"
          onClick={() => setIsPlus500ModalOpen(true)}
          className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 text-xs font-black rounded-xl transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
        >
          <Send size={14} />
          <span>Pagar Plus500 Ahora</span>
        </button>
      </div>

      {/* Quick Action Card for Mercado Pago SPEI Withdrawal */}
      <div className="bg-gradient-to-r from-neutral-900 via-sky-950/25 to-neutral-950 border border-sky-500/40 rounded-3xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center font-black text-xl shrink-0">
            <ArrowDownLeft size={24} className="stroke-[2.5]" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-neutral-100 text-sm">Retiro de Fondos a CLABE</span>
              <span className="text-[10px] bg-sky-500/20 text-sky-300 border border-sky-500/30 font-bold px-2 py-0.5 rounded-full">
                Mercado Pago
              </span>
              <span className="text-[10px] bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded-md font-mono">
                SPEI MXN
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Transfiere MXN directo a tu cuenta CLABE registrada con liquidación electrónica en tiempo real.
            </p>
          </div>
        </div>
        <button
          id="btn-transferview-open-mp-withdraw"
          onClick={() => setIsMpWithdrawModalOpen(true)}
          className="px-5 py-2.5 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-neutral-950 text-xs font-black rounded-xl transition-all shadow-md shadow-sky-500/20 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
        >
          <ArrowDownLeft size={14} className="stroke-[2.5]" />
          <span>Retirar a CLABE Ahora</span>
        </button>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 md:p-8 shadow-xl">
        <AnimatePresence mode="wait">
          {/* STEP 1: Details & Real-Time Validation */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* Transfer Type Selector */}
              <div>
                <label className="block text-sm font-semibold text-neutral-300 mb-3">
                  Selecciona el método de transferencia:
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {types.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setTransferType(t.id);
                        setRecipient('');
                      }}
                      className={cn(
                        "p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between",
                        transferType === t.id 
                          ? "bg-amber-500/10 border-amber-500 text-neutral-100 shadow-md shadow-amber-500/5" 
                          : "bg-neutral-950 border-neutral-800 hover:border-neutral-700 text-neutral-400"
                      )}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center",
                          transferType === t.id ? "bg-amber-500 text-neutral-950 font-bold" : "bg-neutral-800 text-neutral-400"
                        )}>
                          <t.icon size={18} />
                        </div>
                        <span className={cn(
                          "text-[10px] font-semibold px-2 py-0.5 rounded-md",
                          transferType === t.id ? "bg-amber-500/20 text-amber-400" : "bg-neutral-800 text-neutral-400"
                        )}>
                          {t.badge}
                        </span>
                      </div>
                      <div>
                        <h3 className={cn("font-semibold text-sm mb-1", transferType === t.id ? "text-amber-400" : "text-neutral-200")}>
                          {t.label}
                        </h3>
                        <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">{t.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Meru Deposit Flow Banner */}
              {onNavigate && (
                <div className="p-3.5 rounded-2xl bg-neutral-950 border border-amber-500/30 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">🇲🇽</span>
                    <div>
                      <p className="font-bold text-neutral-200">Orden de Depósito Meru Activa (1.720,00 MXN)</p>
                      <p className="text-[11px] text-neutral-400">KOYWE S de RL de CV &bull; NVIO (710969000021584949)</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate('meru')}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-lg shrink-0 transition-colors text-xs"
                  >
                    Abrir Orden Meru &rarr;
                  </button>
                </div>
              )}

              {/* When Recurrent European Payment is selected */}
              {transferType === 'recurrent' ? (
                <div className="space-y-5 pt-2">
                  {/* Recurrent Execution Feedback */}
                  {recurrentSuccessMsg && (
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between gap-3 animate-fade-in">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                        <span className="font-medium">{recurrentSuccessMsg}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setRecurrentSuccessMsg(null)}
                        className="text-emerald-400 hover:text-emerald-200 text-xs px-2 py-1 bg-emerald-500/20 rounded-lg"
                      >
                        Cerrar
                      </button>
                    </div>
                  )}

                  {scheduledPayments.map((payment) => {
                    const isOscar = payment.id === 'sched-sepa-oscar';
                    const isPaused = payment.status === 'paused';

                    return (
                      <div 
                        key={payment.id}
                        className="bg-neutral-950 border border-amber-500/30 rounded-3xl p-5 sm:p-6 space-y-6 relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

                        {/* Card Header & Status */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-800">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xl shrink-0">
                              🇱🇺
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5",
                                  isPaused 
                                    ? "bg-neutral-800 text-neutral-400 border border-neutral-700" 
                                    : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                )}>
                                  <span className={cn("w-1.5 h-1.5 rounded-full", isPaused ? "bg-neutral-500" : "bg-emerald-400 animate-pulse")} />
                                  {isPaused ? 'Domiciliación Pausada' : 'Domiciliación SEPA Activa'}
                                </span>
                                <span className="text-xs text-neutral-500 font-mono">
                                  {payment.mandateReference}
                                </span>
                              </div>
                              <h2 className="text-base sm:text-lg font-bold text-neutral-100 mt-1">
                                Pago Recurrente: {payment.recipientName}
                              </h2>
                            </div>
                          </div>

                          <div className="text-left sm:text-right">
                            <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
                              €{payment.amountEur.toLocaleString('es-MX', { minimumFractionDigits: 2 })} EUR
                            </div>
                            <div className="text-xs text-neutral-400 font-mono mt-0.5">
                              ≈ ${payment.amountUsdEquivalent.toLocaleString('es-MX', { minimumFractionDigits: 2 })} USD / semana
                            </div>
                          </div>
                        </div>

                        {/* Beneficiary Details Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="bg-neutral-900/80 p-3.5 rounded-2xl border border-neutral-800 space-y-1">
                            <span className="text-neutral-400 block text-[11px]">Titular de la Cuenta Europa:</span>
                            <span className="font-bold text-neutral-100 text-sm block">
                              {payment.recipientName}
                            </span>
                            <span className="text-neutral-400 text-[11px] block mt-1">
                              País: <strong className="text-neutral-200">Luxemburgo 🇱🇺 (Zona Única de Pagos en Euros - SEPA)</strong>
                            </span>
                          </div>

                          <div className="bg-neutral-900/80 p-3.5 rounded-2xl border border-neutral-800 space-y-1">
                            <span className="text-neutral-400 block text-[11px]">Banco Receptor (BIC/SWIFT):</span>
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-neutral-100 block">
                                {payment.bankName}
                              </span>
                              <span className="font-mono bg-neutral-800 px-2 py-0.5 rounded text-amber-400 font-semibold">
                                {payment.bic}
                              </span>
                            </div>
                            <span className="text-neutral-400 text-[11px] block truncate" title={payment.bankAddress}>
                              {payment.bankAddress}
                            </span>
                          </div>
                        </div>

                        {/* IBAN Box with Copy */}
                        <div className="bg-neutral-900 p-4 rounded-2xl border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          <div>
                            <span className="text-neutral-400 block text-[11px] mb-0.5">Código Internacional de Cuenta Bancaria (IBAN):</span>
                            <span className="font-mono text-base font-bold text-emerald-400 tracking-wider select-all">
                              {payment.iban}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded-md font-mono">
                              MOD-97 OK ✓
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(payment.iban)}
                              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl font-medium transition-colors flex items-center gap-1.5 cursor-pointer text-xs"
                            >
                              {copiedKey ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                              <span>{copiedKey ? 'Copiado' : 'Copiar IBAN'}</span>
                            </button>
                          </div>
                        </div>

                        {/* Standing Order Parameters */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                          <div className="bg-neutral-900/60 p-3 rounded-xl border border-neutral-800/80">
                            <span className="text-neutral-500 block text-[11px]">Frecuencia</span>
                            <span className="font-semibold text-neutral-200 mt-0.5 block capitalize">
                              Semanal (Viernes)
                            </span>
                          </div>
                          <div className="bg-neutral-900/60 p-3 rounded-xl border border-neutral-800/80">
                            <span className="text-neutral-500 block text-[11px]">Próximo Débito</span>
                            <span className="font-semibold text-amber-400 mt-0.5 block font-mono">
                              {payment.nextExecutionDate}
                            </span>
                          </div>
                          <div className="bg-neutral-900/60 p-3 rounded-xl border border-neutral-800/80">
                            <span className="text-neutral-500 block text-[11px]">Comisión Red</span>
                            <span className="font-bold text-emerald-400 mt-0.5 block font-mono">
                              $0.00 USD (0%)
                            </span>
                          </div>
                          <div className="bg-neutral-900/60 p-3 rounded-xl border border-neutral-800/80">
                            <span className="text-neutral-500 block text-[11px]">Ejecutadas</span>
                            <span className="font-semibold text-neutral-200 mt-0.5 block">
                              {payment.totalExecutions} pago ({payment.totalExecutions * payment.amountEur} €)
                            </span>
                          </div>
                        </div>

                        {/* Interactive Actions for the Standing Order */}
                        <div className="pt-2 flex flex-col sm:flex-row gap-3">
                          <button
                            type="button"
                            onClick={() => handleExecuteRecurrentNow(payment.id)}
                            disabled={isExecutingRecurrent || isPaused}
                            className="flex-1 py-3.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 font-bold rounded-2xl text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
                          >
                            {isExecutingRecurrent ? (
                              <>
                                <div className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                                <span>Emitiendo Transferencia SEPA...</span>
                              </>
                            ) : (
                              <>
                                <Play size={16} className="fill-current" />
                                <span>Ejecutar Pago Semanal Ahora (2,500.00 EUR)</span>
                              </>
                            )}
                          </button>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => toggleScheduledPaymentStatus(payment.id)}
                              className="px-4 py-3.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold rounded-2xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                              title={isPaused ? 'Reanudar pagos automáticos' : 'Pausar pagos automáticos'}
                            >
                              {isPaused ? <Play size={14} className="text-emerald-400" /> : <Pause size={14} className="text-amber-400" />}
                              <span>{isPaused ? 'Reanudar' : 'Pausar'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setIsMandateModalOpen(true)}
                              className="px-4 py-3.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold rounded-2xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                              title="Ver Mandato Bancario Oficial SEPA"
                            >
                              <FileText size={14} className="text-amber-400" />
                              <span>Mandato SEPA</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const matchedTx = transactions.find(t => t.id === 'tx-sepa-oscar-initial' || t.trackingKey === lastTrackingKey) || transactions[0];
                                setSelectedReceipt(matchedTx || null);
                              }}
                              className="px-4 py-3.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold rounded-2xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                              title="Ver Comprobante de Transferencia"
                            >
                              <Printer size={14} className="text-neutral-400" />
                              <span>Recibo</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Standard Form Fields (SPEI, International, Card, GoFundMe, Internal) */
                <div className="space-y-5 pt-2">
                  {/* 1-Click European Preset Banner for International Transfers */}
                  {transferType === 'international' && (
                    <div className="space-y-3">
                      <div className="p-4 rounded-2xl bg-neutral-950 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">🇱🇺</span>
                          <div>
                            <p className="font-bold text-neutral-100 text-sm">
                              {EUROPEAN_PAYMENT_BENEFICIARY.holderName} (2,500.00 EUR)
                            </p>
                            <p className="text-[11px] text-neutral-400 font-mono">
                              IBAN: {EUROPEAN_PAYMENT_BENEFICIARY.iban} &bull; {EUROPEAN_PAYMENT_BENEFICIARY.bankName}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setRecipient(EUROPEAN_PAYMENT_BENEFICIARY.iban);
                            setAmount((2500 * eurToUsdRate).toFixed(2));
                            setConcept(`Pago SEPA a ${EUROPEAN_PAYMENT_BENEFICIARY.holderName} (2,500.00 EUR)`);
                          }}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl shrink-0 transition-colors text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <Sparkles size={14} />
                          <span>Autocompletar Datos (2,500 EUR)</span>
                        </button>
                      </div>

                      {/* SWIFT / BIC Directory Shortcut */}
                      {onNavigate && (
                        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-neutral-950 to-amber-950/20 border border-neutral-800 flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                              <Globe2 size={16} />
                            </div>
                            <div>
                              <p className="font-bold text-neutral-200">Directorio Oficial SWIFT/BIC & Cotizador Wise</p>
                              <p className="text-[11px] text-neutral-400">Encuentra o verifica códigos bancarios internacionales con tasa garantizada 96h.</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => onNavigate('swift')}
                            className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-amber-400 hover:text-amber-300 font-bold rounded-xl shrink-0 transition-colors text-xs border border-amber-500/30 flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>Abrir Códigos SWIFT</span>
                            <ArrowRight size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Recipient Input with Live Validator Feedback */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-neutral-300">
                        {transferType === 'spei' && 'CLABE Interbancaria Destino (18 dígitos)'}
                        {transferType === 'card' && 'Número de Tarjeta Destino (16 dígitos)'}
                        {transferType === 'gofundme' && 'Enlace o ID de Campaña GoFundMe'}
                        {transferType === 'internal' && 'Cuenta Gold Payments o Correo del Destinatario'}
                        {transferType === 'international' && 'Código IBAN / Cuenta Internacional Europea'}
                      </label>
                      <div className="flex items-center gap-3">
                        {transferType === 'spei' && (
                          <button
                            type="button"
                            onClick={() => {
                              setRecipient('710969000021584949');
                              setAmount('86');
                              setConcept('Depósito a Meru: 1.720,00 MXN');
                            }}
                            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                            title="Cargar CLABE y datos de orden Meru / Koywe"
                          >
                            ⚡ Orden Meru (1,720 MXN)
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={setQuickExample}
                          className="text-xs text-amber-500 hover:text-amber-400 underline underline-offset-2"
                        >
                          Autocompletar válido
                        </button>
                      </div>
                    </div>

                    <div className="relative">
                      <input 
                        type="text" 
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        className={cn(
                          "w-full bg-neutral-950 border rounded-xl px-4 py-3.5 text-neutral-100 font-mono tracking-wide focus:outline-none transition-colors",
                          recipient && isRecipientValid 
                            ? "border-emerald-500/80 focus:ring-1 focus:ring-emerald-500" 
                            : recipient && !isRecipientValid
                            ? "border-red-500/80 focus:ring-1 focus:ring-red-500"
                            : "border-neutral-800 focus:border-amber-500"
                        )}
                        placeholder={
                          transferType === 'spei' ? 'Ej: 012180015678901234 (18 dígitos Banxico)' :
                          transferType === 'card' ? 'Ej: 4291 8502 1943 0020 (Luhn válido)' :
                          transferType === 'gofundme' ? 'https://gofundme.com/f/apoyo-medico' :
                          transferType === 'internal' ? 'GP-8492-9102 o usuario@ejemplo.com' :
                          'Ej: LU504080000046125444 (IBAN Europeo)'
                        }
                      />

                      {recipient && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {isRecipientValid ? (
                            <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg text-xs font-semibold">
                              <CheckCircle2 size={15} />
                              <span>Válido</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-red-400 bg-red-500/10 px-2.5 py-1 rounded-lg text-xs font-semibold">
                              <AlertCircle size={15} />
                              <span>Inválido</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Real-time CLABE Banxico Inspection Details */}
                    {transferType === 'spei' && recipient && (
                      <div className="mt-2.5 text-xs">
                        {clabeValidation?.isValid ? (
                          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 space-y-1">
                            <div className="flex items-center justify-between font-medium">
                              <span>Institución Bancaria: <strong className="text-white">{clabeValidation.bankName}</strong></span>
                              <span className="bg-emerald-500/20 px-2 py-0.5 rounded text-[11px]">Código: {clabeValidation.bankCode}</span>
                            </div>
                            <div className="flex items-center justify-between text-emerald-400/90 text-[11px]">
                              <span>Plaza SPEI: {clabeValidation.plaza}</span>
                              <span>Cuenta: ••••{clabeValidation.account.slice(-4)}</span>
                              <span>Dígito de Control: {clabeValidation.controlDigit} (Verificado ✓)</span>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 flex items-start gap-2">
                            <AlertCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
                            <div>
                              <p className="font-semibold text-red-200">Error de Validación Banxico:</p>
                              <p className="text-red-300/90 text-[11px] mt-0.5">{clabeValidation?.error}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Real-time IBAN MOD-97 European Inspection Details */}
                    {transferType === 'international' && recipient && (
                      <div className="mt-2.5 text-xs">
                        {ibanValidation?.isValid ? (
                          <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 space-y-2">
                            <div className="flex items-center justify-between font-medium">
                              <div className="flex items-center gap-2">
                                <span className="text-base">{ibanValidation.countryCode === 'LU' ? '🇱🇺' : '🇪🇺'}</span>
                                <span className="font-bold text-white">{ibanValidation.bankName}</span>
                              </div>
                              <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded text-[11px] font-mono">
                                BIC: {ibanValidation.bic}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-emerald-400/90 pt-1 border-t border-emerald-500/20">
                              <div>
                                <span className="text-neutral-400">Titular Reconocido: </span>
                                <strong className="text-white">{EUROPEAN_PAYMENT_BENEFICIARY.holderName}</strong>
                              </div>
                              <div>
                                <span className="text-neutral-400">Dirección del Banco: </span>
                                <span className="text-emerald-200">{ibanValidation.bankAddress || EUROPEAN_PAYMENT_BENEFICIARY.bankAddress}</span>
                              </div>
                              <div>
                                <span className="text-neutral-400">País / Región: </span>
                                <span className="text-emerald-200">{ibanValidation.countryName} (Zona SEPA)</span>
                              </div>
                              <div>
                                <span className="text-neutral-400">Validación MOD-97: </span>
                                <span className="text-emerald-300 font-semibold">ISO 13616 Válido ✓</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 flex items-start gap-2">
                            <AlertCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
                            <div>
                              <p className="font-semibold text-red-200">Error en Código IBAN:</p>
                              <p className="text-red-300/90 text-[11px] mt-0.5">{ibanValidation?.error || 'Formato IBAN inválido'}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Real-time Card Luhn Inspection Details */}
                    {transferType === 'card' && recipient && (
                      <div className="mt-2.5 text-xs">
                        {cardValidation?.isValid ? (
                          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 flex items-center justify-between">
                            <div className="space-y-0.5">
                              <p className="font-medium text-white">Tarjeta {cardValidation.brand} Verificada</p>
                              <p className="text-emerald-400/90 text-[11px]">BIN: {cardValidation.bin} | Cumple con ISO/IEC 7812 (Algoritmo Luhn)</p>
                            </div>
                            <span className="bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded-md font-semibold text-[11px]">
                              Luhn Mod 10: OK
                            </span>
                          </div>
                        ) : (
                          <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 flex items-start gap-2">
                            <AlertCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
                            <div>
                              <p className="font-semibold text-red-200">Tarjeta Inválida:</p>
                              <p className="text-red-300/90 text-[11px] mt-0.5">{cardValidation?.error}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* GoFundMe validation preview */}
                    {transferType === 'gofundme' && recipient && (
                      <div className="mt-2.5 text-xs">
                        {gofundmeValidation?.isValid ? (
                          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">
                            <p className="font-semibold text-white">Campaña: {gofundmeValidation.campaignName}</p>
                            <p className="text-emerald-400/80 text-[11px] mt-0.5">Destino benéfico verificado. Se emitirá recibo de donación deducible.</p>
                          </div>
                        ) : (
                          <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-[11px]">
                            {gofundmeValidation?.error}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Amount Input */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-neutral-300">Monto a Transferir (USD)</label>
                      <span className="text-xs text-neutral-400">
                        Disponible: <span className="font-semibold text-neutral-200">${balance.toFixed(2)}</span>
                      </span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-bold text-lg">$</span>
                      <input 
                        type="number" 
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-24 py-3.5 text-neutral-100 text-xl font-semibold focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                        placeholder="0.00"
                        min="1"
                        step="0.01"
                      />
                      <button
                        type="button"
                        onClick={() => setAmount(Math.max(0, balance - 10).toFixed(2))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-medium transition-colors"
                      >
                        Máximo
                      </button>
                    </div>

                    {/* Preset amount buttons */}
                    <div className="flex gap-2 mt-2">
                      {[50, 100, 250, 500, 2712.50].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setAmount(val.toString())}
                          className="flex-1 py-1.5 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-xs text-neutral-400 hover:text-neutral-200 transition-colors"
                        >
                          {val === 2712.50 ? '2,500 €' : `$${val}`}
                        </button>
                      ))}
                    </div>

                    {/* Balance warning */}
                    {parsedAmount > 0 && !hasSufficientBalance && (
                      <p className="mt-2 text-xs text-red-400 flex items-center gap-1">
                        <AlertCircle size={14} />
                        Saldo insuficiente. El total con comisiones (${totalAmount.toFixed(2)} USD) supera tu balance (${balance.toFixed(2)} USD).
                      </p>
                    )}
                  </div>

                  {/* Concept / Reference */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">Concepto de Transferencia / Referencia</label>
                    <input 
                      type="text" 
                      value={concept}
                      onChange={(e) => setConcept(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-neutral-200 focus:outline-none focus:border-amber-500 transition-colors"
                      placeholder="Ej: Pago de nómina, servicios, apoyo..."
                    />
                  </div>

                  {/* Fee & Breakdown Preview */}
                  {parsedAmount > 0 && (
                    <div className="bg-neutral-950 rounded-2xl p-4 border border-neutral-800 text-sm space-y-2">
                      <div className="flex justify-between text-neutral-400">
                        <span>Monto base solicitado:</span>
                        <span className="font-mono text-neutral-200">${parsedAmount.toFixed(2)} USD</span>
                      </div>
                      <div className="flex justify-between text-neutral-400">
                        <span>Comisión de compensación:</span>
                        <span className="font-mono text-neutral-200">
                          {cotFee === 0 ? <span className="text-emerald-400">$0.00 (Gratis)</span> : `$${cotFee.toFixed(2)} USD (2%)`}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-neutral-800/80 flex justify-between font-bold">
                        <span className="text-neutral-200">Total a debitar:</span>
                        <span className="text-amber-400 text-base font-mono">${totalAmount.toFixed(2)} USD</span>
                      </div>
                    </div>
                  )}

                  {/* Account Blocked Alert Banner */}
                  {isAccountBlocked && (
                    <div className="p-4 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-start gap-3">
                      <Lock className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-bold text-red-100">Cuenta Bloqueada por Administración</p>
                        <p className="text-red-300 mt-0.5">
                          Tu cuenta bancaria ha sido congelada temporalmente por el Gestor. Todas las operaciones de transferencia y débito se encuentran suspendidas. Contacta al soporte en vivo o al Gestor para solicitar el desbloqueo.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <button 
                    type="button"
                    onClick={handleNext}
                    disabled={!canProceed || isAccountBlocked}
                    className="w-full py-4 bg-amber-500 text-neutral-950 font-bold rounded-xl hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-amber-500/10 text-base flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>{isAccountBlocked ? 'Cuenta Bloqueada' : 'Continuar a Verificación 2FA'}</span>
                    <ArrowRight size={18} />
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 2: Authorization & OTP Security Validation */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 mb-2">
                  <ShieldCheck size={32} />
                </div>
                <h2 className="text-xl font-bold text-neutral-100">Autorización de Seguridad 2FA</h2>
                <p className="text-neutral-400 text-sm max-w-md mx-auto">
                  Revisa los datos de la transferencia y confirma con tu clave dinámica de un solo uso (OTP).
                </p>
              </div>

              {/* Transfer Summary Card */}
              <div className="bg-neutral-950 rounded-2xl p-5 border border-neutral-800 space-y-3.5 text-sm">
                <div className="flex justify-between items-center py-1 border-b border-neutral-800/60">
                  <span className="text-neutral-400">Tipo de Envío</span>
                  <span className="font-semibold text-neutral-200 uppercase tracking-wide text-xs bg-neutral-800 px-2.5 py-1 rounded-md">
                    {transferType.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-neutral-800/60">
                  <span className="text-neutral-400">Destinatario</span>
                  <span className="font-mono text-neutral-200 text-right truncate max-w-[240px]">{recipient}</span>
                </div>
                {transferType === 'spei' && clabeValidation?.isValid && (
                  <div className="flex justify-between items-center py-1 border-b border-neutral-800/60 text-xs">
                    <span className="text-neutral-400">Banco Receptor</span>
                    <span className="text-emerald-400 font-medium">{clabeValidation.bankName}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-1 border-b border-neutral-800/60">
                  <span className="text-neutral-400">Concepto</span>
                  <span className="text-neutral-200">{concept}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-neutral-800/60">
                  <span className="text-neutral-400">Monto Neto</span>
                  <span className="font-mono font-bold text-neutral-100">${parsedAmount.toFixed(2)} USD</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-neutral-800/60">
                  <span className="text-neutral-400">Comisión / Gastos de Despacho</span>
                  <span className="font-mono text-neutral-200">${cotFee.toFixed(2)} USD</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-neutral-300 font-semibold">Total a Debitar</span>
                  <span className="font-mono font-bold text-2xl text-amber-400">${totalAmount.toFixed(2)} USD</span>
                </div>
              </div>

              {/* Transfer Verification Codes (COT, IMF, SWIFT) */}
              {(securityConfig.requireCot || securityConfig.requireImf || securityConfig.requireSwift) && (
                <div className="p-5 rounded-2xl bg-neutral-950 border border-amber-500/30 space-y-4">
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-amber-400" />
                      <span className="text-sm font-bold text-white">Códigos de Transferencia Exigidos</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                      Requisito del Gestor
                    </span>
                  </div>

                  <p className="text-xs text-neutral-400">
                    La política de seguridad bancaria exige el ingreso de los códigos de liberación para autorizar este envío:
                  </p>

                  <div className="space-y-3">
                    {securityConfig.requireCot && (
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <label className="text-neutral-300 font-semibold flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-400" />
                            Código COT (Cost of Transfer / Certificado):
                          </label>
                          <button
                            type="button"
                            onClick={() => setCotInput(securityConfig.cotCode)}
                            className="text-[11px] text-amber-400 hover:text-amber-300 font-mono bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800"
                          >
                            Pegar ({securityConfig.cotCode})
                          </button>
                        </div>
                        <input
                          type="text"
                          value={cotInput}
                          onChange={(e) => setCotInput(e.target.value)}
                          placeholder={`Ingresa ${securityConfig.cotCode}`}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-amber-500 uppercase"
                        />
                      </div>
                    )}

                    {securityConfig.requireImf && (
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <label className="text-neutral-300 font-semibold flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-400" />
                            Código IMF (Monetary Clearance):
                          </label>
                          <button
                            type="button"
                            onClick={() => setImfInput(securityConfig.imfCode)}
                            className="text-[11px] text-amber-400 hover:text-amber-300 font-mono bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800"
                          >
                            Pegar ({securityConfig.imfCode})
                          </button>
                        </div>
                        <input
                          type="text"
                          value={imfInput}
                          onChange={(e) => setImfInput(e.target.value)}
                          placeholder={`Ingresa ${securityConfig.imfCode}`}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-amber-500 uppercase"
                        />
                      </div>
                    )}

                    {securityConfig.requireSwift && (
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <label className="text-neutral-300 font-semibold flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-400" />
                            Código SWIFT / PIN de Transferencia:
                          </label>
                          <button
                            type="button"
                            onClick={() => setSwiftInput(securityConfig.swiftCode)}
                            className="text-[11px] text-amber-400 hover:text-amber-300 font-mono bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800"
                          >
                            Pegar ({securityConfig.swiftCode})
                          </button>
                        </div>
                        <input
                          type="text"
                          value={swiftInput}
                          onChange={(e) => setSwiftInput(e.target.value)}
                          placeholder={`Ingresa ${securityConfig.swiftCode}`}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-amber-500 uppercase"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Active OTP Simulation Banner */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold flex items-center gap-1.5">
                    <ShieldCheck size={16} />
                    Código OTP de Seguridad Generado:
                  </span>
                  <button 
                    type="button"
                    onClick={() => setOtpInput(activeOtp)}
                    className="text-xs bg-amber-500 text-neutral-950 font-bold px-2 py-0.5 rounded hover:bg-amber-400 transition-colors"
                  >
                    Pegar Código
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xl font-bold tracking-widest text-white bg-neutral-950/80 px-3 py-1 rounded-lg border border-amber-500/20">
                    {activeOtp}
                  </span>
                  <span className="text-xs text-amber-400/90">Enviado a tu SMS/Email registrado</span>
                </div>
              </div>

              {/* OTP Input Form */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-neutral-300">
                  Ingresa el código OTP de 6 dígitos:
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={otpInput}
                    onChange={(e) => {
                      setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6));
                      setOtpError('');
                    }}
                    className={cn(
                      "w-full bg-neutral-950 border rounded-xl px-4 py-3.5 text-center font-mono tracking-widest text-2xl text-neutral-100 focus:outline-none transition-colors",
                      otpError ? "border-red-500" : "border-neutral-800 focus:border-amber-500"
                    )}
                    placeholder="••••••"
                    maxLength={6}
                  />
                </div>

                {otpError && (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {otpError}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span>¿No recibiste el código?</span>
                  <button 
                    type="button"
                    onClick={handleResendOtp}
                    disabled={otpCooldown > 0}
                    className="text-amber-500 hover:text-amber-400 disabled:text-neutral-600 font-medium flex items-center gap-1"
                  >
                    <RotateCw size={13} className={otpCooldown > 0 ? "animate-spin" : ""} />
                    {otpCooldown > 0 ? `Reenviar en ${otpCooldown}s` : 'Reenviar código OTP'}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-3.5 bg-neutral-800 text-neutral-200 font-semibold rounded-xl hover:bg-neutral-700 transition-colors"
                >
                  Regresar
                </button>
                <button 
                  type="button"
                  onClick={handleAuthorize}
                  className="flex-[2] py-3.5 bg-amber-500 text-neutral-950 font-bold rounded-xl hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/10 text-base"
                >
                  Autorizar y Liquidar
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Transfer Success & Official Receipt */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-4 space-y-6"
            >
              <div className="text-center space-y-2">
                <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full border mb-2 ${
                  isTxPendingApproval 
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                }`}>
                  {isTxPendingApproval ? <Clock size={44} /> : <CheckCircle2 size={44} />}
                </div>
                <h2 className="text-2xl font-bold text-neutral-100">
                  {isTxPendingApproval ? 'Transferencia en Revisión del Gestor' : 'Transferencia Exitosa'}
                </h2>
                <p className="text-neutral-400 text-sm max-w-lg mx-auto">
                  {isTxPendingApproval 
                    ? 'Por políticas de prevención y control de transferencias mayores, esta operación ha sido enviada a la cola de Aprobación Manual del Gestor.'
                    : 'Los fondos han sido liquidados y transferidos a través del sistema bancario.'}
                </p>
              </div>

              {/* Official Voucher / Receipt */}
              <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 space-y-4 font-sans text-sm">
                <div className="flex justify-between items-center pb-4 border-b border-neutral-800">
                  <div>
                    <span className="font-bold text-base text-neutral-100">Comprobante de Operación</span>
                    <p className="text-xs text-neutral-500">Gold Payments Bank SPEI Gateway</p>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                    isTxPendingApproval
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  }`}>
                    {isTxPendingApproval ? 'PENDIENTE DE APROBACIÓN GESTOR' : 'LIQUIDADA'}
                  </span>
                </div>

                <div className="space-y-3 text-xs md:text-sm">
                  <div className="flex justify-between py-1">
                    <span className="text-neutral-400">Monto Acreditado:</span>
                    <span className="font-mono font-bold text-lg text-emerald-400">${parsedAmount.toFixed(2)} USD</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-neutral-400">Destinatario:</span>
                    <span className="font-mono text-neutral-200">{recipient}</span>
                  </div>
                  {transferType === 'spei' && clabeValidation?.bankName && (
                    <div className="flex justify-between py-1">
                      <span className="text-neutral-400">Institución Receptora:</span>
                      <span className="text-neutral-200 font-medium">{clabeValidation.bankName}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1">
                    <span className="text-neutral-400">Concepto de Pago:</span>
                    <span className="text-neutral-200">{concept}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-neutral-400">Fecha y Hora de Liquidación:</span>
                    <span className="text-neutral-200">{new Date().toLocaleString()}</span>
                  </div>

                  {/* SPEI Tracking Key */}
                  <div className="pt-3 border-t border-neutral-800/80">
                    <span className="text-neutral-400 block mb-1 text-xs font-medium">Clave de Rastreo Banxico / Folio:</span>
                    <div className="flex items-center justify-between bg-neutral-900 border border-neutral-800 p-2.5 rounded-xl font-mono text-xs">
                      <span className="text-amber-400 font-bold tracking-wider select-all">{lastTrackingKey}</span>
                      <button 
                        type="button"
                        onClick={() => copyToClipboard(lastTrackingKey)}
                        className="flex items-center gap-1 text-neutral-400 hover:text-neutral-100 text-xs px-2 py-1 bg-neutral-800 rounded-md transition-colors"
                      >
                        {copiedKey ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                        <span>{copiedKey ? 'Copiado' : 'Copiar'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  id="view-printable-receipt-btn"
                  onClick={() => {
                    const matchedTx = transactions.find(t => t.trackingKey === lastTrackingKey) || transactions[0];
                    setSelectedReceipt(matchedTx || null);
                  }}
                  className="w-full py-3.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold rounded-xl hover:bg-amber-500/20 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <Printer size={16} />
                  <span>Ver e Imprimir Comprobante Oficial</span>
                </button>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button 
                    type="button"
                    onClick={handleReset}
                    className="flex-1 py-3.5 bg-neutral-800 text-neutral-200 font-bold rounded-xl hover:bg-neutral-700 transition-colors text-center"
                  >
                    Hacer Otra Transferencia
                  </button>
                  <button 
                    type="button"
                    onClick={() => onNavigate && onNavigate('dashboard')}
                    className="flex-1 py-3.5 bg-amber-500 text-neutral-950 font-bold rounded-xl hover:bg-amber-400 transition-colors text-center"
                  >
                    Volver al Dashboard
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Official European SEPA Direct Debit Mandate Modal */}
      {isMandateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6 text-neutral-200"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
                  🇪🇺
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Mandato de Adeudo Directo SEPA Core</h3>
                  <p className="text-xs text-neutral-400">European Payments Council (EPC) Rulebook &bull; ISO 20022</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMandateModalOpen(false)}
                className="p-2 hover:bg-neutral-800 rounded-xl text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Mandate Legal Form Content */}
            <div className="bg-neutral-950 rounded-2xl p-5 border border-neutral-800 space-y-4 text-xs">
              <div className="flex justify-between items-center bg-neutral-900/80 p-3 rounded-xl border border-neutral-800">
                <span className="text-neutral-400">Referencia de la Orden (Mandate Ref):</span>
                <span className="font-mono font-bold text-amber-400 text-sm">SEPA-MND-LU-46125444</span>
              </div>

              {/* Creditor Section */}
              <div className="space-y-1.5 pt-2">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-amber-400">1. Acreedor / Beneficiario en Europa (Creditor)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-neutral-300 bg-neutral-900/40 p-3 rounded-xl">
                  <div>
                    <span className="text-neutral-500 block text-[10px]">Nombre del Titular:</span>
                    <strong className="text-white text-xs">{EUROPEAN_PAYMENT_BENEFICIARY.holderName}</strong>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[10px]">Identificador de Acreedor:</span>
                    <span className="font-mono text-neutral-300">LU98ZZZ00000000000004612544</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[10px]">IBAN Receptor (Luxemburgo):</span>
                    <span className="font-mono text-emerald-400 font-bold">{EUROPEAN_PAYMENT_BENEFICIARY.iban}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[10px]">BIC / SWIFT:</span>
                    <span className="font-mono text-white font-bold">{EUROPEAN_PAYMENT_BENEFICIARY.bic}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-neutral-500 block text-[10px]">Banco y Domicilio:</span>
                    <span className="text-neutral-300">{EUROPEAN_PAYMENT_BENEFICIARY.bankName} &bull; {EUROPEAN_PAYMENT_BENEFICIARY.bankAddress}</span>
                  </div>
                </div>
              </div>

              {/* Debtor Section */}
              <div className="space-y-1.5 pt-2">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-amber-400">2. Deudor / Ordenante (Debtor)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-neutral-300 bg-neutral-900/40 p-3 rounded-xl">
                  <div>
                    <span className="text-neutral-500 block text-[10px]">Titular Pagador:</span>
                    <strong className="text-white text-xs">Cuenta Gold Payments Premium</strong>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[10px]">Identificador de Cuenta:</span>
                    <span className="font-mono text-neutral-300">GP-8492-9102-USD</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[10px]">Importe Fijo Semanal:</span>
                    <strong className="text-amber-400 text-sm">€2,500.00 EUR (Weekly Standing Order)</strong>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[10px]">Equivalente en Cuenta:</span>
                    <span className="font-mono text-neutral-300">≈ $2,712.50 USD (Tipo: 1.0850)</span>
                  </div>
                </div>
              </div>

              {/* Legal Notice */}
              <div className="p-3 bg-neutral-900/50 rounded-xl border border-neutral-800 text-[11px] text-neutral-400 leading-relaxed">
                Mediante la formalización de este mandato, el deudor autoriza a <strong>Gold Payments S.A.</strong> a enviar instrucciones a <strong>Banking Circle S.A.</strong> para adeudarse de su cuenta bancaria y a su entidad bancaria a efectuar dichos adeudos siguiendo dichas instrucciones con periodicidad semanal.
              </div>

              {/* Digital Certificate & Signature */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-xl text-emerald-300 text-[11px]">
                <div className="flex items-center gap-2">
                  <BadgeCheck size={18} className="text-emerald-400 shrink-0" />
                  <span>Firma Criptográfica: eIDAS / PSD2 Token Certificado</span>
                </div>
                <span className="font-mono text-neutral-400">SHA256: 4b219e8f...8820c7b1</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer size={15} />
                <span>Imprimir / Descargar Mandato (PDF)</span>
              </button>
              <button
                type="button"
                onClick={() => setIsMandateModalOpen(false)}
                className="py-3 px-6 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Official Transaction Receipt Modal */}
      <TransactionReceiptModal 
        transaction={selectedReceipt} 
        onClose={() => setSelectedReceipt(null)} 
      />

      {/* Plus500 Payment Modal */}
      <Plus500PaymentModal
        isOpen={isPlus500ModalOpen}
        onClose={() => setIsPlus500ModalOpen(false)}
        onViewReceipt={(tx) => setSelectedReceipt(tx)}
      />

      {/* Mercado Pago SPEI Withdrawal Modal */}
      <MercadoPagoWithdrawModal
        isOpen={isMpWithdrawModalOpen}
        onClose={() => setIsMpWithdrawModalOpen(false)}
        onViewReceipt={(tx) => setSelectedReceipt(tx)}
      />

      {/* Simulated High-Value Biometric Authentication Overlay */}
      <BiometricAuthModal
        isOpen={isBiometricTransferModalOpen}
        mode="transfer"
        amount={parsedAmount}
        recipient={recipient}
        userName={userName}
        onSuccess={() => {
          setIsBiometricallyConfirmed(true);
          setIsBiometricTransferModalOpen(false);
          executeFinalTransferDispatch();
        }}
        onCancel={() => setIsBiometricTransferModalOpen(false)}
      />
    </div>
  );
}
