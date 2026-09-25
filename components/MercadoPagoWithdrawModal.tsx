'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Copy, 
  Check, 
  RefreshCw, 
  Download, 
  Printer, 
  X, 
  Lock, 
  ArrowDownLeft
} from 'lucide-react';
import { useBanking, TransactionItem } from '@/lib/bankingStore';
import { validateClabe } from '@/lib/bankingValidation';
import { generateTransactionPdf } from '@/lib/receiptPdf';

interface MercadoPagoWithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewReceipt?: (tx: TransactionItem) => void;
}

interface MpAccountInfo {
  configured: boolean;
  status: 'connected' | 'not_configured' | 'auth_error' | 'connection_error';
  environment: 'production' | 'sandbox' | 'custom' | 'none';
  account?: {
    id: number | string;
    nickname: string;
    email: string;
    siteId: string;
    countryId: string;
  } | null;
  message?: string;
}

export default function MercadoPagoWithdrawModal({
  isOpen,
  onClose,
  onViewReceipt,
}: MercadoPagoWithdrawModalProps) {
  const { 
    balance, 
    userClabe, 
    userName, 
    usdToMxnRate, 
    executeMercadoPagoWithdrawal,
    activeOtp,
    generateNewOtp,
    verifyOtp
  } = useBanking();

  // Modal Step: 1 = Amount & CLABE, 2 = 2FA OTP, 3 = Processing, 4 = Success
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [useCustomClabe, setUseCustomClabe] = useState(false);
  const [customClabe, setCustomClabe] = useState('');
  const [amountMxn, setAmountMxn] = useState('');
  const [concept, setConcept] = useState('Retiro de fondos a cuenta CLABE');
  const [recipientName, setRecipientName] = useState(userName);
  
  // 2FA state
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpCooldown, setOtpCooldown] = useState(0);

  // Status & processing
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatusText, setProcessingStatusText] = useState('Conectando con Mercado Pago...');
  const [errorMessage, setErrorMessage] = useState('');
  const [withdrawResult, setWithdrawResult] = useState<{
    trackingKey: string;
    mpPaymentId?: string;
    mode?: string;
    tx?: TransactionItem;
  } | null>(null);

  // Mercado Pago account status from server
  const [mpAccount, setMpAccount] = useState<MpAccountInfo | null>(null);
  const [isLoadingAccount, setIsLoadingAccount] = useState(true);
  const [copiedKey, setCopiedKey] = useState(false);

  // Fetch Mercado Pago account status
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchAccount = async () => {
      try {
        const res = await fetch('/api/mercadopago/account');
        const data = await res.json();
        if (isMounted) {
          setMpAccount(data);
          setIsLoadingAccount(false);
        }
      } catch {
        if (isMounted) {
          setMpAccount({
            configured: false,
            status: 'connection_error',
            environment: 'none',
          });
          setIsLoadingAccount(false);
        }
      }
    };

    fetchAccount();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Handle OTP countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpCooldown > 0) {
      timer = setTimeout(() => setOtpCooldown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [otpCooldown]);

  const targetClabe = useCustomClabe ? customClabe.trim() : userClabe;
  const clabeInfo = validateClabe(targetClabe);

  const parsedMxn = parseFloat(amountMxn) || 0;
  const parsedUsd = parsedMxn > 0 ? +(parsedMxn / usdToMxnRate).toFixed(2) : 0;
  const maxMxn = +(balance * usdToMxnRate).toFixed(2);
  const hasSufficientBalance = parsedUsd > 0 && parsedUsd <= balance;
  const canProceed = clabeInfo.isValid && hasSufficientBalance && !isProcessing;

  const handleSetPercentage = (pct: number) => {
    const calculated = +(maxMxn * pct).toFixed(2);
    setAmountMxn(calculated.toString());
  };

  const handleNextToOtp = () => {
    if (!canProceed) return;
    setErrorMessage('');
    generateNewOtp();
    setOtpCooldown(45);
    setOtpInput('');
    setOtpError('');
    setStep(2);
  };

  const handleConfirmWithdrawal = async () => {
    if (!otpInput) {
      setOtpError('Ingresa el código OTP de 6 dígitos.');
      return;
    }
    if (!verifyOtp(otpInput)) {
      setOtpError(`Código OTP incorrecto. Código activo generado: ${activeOtp}`);
      return;
    }

    setStep(3);
    setIsProcessing(true);
    setProcessingStatusText('Validando cuenta CLABE ante el Banco de México (SPEI)...');

    setTimeout(() => {
      setProcessingStatusText('Autenticando con la API oficial de Mercado Pago...');
    }, 700);

    setTimeout(() => {
      setProcessingStatusText('Transmitiendo dispersión de fondos a CLABE interbancaria...');
    }, 1400);

    try {
      const res = await executeMercadoPagoWithdrawal({
        amountMxn: parsedMxn,
        amountUsd: parsedUsd,
        clabe: targetClabe,
        recipientName: recipientName.trim(),
        concept: concept.trim(),
      });

      setIsProcessing(false);

      if (res.success) {
        setWithdrawResult({
          trackingKey: res.trackingKey,
          mpPaymentId: res.mpPaymentId,
          mode: res.mode,
          tx: res.tx,
        });
        setStep(4);
      } else {
        setErrorMessage(res.error || 'Ocurrió un error al liquidar el retiro en Mercado Pago.');
        setStep(1);
      }
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMessage(err.message || 'Error de conexión con el servidor bancario.');
      setStep(1);
    }
  };

  const handleResetModal = () => {
    setStep(1);
    setAmountMxn('');
    setOtpInput('');
    setOtpError('');
    setErrorMessage('');
    setWithdrawResult(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        id="mercadopago-withdraw-modal-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden my-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 md:p-6 border-b border-neutral-800 bg-neutral-950/60">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-neutral-950 shadow-md shadow-amber-500/20">
                <ArrowDownLeft size={22} className="stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg md:text-xl font-extrabold text-neutral-100">
                    Retiro de Fondos SPEI
                  </h2>
                  <span className="text-[10px] bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-full font-bold">
                    Mercado Pago
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Envío directo de fondos en pesos mexicanos (MXN) a tu cuenta CLABE registrada.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Mercado Pago Account Connection Bar */}
          <div className="px-6 py-2.5 bg-neutral-950 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-neutral-400">Estado Mercado Pago:</span>
              {isLoadingAccount ? (
                <span className="text-neutral-500 animate-pulse flex items-center gap-1">
                  <RefreshCw size={12} className="animate-spin" /> Verificando conexión...
                </span>
              ) : mpAccount?.status === 'connected' ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Conectado {mpAccount.account?.nickname ? `(${mpAccount.account.nickname})` : 'Live'}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  Simulación Sandbox SPEI (Token no definido)
                </span>
              )}
            </div>

            <span className="text-neutral-400 font-mono text-[11px]">
              Tipo de Cambio: <strong>1 USD = {usdToMxnRate.toFixed(2)} MXN</strong>
            </span>
          </div>

          <div className="p-6 space-y-6">
            {errorMessage && (
              <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-3">
                <AlertCircle size={18} className="shrink-0 text-rose-400" />
                <span className="font-medium">{errorMessage}</span>
              </div>
            )}

            {/* STEP 1: Amount and CLABE Selection */}
            {step === 1 && (
              <div className="space-y-5">
                {/* Available Balance Preview Card */}
                <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs text-neutral-400">Saldo Disponible para Retiro</span>
                    <p className="text-xl font-extrabold text-neutral-100">
                      ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                    </p>
                  </div>
                  <div className="text-right space-y-0.5">
                    <span className="text-xs text-neutral-400">Equivalente en Pesos</span>
                    <p className="text-lg font-bold text-amber-400 font-mono">
                      ${maxMxn.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
                    </p>
                  </div>
                </div>

                {/* CLABE Selector */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                      <Building2 size={14} className="text-amber-400" />
                      <span>Cuenta CLABE de Destino (18 Dígitos)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setUseCustomClabe(!useCustomClabe)}
                      className="text-xs text-amber-400 hover:text-amber-300 underline font-medium"
                    >
                      {useCustomClabe ? 'Usar CLABE Registrada' : 'Ingresar Otra CLABE'}
                    </button>
                  </div>

                  {!useCustomClabe ? (
                    <div className="p-4 rounded-2xl bg-neutral-950 border border-amber-500/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                            CLABE Registrada Oficial
                          </span>
                          <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 size={13} /> Validada Banxico
                          </span>
                        </div>
                        <span className="text-xs text-neutral-400 font-mono font-bold">
                          {clabeInfo.bankName || 'STP / Gold Payments Bank'}
                        </span>
                      </div>
                      <div className="font-mono text-lg font-bold text-amber-300 tracking-wider">
                        {userClabe}
                      </div>
                      <p className="text-[11px] text-neutral-500">
                        Titular acreditado: <strong className="text-neutral-300">{userName}</strong> &bull; Liquidación inmediata SPEI
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="text"
                        maxLength={18}
                        value={customClabe}
                        onChange={(e) => setCustomClabe(e.target.value.replace(/\D/g, ''))}
                        placeholder="Ej. 012180004455667788"
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 font-mono text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-amber-500"
                      />
                      {customClabe.length > 0 && (
                        <div className="text-xs flex items-center gap-1.5">
                          {clabeInfo.isValid ? (
                            <span className="text-emerald-400 font-medium flex items-center gap-1">
                              <CheckCircle2 size={14} /> CLABE Válida: {clabeInfo.bankName} (Plaza: {clabeInfo.plaza})
                            </span>
                          ) : (
                            <span className="text-rose-400 font-medium flex items-center gap-1">
                              <AlertCircle size={14} /> {clabeInfo.error || 'CLABE inválida según normativa Banxico'}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Amount to Withdraw in MXN */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-neutral-300">
                      Importe a Retirar (MXN)
                    </label>
                    {parsedUsd > 0 && (
                      <span className="text-xs text-neutral-400">
                        Débito: <strong className="text-neutral-200">${parsedUsd.toFixed(2)} USD</strong>
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-neutral-500 text-sm">
                      MXN $
                    </span>
                    <input
                      type="number"
                      step="any"
                      min="1"
                      max={maxMxn}
                      value={amountMxn}
                      onChange={(e) => setAmountMxn(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-16 pr-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-base font-bold text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Percentage buttons */}
                  <div className="grid grid-cols-4 gap-2 pt-1">
                    {[
                      { label: '25%', val: 0.25 },
                      { label: '50%', val: 0.50 },
                      { label: '75%', val: 0.75 },
                      { label: '100% (Todo)', val: 1.00 },
                    ].map((btn) => (
                      <button
                        key={btn.label}
                        type="button"
                        onClick={() => handleSetPercentage(btn.val)}
                        className="py-1.5 rounded-lg bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-xs font-semibold text-neutral-300 transition-colors"
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>

                  {parsedMxn > maxMxn && (
                    <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                      <AlertCircle size={14} /> El monto excede tu saldo disponible (${maxMxn} MXN).
                    </p>
                  )}
                </div>

                {/* Concept / Reference */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-300">
                    Concepto de Transferencia SPEI
                  </label>
                  <input
                    type="text"
                    maxLength={40}
                    value={concept}
                    onChange={(e) => setConcept(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Continue button */}
                <div className="pt-2">
                  <button
                    type="button"
                    disabled={!canProceed}
                    onClick={handleNextToOtp}
                    className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 disabled:bg-neutral-800 disabled:text-neutral-500 disabled:cursor-not-allowed text-neutral-950 font-bold rounded-2xl text-sm transition-all shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Continuar a Autorización</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: 2FA OTP Security Confirmation */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                  <ShieldCheck size={24} className="text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs">
                    <h3 className="font-bold text-amber-300 text-sm">
                      Confirmación de Seguridad Bancaria (2FA)
                    </h3>
                    <p className="text-neutral-300">
                      Estás por retirar <strong className="text-amber-400">${parsedMxn.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</strong> (${parsedUsd.toFixed(2)} USD) hacia la cuenta CLABE <strong className="font-mono text-neutral-100">{targetClabe}</strong> ({clabeInfo.bankName}).
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-neutral-300">
                    Ingresa el Código Dinámico OTP de 6 dígitos:
                  </label>
                  
                  <input
                    type="text"
                    maxLength={6}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••"
                    className="w-full text-center text-2xl tracking-[0.5em] font-mono font-bold bg-neutral-950 border border-neutral-800 rounded-2xl py-3.5 text-amber-400 focus:outline-none focus:border-amber-500"
                  />

                  {otpError && (
                    <p className="text-xs text-rose-400 flex items-center gap-1">
                      <AlertCircle size={14} /> {otpError}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-neutral-400 pt-1">
                    <span>Código OTP de prueba generado: <strong className="text-amber-400 font-mono">{activeOtp}</strong></span>
                    <button
                      type="button"
                      disabled={otpCooldown > 0}
                      onClick={() => {
                        generateNewOtp();
                        setOtpCooldown(45);
                      }}
                      className="text-amber-400 hover:text-amber-300 disabled:text-neutral-600 font-medium underline"
                    >
                      {otpCooldown > 0 ? `Reenviar en ${otpCooldown}s` : 'Generar Nuevo OTP'}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-1/3 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-xs transition-colors"
                  >
                    Regresar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmWithdrawal}
                    className="w-2/3 py-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Lock size={14} />
                    <span>Autorizar Retiro con Mercado Pago</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Real-Time Processing Animation */}
            {step === 3 && (
              <div className="py-10 text-center space-y-5">
                <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
                  <Building2 size={32} className="text-amber-400 animate-pulse" />
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold text-neutral-100">
                    Procesando Retiro Interbancario...
                  </h3>
                  <p className="text-xs text-neutral-400 font-mono">
                    {processingStatusText}
                  </p>
                </div>

                <div className="max-w-md mx-auto p-4 rounded-2xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Monto a transferir:</span>
                    <strong className="text-amber-400 font-mono">${parsedMxn.toFixed(2)} MXN</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Cuenta Destino:</span>
                    <strong className="text-neutral-200 font-mono">••••{targetClabe.slice(-4)} ({clabeInfo.bankName})</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Canal de Liquidación:</span>
                    <span className="text-emerald-400 font-medium">SPEI Banco de México / Mercado Pago</span>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Success Screen with PDF and Print Options */}
            {step === 4 && withdrawResult && (
              <div className="space-y-6">
                <div className="p-5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 size={28} />
                  </div>
                  <h3 className="text-lg font-extrabold text-emerald-300">
                    ¡Retiro Liquidado Exitosamente!
                  </h3>
                  <p className="text-xs text-emerald-400/90 max-w-md mx-auto">
                    Los fondos han sido transmitidos a través del Sistema de Pagos Electrónicos Interbancarios (SPEI) hacia tu cuenta CLABE registrada.
                  </p>
                </div>

                {/* Operation Summary Box */}
                <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-800/80">
                    <span className="text-neutral-400">Importe Liquidado:</span>
                    <span className="text-lg font-bold text-amber-400 font-mono">
                      ${parsedMxn.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400">Débito en Cuenta USD:</span>
                    <span className="font-bold text-neutral-200 font-mono">-${parsedUsd.toFixed(2)} USD</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400">Banco Receptor:</span>
                    <span className="font-semibold text-neutral-200">{clabeInfo.bankName}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400">Cuenta CLABE:</span>
                    <span className="font-mono font-bold text-neutral-300 select-all">{targetClabe}</span>
                  </div>

                  {withdrawResult.mpPaymentId && (
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400">Folio Mercado Pago:</span>
                      <span className="font-mono text-neutral-300">{withdrawResult.mpPaymentId}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80">
                    <span className="text-neutral-400">Clave de Rastreo SPEI:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-emerald-400 text-[11px]">
                        {withdrawResult.trackingKey}
                      </span>
                      <button
                        onClick={() => copyToClipboard(withdrawResult.trackingKey)}
                        className="p-1 text-neutral-400 hover:text-neutral-200"
                        title="Copiar Clave"
                      >
                        {copiedKey ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* PDF & Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-1">
                  {withdrawResult.tx && (
                    <button
                      id="btn-download-withdraw-pdf"
                      onClick={() => generateTransactionPdf(withdrawResult.tx!)}
                      className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Download size={15} />
                      <span>Descargar Comprobante en PDF</span>
                    </button>
                  )}

                  {onViewReceipt && withdrawResult.tx && (
                    <button
                      onClick={() => {
                        onClose();
                        onViewReceipt(withdrawResult.tx!);
                      }}
                      className="py-3 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Printer size={15} />
                      <span>Ver Comprobante Imprimible</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      handleResetModal();
                      onClose();
                    }}
                    className="py-3 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold rounded-xl text-xs transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
