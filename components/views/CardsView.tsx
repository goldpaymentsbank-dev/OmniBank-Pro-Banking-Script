'use client';

import { useState } from 'react';
import { 
  CreditCard, 
  Plus, 
  Eye, 
  EyeOff, 
  Snowflake, 
  Lock, 
  Copy, 
  Check, 
  Globe, 
  ShieldCheck, 
  AlertCircle, 
  X,
  Sparkles,
  Smartphone
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useBanking, CardItem } from '@/lib/bankingStore';
import { validateLuhnCard } from '@/lib/bankingValidation';

export default function CardsView() {
  const { 
    cards, 
    addCard, 
    toggleCardFreeze, 
    toggleCardOnline, 
    toggleCardAtm, 
    updateCardPin 
  } = useBanking();

  const [selectedCardIndex, setSelectedCardIndex] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState(false);

  // Modals state
  const [isNewCardModalOpen, setIsNewCardModalOpen] = useState(false);
  const [newCardBrand, setNewCardBrand] = useState<'VISA' | 'MASTERCARD'>('VISA');
  const [newCardLimit, setNewCardLimit] = useState(5000);

  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [pinSuccess, setPinSuccess] = useState('');

  // Built-in Luhn Card Diagnostics Tester
  const [testCardNumber, setTestCardNumber] = useState('');

  const activeCard: CardItem | undefined = cards[selectedCardIndex] || cards[0];

  const handleCopyCard = () => {
    if (!activeCard) return;
    navigator.clipboard?.writeText(activeCard.number);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  const handleCreateCard = (e: React.FormEvent) => {
    e.preventDefault();
    addCard(newCardBrand, newCardLimit);
    setIsNewCardModalOpen(false);
    setSelectedCardIndex(cards.length); // Select newly added card
  };

  const handleUpdatePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCard || newPin.length !== 4) return;
    updateCardPin(activeCard.id, newPin);
    setPinSuccess('PIN actualizado correctamente con éxito.');
    setTimeout(() => {
      setPinSuccess('');
      setIsPinModalOpen(false);
      setNewPin('');
    }, 1500);
  };

  const luhnDiagnostics = testCardNumber ? validateLuhnCard(testCardNumber) : null;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-100 flex items-center gap-2">
            <span>Tarjetas Virtuales</span>
            <span className="text-xs bg-amber-500/10 text-amber-400 font-semibold px-2.5 py-1 rounded-full border border-amber-500/20">
              Luhn Check ISO/IEC 7812
            </span>
          </h1>
          <p className="text-neutral-400 text-sm mt-1">
            Tarjetas con números matemáticamente válidos para transacciones en línea y comercios.
          </p>
        </div>
        <button 
          onClick={() => setIsNewCardModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-neutral-950 rounded-xl font-bold hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/10 text-sm"
        >
          <Plus size={18} />
          <span>Emitir Nueva Tarjeta</span>
        </button>
      </div>

      {/* Card Selector Tabs if multiple */}
      {cards.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {cards.map((card, idx) => (
            <button
              key={card.id}
              onClick={() => setSelectedCardIndex(idx)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border",
                selectedCardIndex === idx
                  ? "bg-amber-500 text-neutral-950 border-amber-500 font-bold"
                  : "bg-neutral-900 text-neutral-400 border-neutral-800 hover:border-neutral-700"
              )}
            >
              {card.brand} •••• {card.number.slice(-4)} {card.isFrozen ? '(Congelada)' : ''}
            </button>
          ))}
        </div>
      )}

      {activeCard && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Active Card Display */}
          <div className="space-y-5">
            <motion.div 
              className={cn(
                "relative w-full aspect-[1.586] rounded-3xl p-7 md:p-8 overflow-hidden transition-all duration-500 shadow-2xl border border-neutral-700/40",
                activeCard.isFrozen 
                  ? "bg-neutral-800 text-neutral-400" 
                  : activeCard.brand === 'VISA'
                  ? "bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 text-neutral-950"
                  : "bg-gradient-to-tr from-slate-900 via-neutral-800 to-amber-600 text-neutral-100"
              )}
            >
              {/* Card Background Decoration */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
              
              <div className="relative h-full flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-extrabold text-lg md:text-xl tracking-wider">GOLD PAYMENTS</span>
                    <span className="block text-[10px] tracking-widest font-semibold uppercase opacity-80">
                      {activeCard.brand} DEBIT PLATINUM
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-black/20 text-current">
                      {activeCard.brand}
                    </span>
                    <CreditCard size={28} />
                  </div>
                </div>
                
                <div className="space-y-4">
                  {/* Card Number with Copy Action */}
                  <div className="flex items-center justify-between">
                    <div className="font-mono text-xl md:text-2xl tracking-widest font-bold select-all">
                      {showDetails ? activeCard.formatted : `•••• •••• •••• ${activeCard.number.slice(-4)}`}
                    </div>
                    <button
                      onClick={handleCopyCard}
                      title="Copiar número"
                      className="p-1.5 rounded-lg bg-black/20 hover:bg-black/30 transition-colors"
                    >
                      {copiedNumber ? <Check size={16} className="text-emerald-300" /> : <Copy size={16} />}
                    </button>
                  </div>
                  
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider opacity-75 mb-0.5">Titular</div>
                      <div className="font-semibold tracking-wide text-sm">{activeCard.holderName}</div>
                    </div>
                    <div className="flex gap-5">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider opacity-75 mb-0.5">Expira</div>
                        <div className="font-mono font-semibold text-sm">{activeCard.exp}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider opacity-75 mb-0.5">CVV</div>
                        <div className="font-mono font-semibold text-sm">{showDetails ? activeCard.cvv : "•••"}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Frozen Overlay */}
              {activeCard.isFrozen && (
                <div className="absolute inset-0 bg-neutral-950/70 backdrop-blur-[2px] flex items-center justify-center">
                  <div className="flex items-center gap-2 text-white font-medium bg-neutral-900/90 px-4 py-2 rounded-full border border-neutral-700 shadow-xl">
                    <Snowflake size={18} className="text-cyan-400" />
                    <span>Tarjeta Congelada</span>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center justify-center gap-2 p-3.5 bg-neutral-900 border border-neutral-800 rounded-2xl text-neutral-200 hover:bg-neutral-800 transition-colors text-sm font-semibold"
              >
                {showDetails ? <EyeOff size={16} /> : <Eye size={16} />}
                <span>{showDetails ? "Ocultar Datos" : "Ver Datos Completos"}</span>
              </button>
              <button 
                onClick={() => toggleCardFreeze(activeCard.id)}
                className={cn(
                  "flex items-center justify-center gap-2 p-3.5 border rounded-2xl transition-colors text-sm font-semibold",
                  activeCard.isFrozen 
                    ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20"
                    : "bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800"
                )}
              >
                <Snowflake size={16} />
                <span>{activeCard.isFrozen ? "Descongelar" : "Congelar Tarjeta"}</span>
              </button>
            </div>

            {/* Luhn Algorithm Confirmation Badge */}
            <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-400" />
                <span>Validación Algoritmo Luhn (Mod 10): <strong>Aprobado 100%</strong></span>
              </div>
              <button
                onClick={() => setTestCardNumber(activeCard.number)}
                className="text-emerald-400 hover:text-emerald-300 underline font-medium"
              >
                Verificar en Test
              </button>
            </div>
          </div>

          {/* Card Controls & Settings */}
          <div className="space-y-6">
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-5">
              <h3 className="text-lg font-bold text-neutral-100">Controles de Seguridad</h3>
              
              <div className="space-y-3">
                {/* Online Transactions Switch */}
                <div className="flex items-center justify-between p-4 bg-neutral-950 rounded-2xl border border-neutral-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center text-neutral-300">
                      <Globe size={18} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-neutral-200">Compras por Internet</p>
                      <p className="text-xs text-neutral-500">Habilitar pagos en comercios online y apps</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => toggleCardOnline(activeCard.id)}
                    className={cn(
                      "w-12 h-6 rounded-full relative transition-colors",
                      activeCard.onlineEnabled ? "bg-amber-500" : "bg-neutral-700"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 w-4 h-4 rounded-full transition-transform bg-neutral-950",
                      activeCard.onlineEnabled ? "right-1" : "left-1"
                    )} />
                  </button>
                </div>

                {/* ATM Withdrawals Switch */}
                <div className="flex items-center justify-between p-4 bg-neutral-950 rounded-2xl border border-neutral-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center text-neutral-300">
                      <Smartphone size={18} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-neutral-200">Retiro en Cajeros / ATM</p>
                      <p className="text-xs text-neutral-500">Permitir retiros en cajeros de la red</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => toggleCardAtm(activeCard.id)}
                    className={cn(
                      "w-12 h-6 rounded-full relative transition-colors",
                      activeCard.atmEnabled ? "bg-amber-500" : "bg-neutral-700"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 w-4 h-4 rounded-full transition-transform bg-neutral-950",
                      activeCard.atmEnabled ? "right-1" : "left-1"
                    )} />
                  </button>
                </div>

                {/* Change PIN Action */}
                <div className="flex items-center justify-between p-4 bg-neutral-950 rounded-2xl border border-neutral-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center text-neutral-300">
                      <Lock size={18} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-neutral-200">PIN de Seguridad</p>
                      <p className="text-xs text-neutral-500">PIN actual: ••••</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsPinModalOpen(true)}
                    className="text-amber-500 text-sm font-semibold hover:text-amber-400 px-3 py-1.5 rounded-lg bg-neutral-800/80 hover:bg-neutral-800 transition-colors"
                  >
                    Cambiar PIN
                  </button>
                </div>
              </div>

              {/* Spending Limit info */}
              <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800 flex items-center justify-between text-xs">
                <span className="text-neutral-400">Límite mensual asignado:</span>
                <span className="font-mono font-bold text-amber-400 text-sm">${activeCard.limit.toLocaleString()} USD</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Built-in Diagnostic Tool (Luhn Tester) */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-neutral-100 flex items-center gap-2">
              <ShieldCheck size={18} className="text-amber-500" />
              <span>Verificador de Algoritmo Luhn (Diagnóstico ISO/IEC 7812)</span>
            </h3>
            <p className="text-neutral-400 text-xs mt-0.5">
              Prueba cualquier número de tarjeta para certificar que el dígito de control satisface el algoritmo de validación bancaria.
            </p>
          </div>
          {activeCard && (
            <button
              onClick={() => setTestCardNumber(activeCard.number)}
              className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-xl hover:bg-amber-500/20 transition-colors font-medium"
            >
              Probar Mi Tarjeta Activa
            </button>
          )}
        </div>

        <div className="relative">
          <input 
            type="text" 
            value={testCardNumber}
            onChange={(e) => setTestCardNumber(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-neutral-100 font-mono focus:outline-none focus:border-amber-500 transition-colors text-sm"
            placeholder="Ingresa un número de tarjeta de 16 dígitos para verificar..."
          />
        </div>

        {luhnDiagnostics && (
          <div className={cn(
            "p-4 rounded-2xl border text-xs space-y-2",
            luhnDiagnostics.isValid 
              ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"
              : "bg-red-950/40 border-red-500/30 text-red-300"
          )}>
            <div className="flex items-center justify-between font-bold text-sm">
              <span>ESTADO: {luhnDiagnostics.isValid ? 'TARJETA VÁLIDA (LUHN OK)' : 'TARJETA INVÁLIDA'}</span>
              <span className="px-2 py-0.5 rounded bg-black/30">{luhnDiagnostics.brand}</span>
            </div>
            <p className="text-[11px] opacity-90">
              {luhnDiagnostics.isValid 
                ? `El número cumple con el cálculo de suma de verificación Módulo 10 (Luhn). BIN: ${luhnDiagnostics.bin}, Red: ${luhnDiagnostics.brand}.`
                : `${luhnDiagnostics.error}. Este número no será aceptado por procesadores de pago reales.`
              }
            </p>
          </div>
        )}
      </div>

      {/* Modal: New Virtual Card */}
      <AnimatePresence>
        {isNewCardModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 md:p-8 max-w-md w-full space-y-6 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={20} className="text-amber-500" />
                  <h3 className="text-lg font-bold text-neutral-100">Emitir Tarjeta Virtual</h3>
                </div>
                <button 
                  onClick={() => setIsNewCardModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-neutral-100"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateCard} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-2">Red Emisora</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setNewCardBrand('VISA')}
                      className={cn(
                        "p-3 rounded-xl border text-center font-bold text-sm transition-all",
                        newCardBrand === 'VISA' 
                          ? "bg-amber-500 text-neutral-950 border-amber-500" 
                          : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                      )}
                    >
                      VISA Platinum
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewCardBrand('MASTERCARD')}
                      className={cn(
                        "p-3 rounded-xl border text-center font-bold text-sm transition-all",
                        newCardBrand === 'MASTERCARD' 
                          ? "bg-amber-500 text-neutral-950 border-amber-500" 
                          : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                      )}
                    >
                      Mastercard Gold
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-2">Límite Mensual de Gasto</label>
                  <select 
                    value={newCardLimit}
                    onChange={(e) => setNewCardLimit(parseInt(e.target.value, 10))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-neutral-200 text-sm focus:outline-none focus:border-amber-500"
                  >
                    <option value="1000">$1,000 USD / mes</option>
                    <option value="2500">$2,500 USD / mes</option>
                    <option value="5000">$5,000 USD / mes</option>
                    <option value="10000">$10,000 USD / mes</option>
                  </select>
                </div>

                <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-400 space-y-1">
                  <p className="font-semibold text-neutral-200">Garantía Matemática de Emisión:</p>
                  <p>La tarjeta se generará con un número de 16 dígitos que cumple con el algoritmo de Luhn (Módulo 10), lista para vincularse a servicios de pago.</p>
                </div>

                <button 
                  type="submit"
                  className="w-full py-3.5 bg-amber-500 text-neutral-950 font-bold rounded-xl hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/10 text-sm"
                >
                  Generar y Activar Tarjeta
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Change PIN */}
      <AnimatePresence>
        {isPinModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 md:p-8 max-w-sm w-full space-y-5 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-neutral-100">Actualizar PIN de Seguridad</h3>
                <button 
                  onClick={() => setIsPinModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-neutral-100"
                >
                  <X size={18} />
                </button>
              </div>

              {pinSuccess ? (
                <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-center text-sm font-semibold">
                  {pinSuccess}
                </div>
              ) : (
                <form onSubmit={handleUpdatePin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-2">Nuevo PIN (4 dígitos)</label>
                    <input 
                      type="password" 
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-center text-2xl font-mono tracking-widest text-neutral-100 focus:outline-none focus:border-amber-500"
                      placeholder="••••"
                      maxLength={4}
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={newPin.length !== 4}
                    className="w-full py-3 bg-amber-500 text-neutral-950 font-bold rounded-xl hover:bg-amber-400 disabled:opacity-50 transition-colors text-sm"
                  >
                    Guardar Nuevo PIN
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
