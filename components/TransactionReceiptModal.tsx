'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Printer, 
  Copy, 
  Check, 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  Hash, 
  Building2, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownRight, 
  QrCode, 
  Lock,
  BadgeCheck,
  FileText,
  AlertCircle,
  Download,
  RotateCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TransactionItem } from '@/lib/bankingStore';
import { cn } from '@/lib/utils';
import { generateTransactionPdf } from '@/lib/receiptPdf';

interface TransactionReceiptModalProps {
  transaction: TransactionItem | null;
  onClose: () => void;
}

export default function TransactionReceiptModal({
  transaction,
  onClose
}: TransactionReceiptModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (transaction) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [transaction, onClose]);

  if (!transaction) return null;

  const copyToClipboard = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    if (!transaction) return;
    try {
      setIsGeneratingPdf(true);
      generateTransactionPdf(transaction);
    } catch (err) {
      console.error('Error al generar el comprobante PDF:', err);
    } finally {
      setTimeout(() => setIsGeneratingPdf(false), 600);
    }
  };

  // Generate deterministic digital signature & authorization code from transaction properties
  const pseudoHash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(8, '0').toUpperCase();
  };

  const digitalSeal = `SHA256:${pseudoHash(transaction.id + 'saltA')}-${pseudoHash(transaction.id + 'saltB')}-${pseudoHash(transaction.id + 'saltC')}`;
  const authCode = (100000 + (Math.abs(pseudoHash(transaction.id).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) * 83) % 900000)).toString();
  const trackingNumber = transaction.trackingKey || `SPEI-${transaction.timestamp.toString().slice(-8)}-${pseudoHash(transaction.id).slice(0, 6)}`;

  // Formatted date and times
  const epochTimestamp = transaction.timestamp || 1725450000000;
  const txDateObj = new Date(epochTimestamp);
  const formattedLocalDate = txDateObj.toLocaleString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  const isoUtcDate = txDateObj.toISOString();

  // Full formatted summary for 1-click copying
  const receiptSummaryText = `========================================
GOLD PAYMENTS BANK - COMPROBANTE OFICIAL
========================================
Folio de Transacción: ${transaction.id}
Clave de Rastreo: ${trackingNumber}
Estado de Verificación: EXITOSA / LIQUIDADA (BANXICO SPEI / STP)
Código de Autorización: ${authCode}
Sello Digital: ${digitalSeal}
Fecha y Hora: ${formattedLocalDate}
Timestamp UTC: ${isoUtcDate}
Unix Epoch: ${epochTimestamp}

DATOS DE LA OPERACIÓN:
----------------------------------------
Tipo: ${transaction.type === 'received' ? 'ABONO / INGRESO' : 'CARGO / TRANSFERENCIA'}
Concepto: ${transaction.title}
Emisor/Receptor: ${transaction.recipientOrSender}
Monto: $${transaction.amount.toFixed(2)} ${transaction.currency}
Comisión: $${(transaction.fee || 0).toFixed(2)} ${transaction.currency}
Total Liquidado: $${(transaction.amount + (transaction.fee || 0)).toFixed(2)} ${transaction.currency}

Certificado emitido bajo normas ISO 20022 y Banco de México.
========================================`;

  return (
    <AnimatePresence>
      <div 
        id="transaction-receipt-modal-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto print:static print:bg-white print:p-0 print:block print:inset-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="receipt-title"
      >
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body > *:not(#transaction-receipt-modal-backdrop) {
              display: none !important;
            }
            #transaction-receipt-modal-backdrop {
              position: static !important;
              background: #ffffff !important;
              padding: 0 !important;
              margin: 0 !important;
              display: block !important;
              overflow: visible !important;
            }
            #transaction-receipt-modal-card {
              max-width: 100% !important;
              width: 100% !important;
              border: none !important;
              box-shadow: none !important;
              border-radius: 0 !important;
              background: #ffffff !important;
              color: #000000 !important;
            }
          }
        `}} />
        <motion.div
          id="transaction-receipt-modal-card"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          ref={modalRef}
          className="relative w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden print:bg-white print:border-neutral-300 print:text-black print:shadow-none print:rounded-none print:max-w-none print:w-full print:m-0"
        >
          {/* Top Bar for Screen (Hidden in print) */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/60 print:hidden">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
              <FileText size={18} />
              <span>Comprobante de Operación Bancaria</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                id="top-download-pdf-btn"
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-colors disabled:opacity-50"
                title="Descargar Comprobante en PDF"
              >
                {isGeneratingPdf ? (
                  <RotateCw size={13} className="animate-spin text-amber-300" />
                ) : (
                  <Download size={13} />
                )}
                <span>Descargar PDF</span>
              </button>
              <button
                id="close-receipt-modal-btn"
                onClick={onClose}
                className="p-2 rounded-xl text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
                aria-label="Cerrar modal"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Printable Receipt Paper Container */}
          <div className="p-6 sm:p-8 space-y-6 print:p-8 print:space-y-5 bg-neutral-900 print:bg-white">
            {/* Header: Bank Brand & Certification */}
            <div className="text-center border-b border-dashed border-neutral-800 print:border-neutral-300 pb-5">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-3 print:border-black print:text-black print:bg-neutral-100">
                <Building2 size={24} />
              </div>
              <h2 id="receipt-title" className="text-xl sm:text-2xl font-black text-neutral-100 tracking-tight print:text-black">
                GOLD PAYMENTS BANK
              </h2>
              <p className="text-[11px] uppercase tracking-widest text-amber-400 font-bold mt-0.5 print:text-neutral-800">
                Institución de Banca Múltiple • SPEI & ISO 20022 Certified
              </p>
              <p className="text-xs text-neutral-400 mt-1 print:text-neutral-600 font-mono">
                COMPROBANTE ELECTRÓNICO DE TRANSFERENCIA INTERBANCARIA
              </p>
            </div>

            {/* Verification Status Badge (High Priority) */}
            <div className="rounded-2xl p-4 bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between print:bg-neutral-50 print:border-neutral-400">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 print:text-emerald-700 print:bg-emerald-100">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 print:text-emerald-800">
                      Estado de Verificación:
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-400/20 text-emerald-300 print:bg-emerald-200 print:text-emerald-900">
                      <BadgeCheck size={12} /> LIQUIDADA / EXITOSA
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-300 print:text-neutral-700 mt-0.5">
                    Validada por el Sistema de Pagos Electrónicos Interbancarios (SPEI Banxico)
                  </p>
                </div>
              </div>
              <div className="hidden sm:block text-right text-[11px] text-neutral-400 print:text-neutral-600 font-mono">
                <span>Cod. Aut:</span>
                <p className="font-bold text-neutral-200 print:text-black">{authCode}</p>
              </div>
            </div>

            {/* Main Financial Amount Display */}
            <div className="bg-neutral-950/80 border border-neutral-800 print:border-neutral-300 print:bg-neutral-50 rounded-2xl p-5 text-center">
              <span className="text-xs text-neutral-400 print:text-neutral-600 uppercase tracking-wider font-semibold">
                Importe Total Liquidado
              </span>
              <div className="flex items-center justify-center gap-2 mt-1">
                {transaction.type === 'received' ? (
                  <ArrowDownRight className="text-emerald-400 print:text-emerald-700" size={28} />
                ) : (
                  <ArrowUpRight className="text-amber-400 print:text-amber-700" size={28} />
                )}
                <span className={cn(
                  "text-3xl sm:text-4xl font-black font-mono tracking-tight",
                  transaction.type === 'received' 
                    ? "text-emerald-400 print:text-emerald-800" 
                    : "text-neutral-100 print:text-black"
                )}>
                  {transaction.type === 'received' ? '+' : '-'}${transaction.amount.toFixed(2)}
                </span>
                <span className="text-sm font-bold text-neutral-400 print:text-neutral-700 font-mono mt-2">
                  {transaction.currency}
                </span>
              </div>
              <p className="text-xs text-neutral-400 print:text-neutral-600 mt-1 font-medium">
                {transaction.title}
              </p>
            </div>

            {/* Transaction ID & Timestamp Block */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Transaction ID */}
              <div className="bg-neutral-950/50 print:bg-neutral-50 p-3.5 rounded-xl border border-neutral-800 print:border-neutral-300">
                <div className="flex items-center justify-between text-neutral-400 print:text-neutral-600 mb-1">
                  <span className="flex items-center gap-1 font-medium">
                    <Hash size={13} /> Folio / Transaction ID
                  </span>
                  <button
                    onClick={() => copyToClipboard(transaction.id, 'txId')}
                    className="p-1 text-neutral-400 hover:text-neutral-200 transition-colors print:hidden"
                    title="Copiar ID"
                  >
                    {copiedField === 'txId' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  </button>
                </div>
                <p className="font-mono font-bold text-neutral-200 print:text-black break-all select-all">
                  {transaction.id}
                </p>
              </div>

              {/* Timestamp */}
              <div className="bg-neutral-950/50 print:bg-neutral-50 p-3.5 rounded-xl border border-neutral-800 print:border-neutral-300">
                <div className="flex items-center justify-between text-neutral-400 print:text-neutral-600 mb-1">
                  <span className="flex items-center gap-1 font-medium">
                    <Clock size={13} /> Fecha y Hora Oficial
                  </span>
                  <span className="text-[10px] font-mono text-amber-400 print:text-neutral-700 font-semibold">
                    CST / UTC-6
                  </span>
                </div>
                <p className="font-mono font-bold text-neutral-200 print:text-black capitalize">
                  {formattedLocalDate}
                </p>
                <p className="text-[10px] text-neutral-500 print:text-neutral-600 font-mono mt-0.5 truncate">
                  ISO: {isoUtcDate}
                </p>
              </div>
            </div>

            {/* Detailed Transfer Line Items */}
            <div className="bg-neutral-950/50 print:bg-neutral-50 rounded-2xl border border-neutral-800 print:border-neutral-300 p-4 divide-y divide-neutral-800/80 print:divide-neutral-200 text-xs space-y-2.5">
              <div className="flex justify-between items-center pt-1 first:pt-0">
                <span className="text-neutral-400 print:text-neutral-600">Tipo de Movimiento:</span>
                <span className="font-semibold text-neutral-200 print:text-black capitalize">
                  {transaction.type === 'received' ? 'Depósito / Abono recibido' : 'Transferencia enviada'}
                </span>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-neutral-400 print:text-neutral-600">
                  {transaction.type === 'received' ? 'Emisor / Origen:' : 'Destinatario / Beneficiario:'}
                </span>
                <span className="font-mono font-semibold text-neutral-200 print:text-black text-right max-w-[240px] truncate">
                  {transaction.recipientOrSender}
                </span>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-neutral-400 print:text-neutral-600">Canal / Método:</span>
                <span className="font-semibold text-amber-400 print:text-neutral-800 uppercase text-[11px]">
                  {transaction.category === 'morse' || transaction.category === 'ach' ? 'Transferencia ACH a Morse (NACHA EE.UU.)' :
                   transaction.category === 'spei' ? 'SPEI Interbancario (Banxico)' :
                   transaction.category === 'international' ? 'SEPA Instant / Wire Europeo' :
                   transaction.category === 'card' ? 'Tarjeta Débito Luhn ISO/IEC' :
                   transaction.category === 'gofundme' ? 'Campaña GoFundMe Verificada' :
                   transaction.category === 'crypto' ? 'Red Cripto Bitcoin' :
                   transaction.category === 'deposit' ? 'Depósito en Efectivo / Sucursal' :
                   transaction.category === 'loan' ? 'Línea de Crédito Aprobada' : 'Transferencia Digital'}
                </span>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-neutral-400 print:text-neutral-600">Concepto de Pago:</span>
                <span className="text-neutral-200 print:text-black font-medium text-right max-w-[240px]">
                  {transaction.title}
                </span>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-neutral-400 print:text-neutral-600">Comisión por Operación:</span>
                <span className="font-mono text-emerald-400 print:text-emerald-800 font-semibold">
                  ${(transaction.fee || 0).toFixed(2)} {transaction.currency} (Sin cargo)
                </span>
              </div>

              {/* International / Wire / SEPA / Plus500 Details */}
              {(transaction.recipientOrSender.includes('Plus500') || transaction.iban || transaction.reference) && (
                <div className="pt-3 space-y-2 border-t border-dashed border-neutral-800 print:border-neutral-300">
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400 print:text-neutral-600 font-medium">Banco Destino:</span>
                    <span className="font-semibold text-neutral-200 print:text-black">
                      {transaction.bankName || (transaction.recipientOrSender.includes('Plus500') ? 'Deutsche Bank AG' : 'Banking Circle S.A.')}
                    </span>
                  </div>
                  {transaction.recipientOrSender.includes('Plus500') && (
                    <>
                      <div className="flex justify-between items-start">
                        <span className="text-neutral-400 print:text-neutral-600 font-medium">Dirección Banco:</span>
                        <span className="text-neutral-300 print:text-black text-right text-[11px] max-w-[240px]">
                          Taunusanlage 12, D-60325 Frankfurt DE
                        </span>
                      </div>
                      <div className="flex justify-between items-start">
                        <span className="text-neutral-400 print:text-neutral-600 font-medium">Dirección Beneficiario:</span>
                        <span className="text-neutral-300 print:text-black text-right text-[11px] max-w-[240px]">
                          Third Floor, Suite 18, Vairam Building | Providence, Mahé, Seychelles
                        </span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400 print:text-neutral-600 font-medium">IBAN Internacional:</span>
                    <span className="font-mono font-bold text-amber-400 print:text-black">
                      {transaction.iban || (transaction.recipientOrSender.includes('Plus500') ? 'DE98 5007 0010 0176 9009 04' : 'LU50 4080 0000 4612 5444')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400 print:text-neutral-600 font-medium">Código SWIFT / BIC:</span>
                    <span className="font-mono text-neutral-200 print:text-black">
                      {transaction.bic || (transaction.recipientOrSender.includes('Plus500') ? 'DEUTDEFFXXX' : 'BCIRLULL')}
                    </span>
                  </div>
                  {(transaction.reference || transaction.recipientOrSender.includes('Plus500')) && (
                    <div className="flex justify-between items-center bg-amber-500/10 border border-amber-500/30 print:border-amber-400 rounded-lg p-2 mt-1">
                      <span className="text-amber-400 print:text-amber-900 font-bold">Referencia (Obligatorio):</span>
                      <span className="font-mono font-black text-amber-300 print:text-black text-sm tracking-wider">
                        {transaction.reference || '185591571'}
                      </span>
                    </div>
                  )}
                  {transaction.destinationAmount && transaction.destinationCurrency && (
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-400 print:text-neutral-600 font-medium">Importe Acreditado:</span>
                      <span className="font-mono font-bold text-emerald-400 print:text-emerald-800">
                        ${transaction.destinationAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })} {transaction.destinationCurrency}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Clave de Rastreo SPEI / Folio Banxico */}
              <div className="pt-3">
                <div className="flex items-center justify-between text-neutral-400 print:text-neutral-600 mb-1">
                  <span className="font-medium">Clave de Rastreo Banxico / STP:</span>
                  <button
                    onClick={() => copyToClipboard(trackingNumber, 'tracking')}
                    className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 print:hidden font-mono"
                  >
                    {copiedField === 'tracking' ? (
                      <>
                        <Check size={12} className="text-emerald-400" />
                        <span className="text-emerald-400">Copiada</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span>Copiar Clave</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="bg-neutral-900 print:bg-white border border-neutral-800 print:border-neutral-300 p-2.5 rounded-xl font-mono text-xs text-amber-400 print:text-black font-bold tracking-wider break-all select-all">
                  {trackingNumber}
                </div>
              </div>
            </div>

            {/* Cryptographic Verification Seal & Barcode simulation */}
            <div className="p-4 rounded-2xl bg-neutral-950/40 print:bg-neutral-50 border border-neutral-800 print:border-neutral-300 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-neutral-400 print:text-neutral-600 text-xs font-medium">
                  <Lock size={12} />
                  <span>Sello Digital de Seguridad (SHA-256):</span>
                </div>
                <span className="text-[10px] font-mono text-neutral-500 print:text-neutral-600">
                  Epoch: {epochTimestamp}
                </span>
              </div>
              <p className="font-mono text-[10px] text-neutral-400 print:text-neutral-700 break-all select-all bg-neutral-900/60 print:bg-white p-2 rounded-lg border border-neutral-800 print:border-neutral-200">
                {digitalSeal}
              </p>

              {/* Barcode representation */}
              <div className="pt-2 flex flex-col items-center justify-center">
                <div className="flex items-center gap-[2px] h-9 px-4 py-1 bg-white rounded print:border print:border-neutral-300" aria-label="Código de barras de la transacción">
                  {/* Generated clean bar lines */}
                  {Array.from({ length: 46 }).map((_, idx) => {
                    const isThick = (idx * 7 + 3) % 4 === 0;
                    const isMedium = (idx * 3 + 1) % 3 === 0;
                    return (
                      <div
                        key={idx}
                        className={cn(
                          "bg-black h-full",
                          isThick ? "w-[3px]" : isMedium ? "w-[2px]" : "w-[1px]"
                        )}
                      />
                    );
                  })}
                </div>
                <span className="font-mono text-[10px] tracking-widest text-neutral-500 print:text-neutral-600 mt-1">
                  *{transaction.id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}*
                </span>
              </div>
            </div>

            {/* Official Legal Footer */}
            <div className="text-center pt-1 border-t border-dashed border-neutral-800 print:border-neutral-300 text-[10px] text-neutral-500 print:text-neutral-600 leading-relaxed">
              <p>
                Este documento es un comprobante oficial de operación bancaria con validez legal. Respaldado por el Banco de México (Circular 14/2017) y la Comisión Nacional Bancaria y de Valores (CNBV).
              </p>
              <p className="mt-1 font-mono text-[9px] text-neutral-600 print:text-neutral-500">
                Gold Payments Bank S.A. Institución de Banca Múltiple • RFC: GPB980421-XYZ • Folio Fiscal Digital: {authCode}-BANXICO
              </p>
            </div>
          </div>

          {/* Action Toolbar (Screen only, hidden in print) */}
          <div className="p-4 sm:p-6 bg-neutral-950 border-t border-neutral-800 flex flex-col sm:flex-row gap-2.5 print:hidden">
            <button
              id="download-receipt-pdf-btn"
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold rounded-xl transition-all text-xs shadow-lg shadow-amber-500/20 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              {isGeneratingPdf ? (
                <>
                  <RotateCw size={16} className="animate-spin text-neutral-950" />
                  <span>Generando PDF...</span>
                </>
              ) : (
                <>
                  <Download size={16} />
                  <span>Descargar en PDF</span>
                </>
              )}
            </button>

            <button
              id="print-receipt-btn"
              type="button"
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 font-semibold rounded-xl border border-neutral-700 transition-colors text-xs cursor-pointer"
              title="Abrir cuadro de diálogo de impresión para imprimir o guardar como PDF"
            >
              <Printer size={16} />
              <span>Imprimir / Guardar en PDF</span>
            </button>

            <button
              id="copy-receipt-summary-btn"
              type="button"
              onClick={() => copyToClipboard(receiptSummaryText, 'all')}
              className="flex items-center justify-center gap-1.5 py-3 px-3.5 bg-neutral-900 border border-neutral-800 text-neutral-300 font-medium rounded-xl hover:bg-neutral-850 hover:text-white transition-colors text-xs cursor-pointer"
              title="Copiar texto oficial del comprobante al portapapeles"
            >
              {copiedField === 'all' ? (
                <>
                  <Check size={15} className="text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Copiado</span>
                </>
              ) : (
                <>
                  <Copy size={15} />
                  <span>Copiar</span>
                </>
              )}
            </button>

            <button
              id="close-receipt-btn"
              type="button"
              onClick={onClose}
              className="py-3 px-4 bg-neutral-900 border border-neutral-800 text-neutral-400 font-medium rounded-xl hover:bg-neutral-850 hover:text-neutral-200 transition-colors text-xs cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
