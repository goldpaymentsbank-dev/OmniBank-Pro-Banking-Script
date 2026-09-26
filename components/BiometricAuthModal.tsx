'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Scan, 
  Fingerprint, 
  CheckCircle2, 
  X, 
  Lock, 
  AlertTriangle, 
  RefreshCw, 
  KeyRound,
  Eye,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BiometricAuthProps {
  isOpen: boolean;
  onSuccess: () => void;
  onCancel: () => void;
  mode?: 'unlock' | 'transfer';
  amount?: number;
  recipient?: string;
  userName?: string;
}

export default function BiometricAuthModal({
  isOpen,
  onSuccess,
  onCancel,
  mode = 'unlock',
  amount,
  recipient,
  userName = 'Carlos Mendoza',
}: BiometricAuthProps) {
  const [authMethod, setAuthMethod] = useState<'faceid' | 'fingerprint'>('faceid');
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'success' | 'failed'>('scanning');
  const [progress, setProgress] = useState(0);
  const [usePinFallback, setUsePinFallback] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const onSuccessRef = useRef(onSuccess);
  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  // Audio synthesis helper for realistic biometric sounds
  const playSound = (type: 'beep' | 'success') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (type === 'beep') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      } else if (type === 'success') {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        osc1.start();
        osc2.start(ctx.currentTime + 0.08);
        osc1.stop(ctx.currentTime + 0.35);
        osc2.stop(ctx.currentTime + 0.35);
      }
    } catch {
      // AudioContext unavailable in muted/restricted browsers
    }
  };

  // Run scanning animation when opened or retried
  useEffect(() => {
    if (!isOpen || usePinFallback) return;

    let finishTimeout: NodeJS.Timeout;
    const startTimer = setTimeout(() => {
      setScanState('scanning');
      setProgress(0);
    }, 0);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          return 100;
        }
        if (prev % 30 === 0) playSound('beep');
        return prev + 15;
      });
    }, 120);

    const timeout = setTimeout(() => {
      setProgress(100);
      setScanState('success');
      playSound('success');

      finishTimeout = setTimeout(() => {
        onSuccessRef.current();
      }, 700);
    }, 1100);

    return () => {
      clearTimeout(startTimer);
      clearInterval(interval);
      clearTimeout(timeout);
      clearTimeout(finishTimeout);
    };
  }, [isOpen, authMethod, usePinFallback]);

  if (!isOpen) return null;

  const handleRetry = () => {
    setScanState('scanning');
    setProgress(0);
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim().length >= 4) {
      playSound('success');
      setScanState('success');
      setTimeout(() => onSuccess(), 400);
    } else {
      setPinError('Ingresa un PIN numérico de al menos 4 dígitos.');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-md bg-neutral-900 border border-neutral-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 overflow-hidden text-neutral-100"
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Close / Cancel Button */}
          <button
            onClick={onCancel}
            className="absolute top-5 right-5 p-2 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Cancelar autenticación"
          >
            <X size={18} />
          </button>

          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-3">
              <ShieldCheck size={14} />
              <span>Autenticación Biométrica Segura</span>
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {mode === 'unlock' 
                ? 'Desbloquear Sesión de Banca' 
                : 'Confirmar Transferencia de Alto Valor'}
            </h3>

            <p className="text-xs text-neutral-400 mt-1 max-w-xs mx-auto">
              {mode === 'unlock' 
                ? `Verifica tu identidad como titular (${userName}) para continuar.`
                : `Autorización de seguridad de alto nivel requerida para transferir fondos.`}
            </p>

            {/* High-value Transfer Context Box */}
            {mode === 'transfer' && amount !== undefined && (
              <div className="mt-3 p-3 bg-neutral-950/70 border border-neutral-800 rounded-xl text-left">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-400">Monto a Enviar:</span>
                  <span className="text-amber-400 font-bold text-sm">
                    ${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                  </span>
                </div>
                {recipient && (
                  <div className="flex justify-between items-center text-[11px] mt-1 text-neutral-400">
                    <span>Destinatario:</span>
                    <span className="text-neutral-200 font-medium truncate max-w-[180px]">{recipient}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {!usePinFallback ? (
            <>
              {/* Biometric Method Selector */}
              <div className="flex justify-center gap-2 mb-6">
                <button
                  type="button"
                  onClick={() => { setAuthMethod('faceid'); handleRetry(); }}
                  className={cn(
                    'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer',
                    authMethod === 'faceid' 
                      ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20' 
                      : 'bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-750'
                  )}
                >
                  <Scan size={14} />
                  <span>Face ID</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMethod('fingerprint'); handleRetry(); }}
                  className={cn(
                    'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer',
                    authMethod === 'fingerprint' 
                      ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20' 
                      : 'bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-750'
                  )}
                >
                  <Fingerprint size={14} />
                  <span>Huella Dactilar</span>
                </button>
              </div>

              {/* Central Scanner Graphic */}
              <div className="flex flex-col items-center justify-center my-6">
                <div className="relative w-36 h-36 flex items-center justify-center">
                  {/* Outer Pulsing Ring */}
                  <motion.div
                    animate={scanState === 'scanning' ? {
                      scale: [1, 1.08, 1],
                      opacity: [0.3, 0.7, 0.3],
                    } : {}}
                    transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                    className={cn(
                      'absolute inset-0 rounded-3xl border-2 transition-colors',
                      scanState === 'success' 
                        ? 'border-emerald-500 bg-emerald-500/10' 
                        : scanState === 'failed' 
                        ? 'border-rose-500 bg-rose-500/10' 
                        : 'border-amber-500/40 bg-amber-500/5'
                    )}
                  />

                  {/* Corner Targets for FaceID */}
                  {authMethod === 'faceid' && (
                    <>
                      <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-amber-400 rounded-tl-sm" />
                      <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-amber-400 rounded-tr-sm" />
                      <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-amber-400 rounded-bl-sm" />
                      <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-amber-400 rounded-br-sm" />
                    </>
                  )}

                  {/* Laser Scan Line */}
                  {scanState === 'scanning' && (
                    <motion.div
                      animate={{ y: [-48, 48, -48] }}
                      transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
                      className="absolute w-28 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_12px_#F59E0B]"
                    />
                  )}

                  {/* Icon State */}
                  {scanState === 'success' ? (
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex flex-col items-center text-emerald-400"
                    >
                      <CheckCircle2 size={56} className="text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                      <span className="text-xs font-bold mt-2 text-emerald-400">Verificado</span>
                    </motion.div>
                  ) : authMethod === 'faceid' ? (
                    <div className="relative text-amber-400">
                      <Scan size={56} className="text-amber-400/90" />
                      <Eye size={22} className="absolute inset-0 m-auto text-amber-300" />
                    </div>
                  ) : (
                    <div className="relative text-amber-400">
                      <Fingerprint size={60} className="text-amber-400/90 drop-shadow-[0_0_10px_rgba(245,158,11,0.3)]" />
                    </div>
                  )}
                </div>

                {/* Status Text & Progress */}
                <div className="mt-4 text-center">
                  <p className="text-xs font-medium text-neutral-300">
                    {scanState === 'scanning' && (
                      authMethod === 'faceid' ? 'Escaneando rasgos biométricos...' : 'Coloca tu dedo en el sensor...'
                    )}
                    {scanState === 'success' && '¡Identidad Biometrizada Aprobada!'}
                    {scanState === 'failed' && 'No se pudo verificar. Intenta de nuevo.'}
                  </p>

                  <div className="w-32 h-1 bg-neutral-800 rounded-full mx-auto mt-2 overflow-hidden">
                    <motion.div 
                      className={cn(
                        'h-full transition-all duration-150',
                        scanState === 'success' ? 'bg-emerald-500' : 'bg-amber-500'
                      )}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 mt-4">
                <button
                  type="button"
                  onClick={handleRetry}
                  className="w-full py-2.5 px-4 bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-white rounded-xl text-xs font-medium border border-neutral-700/60 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw size={14} />
                  <span>Escanear de nuevo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setUsePinFallback(true)}
                  className="w-full py-2 text-neutral-400 hover:text-amber-400 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <KeyRound size={13} />
                  <span>Usar PIN de Seguridad alternativo</span>
                </button>
              </div>
            </>
          ) : (
            /* PIN Fallback View */
            <form onSubmit={handlePinSubmit} className="space-y-4 my-2">
              <div className="p-3 bg-neutral-950/60 border border-neutral-800 rounded-xl text-center">
                <p className="text-xs text-neutral-300 mb-2">
                  Introduce tu PIN de seguridad de 4 dígitos para autorizar sin biometría.
                </p>
                <input
                  type="password"
                  maxLength={6}
                  autoFocus
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value.replace(/\D/g, ''));
                    setPinError('');
                  }}
                  placeholder="••••"
                  className="w-36 text-center tracking-[0.4em] text-xl font-bold bg-neutral-900 border border-neutral-700 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-amber-500"
                />
                {pinError && <p className="text-[11px] text-rose-400 mt-2">{pinError}</p>}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setUsePinFallback(false)}
                  className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-300 rounded-xl text-xs font-medium cursor-pointer"
                >
                  Volver a Biometría
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-xs cursor-pointer shadow-md shadow-amber-500/20"
                >
                  Autorizar con PIN
                </button>
              </div>
            </form>
          )}

          {/* Compliance Footer */}
          <div className="mt-5 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-[10px] text-neutral-500">
            <span className="flex items-center gap-1">
              <Sparkles size={11} className="text-amber-500/70" />
              FIDO2 / WebAuthn Biometric L2
            </span>
            <span>256-bit Secure Enclave</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
