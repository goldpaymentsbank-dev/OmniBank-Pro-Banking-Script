'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  ArrowRight, 
  ShieldCheck, 
  Copy, 
  Check, 
  Lock, 
  AlertCircle, 
  CheckCircle2, 
  FileText, 
  X, 
  RotateCw, 
  ExternalLink,
  Info,
  DollarSign,
  Send,
  Download
} from 'lucide-react';
import { useBanking, TransactionItem } from '@/lib/bankingStore';
import { PLUS500_BENEFICIARY } from '@/lib/bankingValidation';
import { cn } from '@/lib/utils';

interface Plus500PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewReceipt: (tx: TransactionItem) => void;
}

export default function Plus500PaymentModal({
  isOpen,
  onClose,
  onViewReceipt,
}: Plus500PaymentModalProps) {
  const { 
    balance, 
    usdToMxnRate, 
    executePlus500Payment, 
    activeOtp, 
    generateNewOtp,
    verifyOtp 
  } = useBanking();

  const [amountMxn, setAmountMxn] = useState<string>('5000');
  const [otpInput, setOtpInput] = useState<string>(activeOtp);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [paymentSuccessTx, setPaymentSuccessTx] = useState<TransactionItem | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Conversion calculations
  const numAmountMxn = parseFloat(amountMxn) || 0;
  const numAmountUsd = numAmountMxn > 0 ? Number((numAmountMxn / usdToMxnRate).toFixed(2)) : 0;
  const maxAvailableMxn = Number((balance * usdToMxnRate).toFixed(2));

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handlePay = () => {
    setErrorMessage(null);

    if (numAmountMxn <= 0) {
      setErrorMessage('Por favor ingresa un importe en MXN válido mayor a cero.');
      return;
    }

    if (numAmountUsd > balance) {
      setErrorMessage(`Saldo insuficiente. Tienes $${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD disponibles ($${maxAvailableMxn.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN).`);
      return;
    }

    if (!verifyOtp(otpInput)) {
      setErrorMessage('El código de seguridad OTP ingresado no es válido.');
      return;
    }

    setIsProcessing(true);

    // Simulate realistic SWIFT ISO 20022 clearing
    setTimeout(() => {
      const result = executePlus500Payment({
        amountMxn: numAmountMxn,
        amountUsd: numAmountUsd,
      });

      setIsProcessing(false);

      if (result.success && result.tx) {
        setPaymentSuccessTx(result.tx);
      } else {
        setErrorMessage(result.error || 'Ocurrió un error al procesar el pago internacional.');
      }
    }, 900);
  };

  const resetModal = () => {
    setPaymentSuccessTx(null);
    setErrorMessage(null);
    setAmountMxn('5000');
    setOtpInput(activeOtp);
  };

  return (
    <AnimatePresence>
      <div 
        id="plus500-modal-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget && !isProcessing) {
            onClose();
          }
        }}
        role="dialog"
        aria-modal="true"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden my-4"
        >
          {/* Top Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <Building2 size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-neutral-100">
                    Orden de Pago Internacional (MXN)
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/10 border border-amber-400/20 text-amber-300">
                    Deutsche Bank AG
                  </span>
                </div>
                <p className="text-xs text-neutral-400">
                  Transferencia Directa a Beneficiario Plus500SEY Ltd
                </p>
              </div>
            </div>

            <button
              id="close-plus500-modal-btn"
              onClick={() => {
                if (!isProcessing) {
                  onClose();
                  if (paymentSuccessTx) resetModal();
                }
              }}
              className="p-2 rounded-xl text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
              aria-label="Cerrar modal"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 sm:p-8 space-y-6">
            {!paymentSuccessTx ? (
              <>
                {/* Beneficiary Details Section from Prompt Image */}
                <div className="bg-neutral-950/60 border border-neutral-800 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-emerald-400" />
                      Datos Oficiales del Beneficiario
                    </span>
                    <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                      Cuenta Verificada
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* Beneficiario */}
                    <div className="bg-neutral-900/80 p-3 rounded-xl border border-neutral-800/80">
                      <span className="text-neutral-400 text-[11px]">Beneficiario:</span>
                      <p className="font-bold text-neutral-100 text-sm mt-0.5">
                        {PLUS500_BENEFICIARY.beneficiaryName}
                      </p>
                    </div>

                    {/* Banco */}
                    <div className="bg-neutral-900/80 p-3 rounded-xl border border-neutral-800/80">
                      <span className="text-neutral-400 text-[11px]">Nombre del banco:</span>
                      <p className="font-bold text-neutral-100 text-sm mt-0.5">
                        {PLUS500_BENEFICIARY.bankName}
                      </p>
                    </div>

                    {/* Dirección del beneficiario */}
                    <div className="sm:col-span-2 bg-neutral-900/80 p-3 rounded-xl border border-neutral-800/80">
                      <span className="text-neutral-400 text-[11px]">Dirección del beneficiario:</span>
                      <p className="text-neutral-300 font-mono text-[11px] mt-0.5">
                        {PLUS500_BENEFICIARY.beneficiaryAddress}
                      </p>
                    </div>

                    {/* Dirección del banco */}
                    <div className="sm:col-span-2 bg-neutral-900/80 p-3 rounded-xl border border-neutral-800/80">
                      <span className="text-neutral-400 text-[11px]">Dirección del banco:</span>
                      <p className="text-neutral-300 font-mono text-[11px] mt-0.5">
                        {PLUS500_BENEFICIARY.bankAddress}
                      </p>
                    </div>

                    {/* Moneda y Cuenta */}
                    <div className="bg-neutral-900/80 p-3 rounded-xl border border-neutral-800/80">
                      <span className="text-neutral-400 text-[11px]">Moneda / No. de Cuenta:</span>
                      <p className="font-mono font-bold text-neutral-200 mt-0.5">
                        {PLUS500_BENEFICIARY.currency} • {PLUS500_BENEFICIARY.accountNumber}
                      </p>
                    </div>

                    {/* SWIFT / BIC */}
                    <div className="bg-neutral-900/80 p-3 rounded-xl border border-neutral-800/80 flex items-center justify-between">
                      <div>
                        <span className="text-neutral-400 text-[11px]">SWIFT / BIC:</span>
                        <p className="font-mono font-bold text-neutral-200 mt-0.5">
                          {PLUS500_BENEFICIARY.swiftBic}
                        </p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(PLUS500_BENEFICIARY.swiftBic, 'bic')}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-amber-400 hover:bg-neutral-800 transition-colors"
                        title="Copiar SWIFT/BIC"
                      >
                        {copiedField === 'bic' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      </button>
                    </div>

                    {/* IBAN */}
                    <div className="sm:col-span-2 bg-neutral-900/80 p-3 rounded-xl border border-neutral-800/80 flex items-center justify-between">
                      <div>
                        <span className="text-neutral-400 text-[11px]">IBAN Internacional:</span>
                        <p className="font-mono font-bold text-amber-400 text-sm mt-0.5 tracking-wide select-all">
                          {PLUS500_BENEFICIARY.ibanFormatted}
                        </p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(PLUS500_BENEFICIARY.iban, 'iban')}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-amber-400 hover:bg-neutral-800 transition-colors"
                        title="Copiar IBAN"
                      >
                        {copiedField === 'iban' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* High Priority Reference Box */}
                  <div className="bg-amber-500/10 border-2 border-amber-500/30 rounded-xl p-3.5 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold uppercase tracking-wider">
                        <AlertCircle size={14} />
                        <span>Referencia (Obligatorio)</span>
                      </div>
                      <p className="font-mono font-black text-amber-300 text-lg sm:text-xl tracking-widest mt-0.5 select-all">
                        {PLUS500_BENEFICIARY.reference}
                      </p>
                      <p className="text-[10px] text-neutral-400 mt-0.5">
                        Esta referencia identifica tu cuenta en Plus500SEY Ltd para acreditar el saldo.
                      </p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(PLUS500_BENEFICIARY.reference, 'ref')}
                      className="flex items-center gap-1 px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold transition-all border border-amber-500/30 shrink-0"
                    >
                      {copiedField === 'ref' ? (
                        <>
                          <Check size={14} className="text-emerald-400" />
                          <span className="text-emerald-400">Copiada</span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Amount to Pay in MXN */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <label htmlFor="amount-mxn-input" className="font-semibold text-neutral-300">
                      Importe a Pagar en Pesos Mexicanos (MXN):
                    </label>
                    <span className="text-neutral-400">
                      Saldo Disponible: <strong className="text-neutral-200 font-mono">${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD</strong> (~${maxAvailableMxn.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN)
                    </span>
                  </div>

                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-neutral-400">
                      $
                    </span>
                    <input
                      id="amount-mxn-input"
                      type="number"
                      min="100"
                      step="50"
                      value={amountMxn}
                      onChange={(e) => setAmountMxn(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-2xl py-3.5 pl-9 pr-24 text-xl sm:text-2xl font-mono font-bold text-neutral-100 focus:outline-none transition-colors"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400 bg-neutral-900 px-2.5 py-1 rounded-lg border border-neutral-800">
                      MXN
                    </span>
                  </div>

                  {/* Preset Amount Chips */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-[11px] text-neutral-400">Preestablecidos:</span>
                    {[1000, 2500, 5000, 10000, 25000, 50000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setAmountMxn(amt.toString())}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all border",
                          numAmountMxn === amt
                            ? "bg-amber-500/20 border-amber-500 text-amber-300"
                            : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
                        )}
                      >
                        ${amt.toLocaleString('es-MX')} MXN
                      </button>
                    ))}
                  </div>

                  {/* Converted USD equivalent banner */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-950/80 border border-neutral-800 text-xs">
                    <span className="text-neutral-400">
                      Débito equivalente en cuenta USD (T.C. 1 USD = {usdToMxnRate} MXN):
                    </span>
                    <span className="font-mono font-bold text-amber-400 text-sm">
                      ${numAmountUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                    </span>
                  </div>
                </div>

                {/* 2FA Security Token */}
                <div className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-neutral-300 flex items-center gap-1.5">
                      <Lock size={14} className="text-amber-400" />
                      Token de Seguridad 2FA / OTP
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const newCode = generateNewOtp();
                        setOtpInput(newCode);
                      }}
                      className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-mono"
                    >
                      <RotateCw size={12} />
                      Regenerar Código
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <input
                      id="plus500-otp-input"
                      type="text"
                      maxLength={6}
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="6 dígitos"
                      className="w-full bg-neutral-900 border border-neutral-800 focus:border-amber-500 rounded-xl px-4 py-2.5 font-mono text-center tracking-widest text-lg font-bold text-neutral-100 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setOtpInput(activeOtp)}
                      className="px-3 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold whitespace-nowrap transition-colors border border-neutral-700"
                    >
                      Autollenar ({activeOtp})
                    </button>
                  </div>
                </div>

                {/* Error Banner */}
                {errorMessage && (
                  <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2.5 text-red-400 text-xs">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Pay Action Button */}
                <div className="pt-2">
                  <button
                    id="execute-plus500-pay-btn"
                    onClick={handlePay}
                    disabled={isProcessing || numAmountMxn <= 0}
                    className={cn(
                      "w-full py-4 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-lg",
                      isProcessing || numAmountMxn <= 0
                        ? "bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700"
                        : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 shadow-amber-500/20 active:scale-[0.99]"
                    )}
                  >
                    {isProcessing ? (
                      <>
                        <RotateCw size={18} className="animate-spin" />
                        <span>Liquidando Orden en Deutsche Bank AG...</span>
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        <span>
                          Pagar ${numAmountMxn.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN (~${numAmountUsd.toFixed(2)} USD)
                        </span>
                      </>
                    )}
                  </button>
                  <p className="text-[11px] text-center text-neutral-400 mt-2">
                    Operación protegida bajo certificación bancaria ISO 20022 y Deutsche Bank AG Clearing.
                  </p>
                </div>
              </>
            ) : (
              /* Success Confirmation Screen */
              <div className="text-center py-4 space-y-6">
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center shadow-xl shadow-emerald-500/10">
                  <CheckCircle2 size={36} />
                </div>

                <div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Liquidación Exitosa
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-neutral-100 tracking-tight mt-2">
                    ¡Pago a Plus500SEY Ltd Emitido!
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1">
                    La transferencia internacional hacia Deutsche Bank AG ha sido procesada con éxito.
                  </p>
                </div>

                {/* Receipt Card Summary */}
                <div className="bg-neutral-950/80 border border-neutral-800 rounded-2xl p-5 text-left text-xs space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
                    <span className="text-neutral-400">Importe Liquidado (MXN):</span>
                    <span className="font-mono font-bold text-emerald-400 text-base">
                      ${paymentSuccessTx.destinationAmount?.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400">Cargo en Cuenta (USD):</span>
                    <span className="font-mono font-semibold text-neutral-200">
                      ${paymentSuccessTx.amount.toFixed(2)} USD
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400">Beneficiario:</span>
                    <span className="font-semibold text-neutral-200">
                      {PLUS500_BENEFICIARY.beneficiaryName}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400">Banco Receptor:</span>
                    <span className="font-semibold text-neutral-200">
                      {PLUS500_BENEFICIARY.bankName} (Frankfurt, DE)
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400">IBAN:</span>
                    <span className="font-mono text-amber-400 font-bold">
                      {PLUS500_BENEFICIARY.ibanFormatted}
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                    <span className="text-amber-400 font-bold">Referencia Asignada:</span>
                    <span className="font-mono font-black text-amber-300 tracking-wider">
                      {paymentSuccessTx.reference || PLUS500_BENEFICIARY.reference}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-1">
                    <span className="text-neutral-400">Clave de Rastreo SWIFT:</span>
                    <span className="font-mono text-xs text-neutral-300">
                      {paymentSuccessTx.trackingKey}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    id="view-official-receipt-btn"
                    onClick={() => {
                      onViewReceipt(paymentSuccessTx);
                      onClose();
                    }}
                    className="flex-1 py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-amber-500 hover:bg-amber-400 text-neutral-950 flex items-center justify-center gap-2 transition-all"
                  >
                    <FileText size={16} />
                    <span>Ver Comprobante Oficial Imprimible</span>
                  </button>

                  <button
                    onClick={() => resetModal()}
                    className="py-3.5 px-4 rounded-xl font-semibold text-xs sm:text-sm bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors"
                  >
                    Realizar Otro Pago
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
