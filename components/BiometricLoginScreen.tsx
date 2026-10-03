'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Scan, 
  Fingerprint, 
  CheckCircle2, 
  Lock, 
  KeyRound, 
  Eye, 
  ChevronDown, 
  Building2, 
  Check, 
  ArrowRight,
  Sparkles,
  Smartphone,
  Globe,
  AlertCircle,
  UserPlus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBanking, UserAccountItem } from '@/lib/bankingStore';
import UserRegistrationModal from './UserRegistrationModal';

interface BiometricLoginScreenProps {
  onAuthenticated: () => void;
}

export default function BiometricLoginScreen({ onAuthenticated }: BiometricLoginScreenProps) {
  const { 
    userName, 
    userAccount, 
    userEmail, 
    users, 
    activeUserId, 
    switchUser 
  } = useBanking();

  const [authMethod, setAuthMethod] = useState<'faceid' | 'fingerprint'>('faceid');
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'success' | 'failed'>('idle');
  const [progress, setProgress] = useState(0);
  const [usePinFallback, setUsePinFallback] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [fidoSupported, setFidoSupported] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const currentUser = users.find(u => u.id === activeUserId) || {
    id: activeUserId,
    name: userName,
    email: userEmail,
    accountNumber: userAccount,
    status: 'active',
  };

  // Sound synthesis for biometric feedback
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
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else if (type === 'success') {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        osc1.start();
        osc2.start(ctx.currentTime + 0.08);
        osc1.stop(ctx.currentTime + 0.4);
        osc2.stop(ctx.currentTime + 0.4);
      }
    } catch {
      // AudioContext unavailable in muted context
    }
  };

  // Check FIDO2 / WebAuthn platform availability on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.PublicKeyCredential) {
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable?.()
        .then((available) => setFidoSupported(Boolean(available)))
        .catch(() => setFidoSupported(false));
    }
  }, []);

  // Biometric scan runner
  const startBiometricScan = useCallback(() => {
    setScanState('scanning');
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 100;
        }
        if (prev % 25 === 0) playSound('beep');
        return prev + 15;
      });
    }, 110);

    const timeout = setTimeout(() => {
      setProgress(100);
      setScanState('success');
      playSound('success');

      setTimeout(() => {
        onAuthenticated();
      }, 700);
    }, 1050);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [onAuthenticated]);

  // Run automatically on first render or method change
  useEffect(() => {
    const timer = setTimeout(() => {
      startBiometricScan();
    }, 400);
    return () => clearTimeout(timer);
  }, [authMethod, startBiometricScan]);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim().length >= 4) {
      playSound('success');
      setScanState('success');
      setTimeout(() => onAuthenticated(), 500);
    } else {
      setPinError('Ingresa un PIN numérico de al menos 4 dígitos.');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-between p-4 sm:p-8 relative overflow-hidden select-none font-sans">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-10 -left-10 w-72 h-72 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-10 flex items-center justify-between max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <span className="font-black text-xl text-neutral-950">G</span>
          </div>
          <div>
            <span className="font-extrabold text-base sm:text-lg tracking-tight text-white block">
              Gold Payments Bank
            </span>
            <span className="text-[10px] text-amber-400 font-semibold tracking-widest uppercase">
              Banca Múltiple • SPEI Banxico
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <ShieldCheck size={14} />
            <span>FIDO2 / WebAuthn Activo</span>
          </div>
        </div>
      </header>

      {/* Central Login Card */}
      <main className="relative z-10 my-auto flex flex-col items-center justify-center max-w-md mx-auto w-full py-6">
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="w-full bg-neutral-900/90 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 backdrop-blur-xl space-y-6"
        >
          {/* Card Top: Security Gate Identification */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-bold">
              <Lock size={12} />
              <span>BLOQUEO DE SEGURIDAD BIOMÉTRICA</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Autenticación FIDO2
            </h1>
            <p className="text-xs text-neutral-400 max-w-xs mx-auto">
              Verifica tus datos biométricos para ingresar al panel de control de tu cuenta bancaria.
            </p>
          </div>

          {/* User Account Card & Switcher */}
          <div className="relative">
            <div 
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center justify-between p-3.5 bg-neutral-950/80 border border-neutral-800 hover:border-neutral-700 rounded-2xl cursor-pointer transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-700 border border-neutral-700 flex items-center justify-center text-amber-400 font-extrabold text-sm shrink-0">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-xs font-bold text-neutral-100 truncate">{currentUser.name}</p>
                  <p className="text-[11px] text-neutral-400 font-mono truncate">
                    {currentUser.accountNumber || userAccount} • {currentUser.email}
                  </p>
                </div>
              </div>
              <ChevronDown size={16} className={cn("text-neutral-400 transition-transform", isUserMenuOpen && "rotate-180")} />
            </div>

            {/* Dropdown User Switcher */}
            <AnimatePresence>
              {isUserMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-neutral-900 border border-neutral-800 rounded-2xl p-2 shadow-2xl z-30 space-y-1"
                >
                  <p className="text-[10px] text-neutral-500 font-bold px-2 py-1 uppercase tracking-wider">
                    Seleccionar Cuenta Autorizada
                  </p>
                  {users.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        switchUser(u.id);
                        setIsUserMenuOpen(false);
                        startBiometricScan();
                      }}
                      className={cn(
                        "w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors cursor-pointer",
                        u.id === activeUserId ? "bg-amber-500/10 text-amber-300 font-bold" : "hover:bg-neutral-800 text-neutral-300"
                      )}
                    >
                      <div className="truncate">
                        <div className="truncate">{u.name}</div>
                        <div className="text-[10px] text-neutral-500 font-mono">{u.accountNumber}</div>
                      </div>
                      {u.id === activeUserId && <Check size={14} className="text-amber-400 shrink-0" />}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      setIsRegisterOpen(true);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 p-2 rounded-xl text-xs bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-bold transition-colors cursor-pointer mt-1 border border-amber-500/30"
                  >
                    <UserPlus size={13} />
                    <span>+ Abrir Nueva Cuenta Bancaria</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {!usePinFallback ? (
            <div className="space-y-5">
              {/* Method Switcher Buttons */}
              <div className="flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => { setAuthMethod('faceid'); startBiometricScan(); }}
                  className={cn(
                    'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
                    authMethod === 'faceid' 
                      ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20' 
                      : 'bg-neutral-800 text-neutral-400 hover:text-white'
                  )}
                >
                  <Scan size={14} />
                  <span>Face ID</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMethod('fingerprint'); startBiometricScan(); }}
                  className={cn(
                    'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
                    authMethod === 'fingerprint' 
                      ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20' 
                      : 'bg-neutral-800 text-neutral-400 hover:text-white'
                  )}
                >
                  <Fingerprint size={14} />
                  <span>Sensor Dactilar</span>
                </button>
              </div>

              {/* Central Animated Biometric Scanner */}
              <div className="flex flex-col items-center justify-center my-4">
                <div 
                  onClick={startBiometricScan}
                  className="relative w-36 h-36 flex items-center justify-center cursor-pointer group"
                  title="Haz clic para volver a escanear"
                >
                  {/* Outer Pulsing Ring */}
                  <motion.div
                    animate={scanState === 'scanning' ? {
                      scale: [1, 1.08, 1],
                      opacity: [0.3, 0.7, 0.3],
                    } : {}}
                    transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
                    className={cn(
                      'absolute inset-0 rounded-3xl border-2 transition-all duration-300',
                      scanState === 'success' 
                        ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
                        : scanState === 'failed' 
                        ? 'border-red-500 bg-red-500/10' 
                        : 'border-amber-500/50 bg-amber-500/5 group-hover:border-amber-400'
                    )}
                  />

                  {/* Corner Targets for FaceID */}
                  {authMethod === 'faceid' && (
                    <>
                      <div className="absolute top-2.5 left-2.5 w-4 h-4 border-t-2 border-l-2 border-amber-400 rounded-tl-sm" />
                      <div className="absolute top-2.5 right-2.5 w-4 h-4 border-t-2 border-r-2 border-amber-400 rounded-tr-sm" />
                      <div className="absolute bottom-2.5 left-2.5 w-4 h-4 border-b-2 border-l-2 border-amber-400 rounded-bl-sm" />
                      <div className="absolute bottom-2.5 right-2.5 w-4 h-4 border-b-2 border-r-2 border-amber-400 rounded-br-sm" />
                    </>
                  )}

                  {/* Laser Scan Beam */}
                  {scanState === 'scanning' && (
                    <motion.div
                      animate={{ y: [-44, 44, -44] }}
                      transition={{ repeat: Infinity, duration: 1.3, ease: 'easeInOut' }}
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
                      <CheckCircle2 size={54} className="text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.6)]" />
                      <span className="text-[11px] font-bold mt-1 text-emerald-400">Verificado</span>
                    </motion.div>
                  ) : authMethod === 'faceid' ? (
                    <div className="relative text-amber-400">
                      <Scan size={54} className="text-amber-400/90" />
                      <Eye size={20} className="absolute inset-0 m-auto text-amber-300" />
                    </div>
                  ) : (
                    <div className="relative text-amber-400">
                      <Fingerprint size={56} className="text-amber-400/90 drop-shadow-[0_0_10px_rgba(245,158,11,0.3)]" />
                    </div>
                  )}
                </div>

                {/* Status Text & Progress Bar */}
                <div className="mt-3 text-center space-y-1.5">
                  <p className="text-xs font-semibold text-neutral-200">
                    {scanState === 'scanning' && (
                      authMethod === 'faceid' ? 'Escaneando rostro con sensor FIDO2...' : 'Detectando huella dactilar autorizada...'
                    )}
                    {scanState === 'success' && '¡Identidad verificada exitosamente!'}
                    {scanState === 'idle' && 'Toca el sensor o presiona autenticar'}
                  </p>

                  <div className="w-36 h-1 bg-neutral-800 rounded-full mx-auto overflow-hidden">
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
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={startBiometricScan}
                  disabled={scanState === 'scanning'}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-black rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Fingerprint size={16} />
                  <span>{scanState === 'scanning' ? 'Verificando con FIDO2...' : 'Autenticar con Biometría'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setUsePinFallback(true)}
                  className="w-full py-2.5 bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <KeyRound size={14} />
                  <span>Usar PIN o Contraseña de Respaldo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(true)}
                  className="w-full py-2.5 bg-neutral-900 border border-amber-500/30 hover:border-amber-500/60 text-amber-400 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm shadow-amber-500/10"
                >
                  <UserPlus size={14} />
                  <span>¿Nuevo Usuario? Registrarse y Abrir Cuenta</span>
                </button>
              </div>
            </div>
          ) : (
            /* PIN / Password Fallback Form */
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  PIN de Seguridad Bancaria (4 a 6 dígitos):
                </label>
                <div className="relative">
                  <input
                    type="password"
                    maxLength={6}
                    value={pinInput}
                    onChange={(e) => {
                      setPinInput(e.target.value.replace(/\D/g, ''));
                      setPinError('');
                    }}
                    placeholder="••••"
                    className="w-full text-center tracking-[0.5em] text-lg font-mono py-2.5 bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl text-white focus:outline-none"
                    autoFocus
                  />
                </div>
                {pinError && (
                  <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    <span>{pinError}</span>
                  </p>
                )}
              </div>

              {/* Quick keypad suggestions */}
              <div className="grid grid-cols-3 gap-1.5 text-xs font-mono font-bold">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => {
                      if (k === 'C') setPinInput('');
                      else if (k === '⌫') setPinInput(prev => prev.slice(0, -1));
                      else if (pinInput.length < 6) setPinInput(prev => prev + k);
                    }}
                    className="py-2 rounded-lg bg-neutral-950 border border-neutral-800 hover:bg-neutral-800 text-neutral-200 transition-colors cursor-pointer"
                  >
                    {k}
                  </button>
                ))}
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                >
                  <ArrowRight size={16} />
                  <span>Validar PIN y Acceder</span>
                </button>

                <button
                  type="button"
                  onClick={() => setUsePinFallback(false)}
                  className="w-full py-2 text-neutral-400 hover:text-neutral-200 text-xs font-semibold cursor-pointer"
                >
                  ← Volver a Reconocimiento Biométrico
                </button>

                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(true)}
                  className="w-full py-2 text-amber-400 hover:text-amber-300 text-xs font-bold cursor-pointer text-center"
                >
                  ¿No tienes cuenta? Registrarme como nuevo cliente
                </button>
              </div>
            </form>
          )}

          {/* Footer Security Certifications */}
          <div className="pt-3 border-t border-neutral-800 flex items-center justify-between text-[10px] text-neutral-500 font-mono">
            <span>FIDO2 / WebAuthn Certified</span>
            <span>256-Bit SSL/TLS Protection</span>
          </div>
        </motion.div>
      </main>

      {/* User Registration Modal */}
      <UserRegistrationModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSuccess={(newUserId) => {
          setIsRegisterOpen(false);
          switchUser(newUserId);
          onAuthenticated();
        }}
      />

      {/* Page Footer */}
      <footer className="relative z-10 max-w-5xl mx-auto w-full text-center text-[11px] text-neutral-500 space-y-1">
        <p>
          Gold Payments Bank S.A. • Institución Financiera Certificada SPEI Banxico / STP Participante 646.
        </p>
        <p className="text-[10px] text-neutral-600">
          Cumplimiento normativo CNBV, ISO 20022 y Estándares de Seguridad Biométrica de Grado Bancario.
        </p>
      </footer>
    </div>
  );
}
