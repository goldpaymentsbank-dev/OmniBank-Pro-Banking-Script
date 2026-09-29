'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Building2, X, CheckCircle2, DollarSign, Layers } from 'lucide-react';
import { useBanking } from '@/lib/bankingStore';

interface ConsolidateAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ConsolidateAccountsModal({
  isOpen,
  onClose,
  onSuccess,
}: ConsolidateAccountsModalProps) {
  const { addLinkedAccount } = useBanking();

  const [bankName, setBankName] = useState('BBVA México');
  const [accountType, setAccountType] = useState<'Ahorros' | 'Corriente' | 'Nómina' | 'Inversión'>('Ahorros');
  const [accountNumber, setAccountNumber] = useState('');
  const [currency, setCurrency] = useState<'USD' | 'MXN' | 'EUR'>('MXN');
  const [estimatedBalance, setEstimatedBalance] = useState('35000');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName.trim() || !accountNumber.trim()) return;

    const numClean = accountNumber.replace(/\s+/g, '');
    const masked = '•••• ' + (numClean.slice(-4) || '7721');
    const bal = parseFloat(estimatedBalance) || 0;

    addLinkedAccount({
      bankName: bankName.trim(),
      accountType,
      accountNumberMasked: masked,
      currency,
      estimatedBalance: bal,
      status: 'connected',
    });

    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onClose();
      if (onSuccess) onSuccess();
    }, 1500);
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
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Layers size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-100">
                Consolidar Cuenta Externa
              </h3>
              <p className="text-[11px] text-neutral-400">
                Unifica saldos y movimientos de otras instituciones bancarias
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
            <h4 className="text-lg font-bold text-neutral-100">Cuenta Consolidada con Éxito</h4>
            <p className="text-xs text-neutral-400 max-w-xs mx-auto">
              La cuenta de {bankName} se sincronizó para el cálculo de patrimonio total en tiempo real.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Institución Financiera
              </label>
              <select
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-neutral-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="BBVA México">BBVA México</option>
                <option value="Santander Premier">Santander México</option>
                <option value="Banorte / IXE">Banorte / IXE</option>
                <option value="Citibanamex">Citibanamex</option>
                <option value="Scotiabank">Scotiabank</option>
                <option value="Chase Bank (USA)">JPMorgan Chase (USA)</option>
                <option value="Bank of America (USA)">Bank of America (USA)</option>
                <option value="Banco Santander España">Banco Santander España (EUR)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">Tipo</label>
                <select
                  value={accountType}
                  onChange={(e: any) => setAccountType(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-neutral-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Ahorros">Ahorros</option>
                  <option value="Corriente">Corriente</option>
                  <option value="Nómina">Nómina</option>
                  <option value="Inversión">Inversión</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">Divisa</label>
                <div className="grid grid-cols-3 gap-1">
                  {(['MXN', 'USD', 'EUR'] as const).map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCurrency(c)}
                      className={`py-2 rounded-lg text-xs font-bold border transition-colors ${
                        currency === c
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-neutral-950 text-neutral-400 border-neutral-800'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Número de Cuenta o CLABE
              </label>
              <input
                type="text"
                required
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Ej. 012180004928192038"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-neutral-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Saldo Aproximado en Custodia ({currency})
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-xs">$</span>
                <input
                  type="number"
                  min="0"
                  step="100"
                  required
                  value={estimatedBalance}
                  onChange={(e) => setEstimatedBalance(e.target.value)}
                  className="w-full pl-7 pr-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs font-mono text-neutral-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
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
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-950/40"
              >
                Consolidar Ahora
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
