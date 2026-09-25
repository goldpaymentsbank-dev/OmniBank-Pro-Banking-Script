'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Copy, 
  Check, 
  Building2, 
  ShieldCheck,
  Printer
} from 'lucide-react';
import { EmailNotificationLog } from '@/lib/bankingStore';

interface EmailNotificationModalProps {
  email: EmailNotificationLog | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function EmailNotificationModal({
  email,
  isOpen,
  onClose,
}: EmailNotificationModalProps) {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !email) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(`${email.subject}\n\nPara: ${email.to}\nFecha: ${email.sentAt}\n\n${email.preview}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]"
        >
          {/* Email Client Header */}
          <div className="p-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-base flex items-center gap-2">
                  Notificación Automática por Correo
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Entregado
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Despachado por el servidor central de Banco Gold Payments
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                title="Copiar contenido"
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                onClick={handlePrint}
                title="Imprimir comprobante"
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                <Printer className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Email Metadata */}
          <div className="px-6 py-4 bg-slate-950/60 border-b border-slate-800 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">De:</span>
              <span className="text-slate-200 font-mono">notificaciones@bancogoldpayments.com</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Para:</span>
              <span className="text-slate-200 font-semibold">{email.recipientName} &lt;{email.to}&gt;</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Asunto:</span>
              <span className="text-emerald-400 font-medium">{email.subject}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Fecha y Hora:</span>
              <span className="text-slate-300 flex items-center gap-1 font-mono">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {email.sentAt}
              </span>
            </div>
            {email.trackingKey && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Clave de Rastreo:</span>
                <span className="text-amber-400 font-mono font-bold">{email.trackingKey}</span>
              </div>
            )}
          </div>

          {/* Email Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-4">
            <div className="bg-white text-slate-900 rounded-xl p-6 shadow-inner border border-slate-200">
              {/* Header inside the email */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black">
                    GP
                  </div>
                  <div>
                    <div className="font-black text-slate-900 text-sm tracking-wide">BANCO GOLD PAYMENTS</div>
                    <div className="text-[10px] text-slate-500 uppercase">Sistema Central de Notificaciones</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verificación SPEI / Banxico
                </div>
              </div>

              {/* Injected HTML or Content */}
              <div 
                className="email-content text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: email.bodyHtml }}
              />

              {/* Bank Security Footer */}
              <div className="mt-8 pt-4 border-t border-slate-200 text-center text-[11px] text-slate-500 space-y-1">
                <p>Banco Gold Payments S.A. Institución de Banca Múltiple.</p>
                <p>Este correo electrónico fue generado automáticamente tras una operación en su cuenta. No responda a este mensaje.</p>
                <p className="font-mono text-[10px] text-slate-400 pt-1">Identificador de Transmisión: {email.id}</p>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm transition-colors"
            >
              Cerrar Vista Previa
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
