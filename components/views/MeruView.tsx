'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Copy, 
  Check, 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Zap, 
  Printer, 
  X, 
  ExternalLink,
  Lock
} from 'lucide-react';
import { useBanking, TransactionItem } from '@/lib/bankingStore';
import { MERU_ORDER_INFO } from '@/lib/bankingValidation';
import TransactionReceiptModal from '@/components/TransactionReceiptModal';

interface MeruViewProps {
  onBack: () => void;
  onNavigate?: (view: any) => void;
}

export default function MeruView({ onBack, onNavigate }: MeruViewProps) {
  const { balance, sendTransfer, transactions } = useBanking();
  
  const [copiedClabe, setCopiedClabe] = useState(false);
  const [supportFile, setSupportFile] = useState<{
    name: string;
    size: string;
    dataUrl?: string;
    isGeneratedCep?: boolean;
    tx?: TransactionItem;
  } | null>(null);

  const [isPayingWithGold, setIsPayingWithGold] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [receiptTx, setReceiptTx] = useState<TransactionItem | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedClabe(true);
    setTimeout(() => setCopiedClabe(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    setErrorMessage('');
    const reader = new FileReader();
    reader.onload = () => {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      const sizeKb = Math.round(file.size / 1024);
      setSupportFile({
        name: file.name,
        size: file.size > 1024 * 1024 ? `${sizeMb} MB` : `${sizeKb} KB`,
        dataUrl: reader.result as string,
        isGeneratedCep: false,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Pay directly from Gold Payments Bank balance via SPEI to Koywe / NVIO
  const handlePayFromGoldPayments = () => {
    setErrorMessage('');
    setIsPayingWithGold(true);

    // 1,720.00 MXN is approx $86.00 USD at typical FX rate of 20 MXN/USD
    // Or we debit $86.00 USD directly to match balance
    const equivalentUsd = 86.00;

    if (balance < equivalentUsd) {
      setErrorMessage(`Saldo insuficiente en Gold Payments Bank ($${balance.toFixed(2)} USD disponible, se requieren $${equivalentUsd.toFixed(2)} USD para cubrir 1,720.00 MXN).`);
      setIsPayingWithGold(false);
      return;
    }

    // Execute transfer
    const res = sendTransfer({
      type: 'spei',
      recipient: `${MERU_ORDER_INFO.beneficiary} (NVIO / Meru)`,
      amount: equivalentUsd,
      fee: 0,
      title: `Depósito a Meru: ${MERU_ORDER_INFO.amountFormatted}`,
      clabe: MERU_ORDER_INFO.clabe,
    });

    if (res.success) {
      // Find the transaction we just created
      const latestTx: TransactionItem = {
        id: 'tx-meru-' + Date.now(),
        type: 'sent',
        category: 'spei',
        title: `Depósito a Meru: ${MERU_ORDER_INFO.amountFormatted}`,
        recipientOrSender: `${MERU_ORDER_INFO.beneficiary} (NVIO)`,
        date: 'Hoy, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now(),
        amount: equivalentUsd,
        fee: 0,
        currency: 'USD',
        status: 'completed',
        trackingKey: res.trackingKey,
        clabe: MERU_ORDER_INFO.clabe,
      };

      setSupportFile({
        name: `CEP_Banxico_${res.trackingKey}.pdf`,
        size: '142 KB (Oficial SPEI)',
        isGeneratedCep: true,
        tx: latestTx,
      });
      setReceiptTx(latestTx);
    } else {
      setErrorMessage(res.error || 'No se pudo procesar la transferencia SPEI.');
    }
    setIsPayingWithGold(false);
  };

  const handleConfirmAndSend = () => {
    if (!supportFile) {
      setErrorMessage('Por favor agrega el soporte de la transferencia antes de confirmar.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccessModalOpen(true);
    }, 900);
  };

  return (
    <div className="max-w-xl mx-auto pb-12 pt-2 px-3 sm:px-4 text-neutral-100 font-sans">
      {/* Mobile-styled Header */}
      <div className="flex items-center justify-between py-3 mb-3 border-b border-neutral-800/80">
        <button
          onClick={onBack}
          id="btn-meru-back"
          className="p-2 rounded-full hover:bg-neutral-800 text-neutral-200 transition-colors"
          title="Regresar"
        >
          <ArrowLeft size={22} />
        </button>
        <div className="text-center">
          <p className="text-xs text-amber-400 font-semibold tracking-wide uppercase">Orden de Depósito SPEI</p>
          <p className="text-sm font-bold text-neutral-200">Meru & Koywe</p>
        </div>
        <div className="w-9" /> {/* Spacer for balance */}
      </div>

      {/* Card: Beneficiary, Bank & Amount (Faithful to screenshot) */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#15171c] border border-neutral-800/90 rounded-2xl p-5 mb-5 shadow-lg"
      >
        <div className="flex items-start justify-between gap-3">
          {/* Mexican Flag Badge */}
          <div className="w-10 h-10 rounded-full overflow-hidden bg-neutral-800 flex items-center justify-center shadow-inner shrink-0 border border-neutral-700">
            {/* SVG Mexican Flag */}
            <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
              <path fill="#006847" d="M0 0h213.3v480H0z"/>
              <path fill="#fff" d="M213.3 0h213.4v480H213.3z"/>
              <path fill="#ce1126" d="M426.7 0H640v480H426.7z"/>
              <circle cx="320" cy="240" r="45" fill="#a0522d" opacity="0.8"/>
            </svg>
          </div>

          {/* Amount: 1.720,00 MXN */}
          <div className="text-right">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono">
              1.720,00 <span className="text-xl sm:text-2xl font-semibold">MXN</span>
            </h1>
            <span className="text-[11px] text-amber-400 font-medium tracking-wide">
              Monto exacto requerido
            </span>
          </div>
        </div>

        {/* Beneficiary Details */}
        <div className="mt-4 pt-3 border-t border-neutral-800/70 space-y-1.5">
          <div>
            <p className="text-xs text-neutral-400 font-medium">Titular / Razón Social</p>
            <p className="text-base sm:text-lg font-bold text-neutral-100 tracking-wide">
              KOYWE S de RL de CV
            </p>
          </div>

          <div className="flex items-center justify-between bg-neutral-900/90 p-2.5 rounded-xl border border-neutral-800">
            <div>
              <p className="text-[11px] text-neutral-400 font-medium">CLABE Interbancaria (18 dígitos)</p>
              <p className="font-mono text-base font-bold text-amber-400 tracking-wider">
                710969000021584949
              </p>
            </div>
            <button
              onClick={() => copyToClipboard('710969000021584949')}
              id="btn-copy-koywe-clabe"
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              {copiedClabe ? (
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

          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-neutral-400">Institución Receptora:</span>
            <span className="font-bold text-neutral-200 tracking-wider bg-neutral-800/80 px-2 py-0.5 rounded">
              NVIO (710 - Pagos México IFPE)
            </span>
          </div>
        </div>
      </motion.div>

      {/* Fast Option: Pay with Gold Payments Bank */}
      <div className="mb-5 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-neutral-950 flex items-center justify-center font-bold shrink-0 shadow-md">
            <Zap size={18} />
          </div>
          <div>
            <p className="text-xs font-bold text-amber-300">¿Pagar directo desde Gold Payments?</p>
            <p className="text-[11px] text-neutral-300">
              Debita 1,720.00 MXN (~$86.00 USD) y adjunta el comprobante CEP oficial al instante.
            </p>
          </div>
        </div>
        <button
          onClick={handlePayFromGoldPayments}
          disabled={isPayingWithGold}
          id="btn-pay-meru-gold"
          className="w-full sm:w-auto shrink-0 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-xs transition-colors shadow-sm disabled:opacity-50"
        >
          {isPayingWithGold ? 'Procesando SPEI...' : 'Pagar y Adjuntar'}
        </button>
      </div>

      {/* Support Upload Box (Faithful White dashed box from screenshot) */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*,.pdf" 
        className="hidden" 
        id="meru-support-file-input"
      />

      <motion.div
        whileHover={{ scale: 1.008 }}
        whileTap={{ scale: 0.995 }}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`relative w-full rounded-3xl p-8 mb-6 cursor-pointer transition-all duration-200 text-center select-none ${
          supportFile 
            ? 'bg-neutral-900 border-2 border-dashed border-emerald-500/80 text-white' 
            : dragOver 
              ? 'bg-neutral-100 border-2 border-dashed border-amber-600 shadow-xl' 
              : 'bg-white border-2 border-dashed border-neutral-400 text-neutral-900 shadow-lg'
        }`}
        id="box-upload-meru-support"
      >
        {supportFile ? (
          <div className="flex flex-col items-center justify-center space-y-2.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 size={28} />
            </div>
            <div>
              <p className="font-bold text-sm text-neutral-100">{supportFile.name}</p>
              <p className="text-xs text-neutral-400">{supportFile.size} • Soporte cargado</p>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full font-semibold">
                Listo para enviar
              </span>
              {supportFile.tx && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setReceiptTx(supportFile.tx || null);
                  }}
                  className="text-xs bg-neutral-800 text-neutral-200 hover:bg-neutral-700 px-3 py-1 rounded-full font-medium flex items-center gap-1"
                >
                  <FileText size={12} />
                  Ver Comprobante
                </button>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSupportFile(null);
                }}
                className="p-1 rounded-full text-neutral-400 hover:text-red-400"
                title="Eliminar soporte"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6">
            <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 mb-3">
              <UploadCloud size={24} />
            </div>
            <p className="text-base sm:text-lg font-medium text-neutral-800">
              Agrega el soporte de la transferencia
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              Haz clic o arrastra un archivo PNG, JPG o PDF de tu recibo
            </p>
          </div>
        )}
      </motion.div>

      {/* Error display */}
      {errorMessage && (
        <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 3 Guidelines Checklist (Faithful text & green icons from screenshot) */}
      <div className="space-y-4 mb-8 px-1">
        {MERU_ORDER_INFO.instructions.map((instruction, idx) => (
          <div key={idx} className="flex items-start gap-3 text-left">
            <div className="w-5 h-5 rounded-full border border-emerald-500 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
              <Check size={12} strokeWidth={3} />
            </div>
            <p className="text-xs sm:text-[13px] text-neutral-300 leading-relaxed">
              {instruction}
            </p>
          </div>
        ))}
      </div>

      {/* Sticky Bottom Action Button */}
      <div className="pt-2">
        <button
          onClick={handleConfirmAndSend}
          disabled={isSubmitting}
          id="btn-confirm-and-send-meru"
          className="w-full py-3.5 px-6 rounded-2xl bg-neutral-900 border border-neutral-700 hover:border-amber-500 hover:bg-neutral-800 text-white font-bold text-sm sm:text-base tracking-wide transition-all duration-200 shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              <span>Enviando a Meru...</span>
            </>
          ) : (
            <span>Confirmar y enviar</span>
          )}
        </button>
      </div>

      {/* Success Confirmation Modal */}
      <AnimatePresence>
        {isSuccessModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl text-center space-y-4"
            >
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 size={36} />
              </div>

              <div>
                <h3 className="text-xl font-bold text-neutral-100">¡Soporte Enviado a Meru!</h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Tu orden por <span className="text-amber-400 font-semibold font-mono">1.720,00 MXN</span> a <span className="text-neutral-200 font-semibold">KOYWE S de RL de CV</span> ha sido registrada para validación.
                </p>
              </div>

              <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800/80 text-left space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-neutral-400">ID de Solicitud:</span>
                  <span className="font-mono text-amber-400 font-semibold">{MERU_ORDER_INFO.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Institución:</span>
                  <span className="text-neutral-200 font-semibold">NVIO (710 Pagos México)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">CLABE:</span>
                  <span className="font-mono text-neutral-200">710969000021584949</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Soporte Adjunto:</span>
                  <span className="text-emerald-400 font-medium truncate max-w-[180px]">{supportFile?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Tiempo de Acreditación:</span>
                  <span className="text-neutral-200 font-medium">Máximo 1 día hábil</span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                {receiptTx && (
                  <button
                    onClick={() => setReceiptTx(receiptTx)}
                    className="w-full py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
                  >
                    <FileText size={15} />
                    <span>Ver Comprobante SPEI Oficial</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setIsSuccessModalOpen(false);
                    onBack();
                  }}
                  className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-sm transition-colors"
                >
                  Volver al Panel Principal
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Official Transaction Receipt Modal if user wants to print/view */}
      {receiptTx && (
        <TransactionReceiptModal
          transaction={receiptTx}
          onClose={() => setReceiptTx(null)}
        />
      )}
    </div>
  );
}
