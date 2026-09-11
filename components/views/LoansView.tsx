'use client';

import { useState } from 'react';
import { PiggyBank, FileText, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useBanking } from '@/lib/bankingStore';

export default function LoansView({ onNavigate }: { onNavigate?: (view: any) => void }) {
  const { loans, applyForLoan } = useBanking();

  const [step, setStep] = useState<1 | 2>(1);
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [duration, setDuration] = useState('12');
  const [lastLoanId, setLastLoanId] = useState('');

  const aprRates: Record<string, number> = {
    '6': 4.5,
    '12': 5.2,
    '24': 6.0,
    '36': 6.5,
  };

  const parsedAmount = parseFloat(amount) || 0;
  const currentApr = aprRates[duration] || 5.2;
  const calculatedMonthly = parsedAmount > 0 
    ? ((parsedAmount * (1 + currentApr / 100)) / parseInt(duration, 10)).toFixed(2)
    : '0.00';

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parsedAmount || !purpose.trim()) return;

    const newLoan = applyForLoan(parsedAmount, parseInt(duration, 10), purpose);
    setLastLoanId(newLoan.id);
    setStep(2);
  };

  const handleReset = () => {
    setStep(1);
    setAmount('');
    setPurpose('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-100 flex items-center gap-2">
          <span>Préstamos y Financiamiento</span>
          <span className="text-xs bg-amber-500/10 text-amber-400 font-semibold px-2.5 py-1 rounded-full border border-amber-500/20">
            Tasa Fija Anual
          </span>
        </h1>
        <p className="text-neutral-400 text-sm mt-0.5">
          Solicitud de liquidez empresarial o personal con aprobación directa y abono a tu saldo.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Application Card */}
        <div className="md:col-span-2 bg-neutral-900 border border-neutral-800 rounded-3xl p-6 md:p-8 shadow-xl">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.form
                key="step1"
                onSubmit={handleApply}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <h2 className="text-xl font-bold text-neutral-100 mb-4">Solicitud de Crédito en Línea</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-2">Monto del Préstamo (USD)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-bold text-lg">$</span>
                      <input 
                        type="number" 
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-4 py-3.5 text-neutral-100 font-mono text-lg font-bold focus:outline-none focus:border-amber-500 transition-colors"
                        placeholder="10,000"
                        min="500"
                        max="100000"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-2">Plazo de Financiamiento (Meses)</label>
                    <select 
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-neutral-200 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                    >
                      <option value="6">6 Meses (4.5% APR - Corto Plazo)</option>
                      <option value="12">12 Meses (5.2% APR - Estándar)</option>
                      <option value="24">24 Meses (6.0% APR - Mediano Plazo)</option>
                      <option value="36">36 Meses (6.5% APR - Plan Extendido)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-2">Destino / Justificación de los Fondos</label>
                    <textarea 
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-neutral-200 text-sm focus:outline-none focus:border-amber-500 transition-colors min-h-[90px] resize-none"
                      placeholder="Describe brevemente el destino del capital (ej: compra de inventario, capital de trabajo)..."
                      required
                    />
                  </div>
                </div>

                {/* Calculation preview */}
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-xs text-amber-400 font-semibold uppercase tracking-wider">Pago Mensual Estimado</p>
                    <p className="text-2xl font-extrabold text-amber-400 font-mono mt-0.5">
                      ${calculatedMonthly} USD
                    </p>
                  </div>
                  <div className="text-right text-xs text-neutral-400">
                    <p>Tasa Anual Fija: <strong className="text-white">{currentApr}%</strong></p>
                    <p>Total a liquidar: <strong className="text-white">${(parseFloat(calculatedMonthly) * parseInt(duration, 10)).toFixed(2)} USD</strong></p>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={!parsedAmount || !purpose.trim()}
                  className="w-full py-4 bg-amber-500 text-neutral-950 font-bold rounded-xl hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-lg shadow-amber-500/10 text-sm"
                >
                  Enviar Solicitud a Evaluación Crediticia
                </button>
              </motion.form>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-10 space-y-6"
              >
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mb-2">
                  <CheckCircle2 size={44} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-neutral-100">Solicitud Recibida con Éxito</h2>
                  <p className="text-neutral-400 text-sm mt-2 max-w-md mx-auto">
                    Tu expediente de crédito ha sido asignado al departamento de riesgo. Recibirás respuesta en tu bandeja de notificaciones en menos de 24 horas.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 max-w-sm mx-auto text-xs font-mono text-neutral-300">
                  Folio de Expediente: <span className="text-amber-400 font-bold">{lastLoanId || 'LN-948102'}</span>
                </div>

                <div className="pt-4">
                  <button 
                    onClick={handleReset}
                    className="px-8 py-3 bg-neutral-800 text-neutral-200 font-bold rounded-xl hover:bg-neutral-700 transition-colors text-sm"
                  >
                    Hacer Otra Consulta
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right side: Active Loans List & KYC upgrade */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-neutral-100">Líneas y Créditos Activos</h3>
            
            {loans.length === 0 ? (
              <div className="text-center py-8 text-neutral-500 space-y-2">
                <PiggyBank size={40} className="mx-auto opacity-40" />
                <p className="text-xs">No tienes préstamos registrados actualmente.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {loans.map((loan) => (
                  <div key={loan.id} className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-sm text-neutral-100">${loan.amount.toLocaleString()} USD</span>
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                        loan.status === 'approved' 
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      )}>
                        {loan.status === 'approved' ? 'Aprobado' : 'En Revisión'}
                      </span>
                    </div>
                    <div className="flex justify-between text-neutral-400 text-[11px]">
                      <span>Plazo: {loan.durationMonths} meses</span>
                      <span>Mensualidad: ${loan.monthlyPayment.toFixed(2)}</span>
                    </div>
                    <p className="text-[11px] text-neutral-500 truncate">{loan.purpose}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="bg-gradient-to-br from-indigo-950 to-neutral-900 border border-indigo-500/30 rounded-3xl p-6 text-indigo-100 shadow-xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
              <FileText size={20} />
            </div>
            <h3 className="text-base font-bold text-white">¿Requieres mayor línea de crédito?</h3>
            <p className="text-xs text-indigo-300/80 leading-relaxed">
              Completa la verificación KYC de Nivel 2 en Configuración para acceder a límites de hasta $100,000 USD con tasa preferencial.
            </p>
            <button 
              type="button"
              onClick={() => onNavigate && onNavigate('settings')}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 pt-1 block"
            >
              Completar Verificación KYC &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
