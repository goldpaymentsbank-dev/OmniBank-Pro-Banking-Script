'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, X, ExternalLink, CheckCircle2, ArrowRight } from 'lucide-react';
import { useBanking, EmailNotificationLog } from '@/lib/bankingStore';
import EmailNotificationModal from '@/components/EmailNotificationModal';

export default function LiveIncomingEmailToast() {
  const { lastReceivedEmail, clearLastReceivedEmail, customBankEmail } = useBanking();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeEmail, setActiveEmail] = useState<EmailNotificationLog | null>(null);

  if (!lastReceivedEmail) {
    return (
      <EmailNotificationModal
        email={activeEmail}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setActiveEmail(null);
        }}
      />
    );
  }

  const handleOpenEmail = () => {
    setActiveEmail(lastReceivedEmail);
    setIsModalOpen(true);
    clearLastReceivedEmail();
  };

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-6 left-6 z-50 max-w-sm sm:max-w-md w-full"
        >
          <div className="bg-neutral-900/95 backdrop-blur-md border border-amber-500/40 rounded-2xl p-4 shadow-2xl shadow-amber-500/10 text-neutral-100 flex items-start gap-3 relative overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <Mail size={18} />
            </div>

            <div className="flex-1 min-w-0 pr-6">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                  Alerta Oficial
                </span>
                <span className="text-[10px] text-neutral-400 truncate font-mono">
                  {lastReceivedEmail.from || customBankEmail.senderEmail}
                </span>
              </div>
              <p className="text-xs font-bold text-neutral-100 truncate">
                {lastReceivedEmail.subject}
              </p>
              <p className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5">
                {lastReceivedEmail.preview}
              </p>

              <div className="mt-2.5 flex items-center gap-2">
                <button
                  onClick={handleOpenEmail}
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>Ver Correo Completo</span>
                  <ArrowRight size={12} />
                </button>
                <button
                  onClick={clearLastReceivedEmail}
                  className="px-2.5 py-1 text-neutral-400 hover:text-neutral-200 text-[11px] transition-colors"
                >
                  Descartar
                </button>
              </div>
            </div>

            <button
              onClick={clearLastReceivedEmail}
              className="absolute top-3 right-3 text-neutral-400 hover:text-neutral-100 transition-colors p-1"
            >
              <X size={15} />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      <EmailNotificationModal
        email={activeEmail}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setActiveEmail(null);
        }}
      />
    </>
  );
}
