'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CreditCard, X, ShieldCheck, Building2, CheckCircle2, Lock, Sparkles } from 'lucide-react';
import { useBanking } from '@/lib/bankingStore';

interface AddExternalCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddExternalCardModal({
  isOpen,
  onClose,
  onSuccess,
}: AddExternalCardModalProps) {
  const { addExternalCard, userPostalCode } = useBanking();

  const [brand, setBrand] = useState<'VISA' | 'MASTERCARD' | 'AMEX'>('VISA');
  const [cardNumber, setCardNumber] = useState('');
  const [holderName, setHolderName] = useState('');
  const [expMonth, setExpMonth] = useState('08');
  const [expYear, setExpYear] = useState('28');
  const [cvv, setCvv] = useState('');
  const [bankOrigin, setBankOrigin] = useState('BBVA México');
  const [postalCode, setPostalCode] = useState(userPostalCode || '06600');
  const [isDefault, setIsDefault] = useState(true);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardNumber.trim() || !holderName.trim()) return;

    const cleanNumber = cardNumber.replace(/\s+/g, '');
    const last4 = cleanNumber.slice(-4) || '8899';

    addExternalCard({
      brand,
      cardNumber: cleanNumber,
      last4,
      holderName: holderName.toUpperCase(),
      expMonth,
      expYear,
      bankOrigin: bankOrigin.trim() || 'Banco Emisor',
      postalCode: postalCode.trim() || '06600',
      isDefault,
    });

    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onClose();
      if (onSuccess) onSuccess();
    }, 1600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 md:p-8 max-w-md w-full space-y-5 shadow-2xl text-neutral-100 relative overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <CreditCard size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-100">
                Agregar Tarjeta Externa
              </h3>
              <p className="text-[11px] text-neutral-400">
                Para validación AVS de pagos en línea y recargas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-neutral-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {success ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
              <CheckCircle2 size={32} />
            </div>
            <h4 className="text-lg font-bold text-neutral-100">Tarjeta Vinculada Exitosamente</h4>
            <p className="text-xs text-neutral-400 max-w-xs mx-auto">
              La tarjeta {brand} ha sido verificada y agregada para consolidación con validación de Código Postal {postalCode}.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Franquicia / Marca
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['VISA', 'MASTERCARD', 'AMEX'] as const).map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBrand(b)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                      brand === b
                        ? 'bg-amber-500 text-neutral-950 border-amber-500'
                        : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Banco Emisor de Origen
              </label>
              <input
                type="text"
                required
                value={bankOrigin}
                onChange={(e) => setBankOrigin(e.target.value)}
                placeholder="Ej. BBVA, Santander, Banorte, Chase"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-neutral-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Número de Tarjeta
              </label>
              <input
                type="text"
                required
                maxLength={19}
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                placeholder="4152 0000 0000 1234"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-neutral-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Nombre del Titular (como aparece en el plástico)
              </label>
              <input
                type="text"
                required
                value={holderName}
                onChange={(e) => setHolderName(e.target.value)}
                placeholder="CARLOS MENDOZA"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs uppercase text-neutral-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">Mes</label>
                <select
                  value={expMonth}
                  onChange={(e) => setExpMonth(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-amber-500"
                >
                  {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">Año</label>
                <select
                  value={expYear}
                  onChange={(e) => setExpYear(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-amber-500"
                >
                  {['25', '26', '27', '28', '29', '30', '31'].map(y => (
                    <option key={y} value={y}>20{y}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">CVV</label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                  placeholder="•••"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono text-center text-neutral-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1 flex items-center justify-between">
                <span>Código Postal de Facturación (AVS)</span>
                <span className="text-[10px] text-amber-400 font-mono">Validación de pagos</span>
              </label>
              <input
                type="text"
                required
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="Ej. 06600"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-neutral-100 focus:outline-none focus:border-amber-500"
              />
              <p className="text-[10px] text-neutral-400 mt-1">
                El sistema valida el código postal con los comercios en línea (Mercado Pago, Amazon, Plus500, Stripe).
              </p>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-semibold hover:bg-neutral-750 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-amber-500/20"
              >
                Vincular Tarjeta
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
