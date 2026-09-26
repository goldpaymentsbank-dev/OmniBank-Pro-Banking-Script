'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  Globe2, 
  Building2, 
  ArrowRight, 
  ShieldCheck, 
  Clock, 
  Sparkles, 
  Send, 
  HelpCircle, 
  BadgeCheck, 
  Info,
  DollarSign,
  TrendingUp,
  Percent,
  Zap,
  Layers,
  ArrowRightLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  SWIFT_DATABASE, 
  SwiftBankRecord, 
  parseAndValidateSwiftCode, 
  SwiftDecomposition 
} from '@/lib/swiftData';

interface SwiftViewProps {
  onNavigate?: (view: any) => void;
}

export default function SwiftView({ onNavigate }: SwiftViewProps) {
  const [activeTab, setActiveTab] = useState<'search' | 'verify' | 'wise'>('search');
  
  // Tab 1: Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('ALL');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Tab 2: Verification state
  const [verifyInput, setVerifyInput] = useState('BSCHESMMXXX');
  const [verificationResult, setVerificationResult] = useState<SwiftDecomposition | null>(() => 
    parseAndValidateSwiftCode('BSCHESMMXXX')
  );

  // Tab 3: Wise Multi-Currency state
  const [sendAmount, setSendAmount] = useState<string>('1000.00');
  const [sourceCurrency, setSourceCurrency] = useState<'EUR' | 'USD' | 'MXN' | 'GBP'>('EUR');
  const [targetCurrency, setTargetCurrency] = useState<'USD' | 'EUR' | 'MXN' | 'GBP'>('USD');
  const [exchangeRate, setExchangeRate] = useState<number>(1.1400); // 1 EUR = 1.1400 USD
  const guaranteedHours = 96;

  // Extract unique countries
  const countries = useMemo(() => {
    const list = Array.from(new Set(SWIFT_DATABASE.map(b => b.country))).sort();
    return ['ALL', ...list];
  }, []);

  // Filtered banks for Tab 1
  const filteredBanks = useMemo(() => {
    return SWIFT_DATABASE.filter(bank => {
      const matchesCountry = selectedCountry === 'ALL' || bank.country === selectedCountry;
      const query = searchQuery.toLowerCase().trim();
      const matchesQuery = 
        !query ||
        bank.bankName.toLowerCase().includes(query) ||
        bank.swiftCode.toLowerCase().includes(query) ||
        bank.city.toLowerCase().includes(query) ||
        bank.country.toLowerCase().includes(query);
      return matchesCountry && matchesQuery;
    });
  }, [searchQuery, selectedCountry]);

  // Handle Verify Action
  const handleVerify = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const result = parseAndValidateSwiftCode(verifyInput);
    setVerificationResult(result);
  };

  // Copy helper
  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Wise calculation
  const parsedSend = parseFloat(sendAmount) || 0;
  // Wise fee formula: Base transparent fee around 0.62% of amount (6.21 EUR on 1000 EUR)
  const feeEur = parsedSend > 0 ? Math.max(1.50, +(parsedSend * 0.00621).toFixed(2)) : 0;
  const netSend = Math.max(0, parsedSend - feeEur);
  const recipientGets = +(netSend * exchangeRate).toFixed(2);
  const isHighVolumeDiscount = parsedSend >= 25000;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner & Title */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-neutral-900 via-neutral-900 to-amber-950/40 border border-neutral-800 p-6 sm:p-8">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-3">
            <Globe2 size={14} />
            <span>Red Global SWIFT / BIC & Multi-Divisa</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Integra Códigos Swift/BIC
          </h1>

          <p className="mt-2 text-sm text-neutral-300 leading-relaxed">
            Todo lo que necesitas para encontrar el código Swift/BIC correcto para tu transferencia. 
            Busca por banco o país para encontrar el código de sucursal correcto. O, si ya tienes un código, 
            puedes utilizar nuestra herramienta de verificación para asegurarte de que es correcto.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-neutral-800/80">
          <button
            type="button"
            onClick={() => setActiveTab('search')}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer',
              activeTab === 'search'
                ? 'bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/20'
                : 'bg-neutral-800/80 text-neutral-300 hover:text-white hover:bg-neutral-750'
            )}
          >
            <Search size={16} />
            <span>Encontrar un código Swift</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('verify')}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer',
              activeTab === 'verify'
                ? 'bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/20'
                : 'bg-neutral-800/80 text-neutral-300 hover:text-white hover:bg-neutral-750'
            )}
          >
            <BadgeCheck size={16} />
            <span>Verificar un código Swift</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('wise')}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer',
              activeTab === 'wise'
                ? 'bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/20'
                : 'bg-neutral-800/80 text-neutral-300 hover:text-white hover:bg-neutral-750'
            )}
          >
            <Zap size={16} />
            <span>Cotizador Wise & Multi-Divisa (96h Garantizado)</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ENCONTRAR UN CÓDIGO SWIFT */}
      {/* ========================================================================= */}
      {activeTab === 'search' && (
        <div className="space-y-6">
          {/* Search Controls */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 relative">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Busca por banco, código SWIFT, ciudad o país (ej. Santander, BBVA, CITIUS33)..."
                  className="w-full bg-neutral-950 border border-neutral-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700/80 rounded-xl px-3.5 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="ALL">🌍 Todos los países</option>
                  {countries.filter(c => c !== 'ALL').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-800/60 text-xs text-neutral-400">
              <span>Se encontraron <strong className="text-amber-400">{filteredBanks.length}</strong> códigos oficiales en el directorio SWIFT / ISO 9362</span>
              <span>Actualizado en tiempo real</span>
            </div>
          </div>

          {/* Bank Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBanks.map((bank) => (
              <div
                key={bank.swiftCode}
                className="bg-neutral-900 border border-neutral-800 hover:border-amber-500/40 rounded-2xl p-5 transition-all flex flex-col justify-between group shadow-sm hover:shadow-amber-500/5"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl" title={bank.country}>{bank.flag}</span>
                      <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                          {bank.bankName}
                        </h4>
                        <span className="text-[11px] text-neutral-400">
                          {bank.city}, {bank.country} ({bank.countryCode})
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                      {bank.participantType}
                    </span>
                  </div>

                  {/* SWIFT Code Box */}
                  <div className="mt-4 p-3 bg-neutral-950 rounded-xl border border-neutral-800/90 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-neutral-500 uppercase tracking-wider block font-semibold">
                        Código SWIFT / BIC:
                      </span>
                      <span className="text-base font-mono font-bold text-amber-400 tracking-wider">
                        {bank.swiftCode}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(bank.swiftCode)}
                      className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                      title="Copiar código SWIFT"
                    >
                      {copiedCode === bank.swiftCode ? (
                        <Check size={16} className="text-emerald-400" />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                  </div>

                  <div className="mt-3 text-xs text-neutral-400 space-y-1">
                    <p><strong className="text-neutral-300">Sucursal:</strong> {bank.branch}</p>
                    <p className="text-[11px] text-neutral-500 truncate"><strong className="text-neutral-400">Dirección:</strong> {bank.address}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-neutral-800/70 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setVerifyInput(bank.swiftCode);
                      setVerificationResult(parseAndValidateSwiftCode(bank.swiftCode));
                      setActiveTab('verify');
                    }}
                    className="flex-1 py-1.5 px-2 bg-neutral-800 hover:bg-neutral-750 text-neutral-300 rounded-lg text-xs font-medium text-center transition-colors cursor-pointer"
                  >
                    Verificar estructura
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (onNavigate) onNavigate('transfer');
                    }}
                    className="py-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>Usar</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: VERIFICAR UN CÓDIGO SWIFT */}
      {/* ========================================================================= */}
      {activeTab === 'verify' && (
        <div className="space-y-6">
          {/* Tool Card */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-xl">
            <div className="max-w-2xl">
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Verificar un código Swift
              </h2>
              <p className="text-sm text-neutral-300 mt-1">
                Indica un código Swift/BIC para comprobar si es correcto y averiguar a qué banco pertenece.
              </p>
            </div>

            {/* Input Form */}
            <form onSubmit={handleVerify} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-2">
                  Indica un código Swift
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={verifyInput}
                      onChange={(e) => setVerifyInput(e.target.value.toUpperCase())}
                      placeholder="p. ej. AAAA-BB-CC-123"
                      className="w-full bg-neutral-950 border border-neutral-700/80 rounded-xl px-4 py-3 text-base font-mono font-bold text-white tracking-widest uppercase focus:outline-none focus:border-amber-500"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-neutral-500 font-mono">
                      {verifyInput.replace(/[\s\-_/.]/g, '').length} chars
                    </span>
                  </div>

                  <button
                    type="submit"
                    className="py-3 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20 active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
                  >
                    <BadgeCheck size={18} />
                    <span>Verificar un código Swift</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Verification Result Display */}
            {verificationResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 pt-6 border-t border-neutral-800"
              >
                {verificationResult.isValidFormat ? (
                  <div className="space-y-6">
                    {/* Status Badge */}
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
                      <CheckCircle2 size={24} className="text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-bold text-emerald-400">
                          Código Swift/BIC Sintácticamente Válido (ISO 9362)
                        </h4>
                        <p className="text-xs text-neutral-300 mt-0.5">
                          {verificationResult.matchedBank 
                            ? `Identificado exitosamente con ${verificationResult.matchedBank.bankName}.`
                            : 'Formato estructuralmente correcto y listo para transferencias internacionales.'}
                        </p>
                      </div>
                    </div>

                    {/* Breakdown Visualizer */}
                    <div>
                      <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">
                        Desglose y Estructura del Código ({verificationResult.cleanCode})
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-neutral-950 border border-amber-500/30 rounded-xl p-3.5 text-center">
                          <span className="text-[10px] text-neutral-500 font-bold uppercase block mb-1">
                            Código de Banco
                          </span>
                          <span className="text-xl font-mono font-extrabold text-amber-400">
                            {verificationResult.bankCode}
                          </span>
                          <span className="text-[10px] text-neutral-400 block mt-1">
                            4 letras (A-Z)
                          </span>
                        </div>

                        <div className="bg-neutral-950 border border-sky-500/30 rounded-xl p-3.5 text-center">
                          <span className="text-[10px] text-neutral-500 font-bold uppercase block mb-1">
                            Código de País
                          </span>
                          <span className="text-xl font-mono font-extrabold text-sky-400">
                            {verificationResult.countryCode}
                          </span>
                          <span className="text-[10px] text-neutral-400 block mt-1">
                            2 letras (ISO 3166)
                          </span>
                        </div>

                        <div className="bg-neutral-950 border border-indigo-500/30 rounded-xl p-3.5 text-center">
                          <span className="text-[10px] text-neutral-500 font-bold uppercase block mb-1">
                            Ubicación
                          </span>
                          <span className="text-xl font-mono font-extrabold text-indigo-400">
                            {verificationResult.locationCode}
                          </span>
                          <span className="text-[10px] text-neutral-400 block mt-1">
                            2 caracteres (0-9 / A-Z)
                          </span>
                        </div>

                        <div className="bg-neutral-950 border border-emerald-500/30 rounded-xl p-3.5 text-center">
                          <span className="text-[10px] text-neutral-500 font-bold uppercase block mb-1">
                            Sucursal
                          </span>
                          <span className="text-xl font-mono font-extrabold text-emerald-400">
                            {verificationResult.branchCode || 'XXX'}
                          </span>
                          <span className="text-[10px] text-neutral-400 block mt-1">
                            3 dígitos ({verificationResult.branchCode === 'XXX' ? 'Sede Central' : 'Sucursal'})
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Matched Bank Details */}
                    {verificationResult.matchedBank ? (
                      <div className="p-5 bg-neutral-950 border border-neutral-800 rounded-2xl">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">{verificationResult.matchedBank.flag}</span>
                            <div>
                              <h3 className="text-base font-bold text-white">
                                {verificationResult.matchedBank.bankName}
                              </h3>
                              <p className="text-xs text-neutral-400">
                                {verificationResult.matchedBank.city}, {verificationResult.matchedBank.country}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            Red SWIFT Conectada
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-neutral-850 text-xs text-neutral-300">
                          <div>
                            <span className="text-neutral-500 block text-[11px]">Sucursal asignada:</span>
                            <span className="font-semibold">{verificationResult.matchedBank.branch}</span>
                          </div>
                          <div>
                            <span className="text-neutral-500 block text-[11px]">Dirección oficial:</span>
                            <span className="font-semibold">{verificationResult.matchedBank.address}</span>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 flex justify-end">
                          <button
                            type="button"
                            onClick={() => onNavigate && onNavigate('transfer')}
                            className="py-2 px-4 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20"
                          >
                            <span>Proceder con Transferencia</span>
                            <ArrowRight size={14} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-400">
                        <p>
                          El formato es matemáticamente válido según el estándar ISO 9362. Si la entidad es una sucursal local o banco internacional no listado en el directorio rápido, puedes proceder ingresando los datos del beneficiario con total seguridad.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
                    <AlertCircle size={24} className="text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-rose-400">
                        Código Swift/BIC Inválido
                      </h4>
                      <ul className="text-xs text-neutral-300 mt-1 list-disc list-inside space-y-1">
                        {verificationResult.errors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Formato de un código Swift/BIC Educational Section */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8">
            <h3 className="text-lg font-bold text-white mb-2">
              Formato de un código Swift/BIC
            </h3>
            <p className="text-xs text-neutral-400 mb-6 max-w-2xl">
              Un Swift/BIC es un código de 8 a 11 caracteres que identifica tu país, ciudad, banco y sucursal.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-neutral-950/70 border border-neutral-800 rounded-2xl">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-xs mb-3 border border-amber-500/20">
                  1
                </div>
                <h4 className="text-sm font-bold text-white mb-1">Código de banco A-Z</h4>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  4 letras que identifican al banco. Normalmente es una versión abreviada del nombre del banco.
                </p>
              </div>

              <div className="p-4 bg-neutral-950/70 border border-neutral-800 rounded-2xl">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold text-xs mb-3 border border-sky-500/20">
                  2
                </div>
                <h4 className="text-sm font-bold text-white mb-1">Código de país A-Z</h4>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  2 letras que indican el país donde está el banco.
                </p>
              </div>

              <div className="p-4 bg-neutral-950/70 border border-neutral-800 rounded-2xl">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs mb-3 border border-indigo-500/20">
                  3
                </div>
                <h4 className="text-sm font-bold text-white mb-1">Código de ubicación 0-9 A-Z</h4>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  2 caracteres que pueden ser letras o números. Indica dónde se encuentra la oficina central del banco.
                </p>
              </div>

              <div className="p-4 bg-neutral-950/70 border border-neutral-800 rounded-2xl">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs mb-3 border border-emerald-500/20">
                  4
                </div>
                <h4 className="text-sm font-bold text-white mb-1">Código de sucursal 0-9 A-Z</h4>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  3 dígitos que especifican una sucursal en particular. &quot;XXX&quot; representa la oficina central del banco.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: COTIZADOR WISE & MULTI-DIVISA (96H GARANTIZADO) */}
      {/* ========================================================================= */}
      {activeTab === 'wise' && (
        <div className="space-y-6">
          {/* Wise Value Prop Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3">
                <Zap size={20} />
              </div>
              <h3 className="text-sm font-bold text-white">Envía dinero internacionalmente</h3>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                Las transferencias llegan en menos de 20 segundos con enrutamiento prioritario.
              </p>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center mb-3">
                <Globe2 size={20} />
              </div>
              <h3 className="text-sm font-bold text-white">Datos de cuenta global</h3>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                Recibe pagos en múltiples divisas fácilmente (EUR, USD, GBP, MXN) con IBAN y SWIFT dedicados.
              </p>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
                <TrendingUp size={20} />
              </div>
              <h3 className="text-sm font-bold text-white">Ahorra dinero</h3>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                Sin recargos en el tipo de cambio o comisiones ocultas. Tipo de cambio medio real del mercado.
              </p>
            </div>
          </div>

          {/* Interactive Calculator Section */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-xl">
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              {/* Left Column: Calculator Card */}
              <div className="w-full lg:w-3/5 space-y-4">
                {/* Guaranteed Rate Banner */}
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-amber-400 font-bold">
                    <Clock size={16} />
                    <span>Garantizado durante {guaranteedHours} h</span>
                  </div>
                  <span className="font-mono font-bold text-white">
                    1 {sourceCurrency} = {exchangeRate.toFixed(4)} {targetCurrency}
                  </span>
                </div>

                {/* You Send Input */}
                <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl focus-within:border-amber-500 transition-colors">
                  <div className="flex justify-between items-center text-xs text-neutral-400 mb-1">
                    <span>Envías exactamente</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <input
                      type="number"
                      step="any"
                      value={sendAmount}
                      onChange={(e) => setSendAmount(e.target.value)}
                      className="w-full bg-transparent text-2xl sm:text-3xl font-extrabold text-white focus:outline-none"
                    />
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-850 border border-neutral-700 text-sm font-bold text-white shrink-0">
                      <span>{sourceCurrency}</span>
                    </div>
                  </div>
                </div>

                {/* High volume notice */}
                <div className="px-2 text-[11px] text-neutral-400 flex items-center gap-1.5">
                  <Info size={13} className="text-amber-400 shrink-0" />
                  <span>
                    ¿Envías más de 25.000 USD o equivalente? Descontaremos nuestra comisión automáticamente.
                  </span>
                </div>

                {/* Dynamic Fees Breakdown */}
                <div className="p-4 bg-neutral-950/60 border border-neutral-800/80 rounded-2xl text-xs space-y-2.5">
                  <div className="flex justify-between items-center text-neutral-400">
                    <span>Comisiones totales</span>
                    <span className="text-neutral-200 font-semibold">{feeEur.toFixed(2)} {sourceCurrency}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-neutral-500">
                    <span>Se incluyen en la cantidad en {sourceCurrency}</span>
                    <span>Sin cargos ocultos</span>
                  </div>
                  <div className="flex justify-between items-center text-neutral-400 pt-1 border-t border-neutral-850">
                    <span>Llega garantizado</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <Zap size={13} />
                      antes del sábado, 3:00
                    </span>
                  </div>
                </div>

                {/* Recipient Gets Input */}
                <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl">
                  <div className="flex justify-between items-center text-xs text-neutral-400 mb-1">
                    <span>El destinatario recibe</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
                      {recipientGets.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-850 border border-neutral-700 text-sm font-bold text-white shrink-0">
                      <span>{targetCurrency}</span>
                    </div>
                  </div>
                </div>

                {/* Action CTA */}
                <button
                  type="button"
                  onClick={() => onNavigate && onNavigate('transfer')}
                  className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-extrabold rounded-2xl text-sm transition-all shadow-xl shadow-amber-500/20 active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
                >
                  <Send size={18} />
                  <span>Enviar dinero ahora con Tipo de Cambio Garantizado</span>
                </button>
              </div>

              {/* Right Column: Cómo funciona Wise */}
              <div className="w-full lg:w-2/5 p-6 bg-neutral-950/80 border border-neutral-800 rounded-2xl space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-amber-400" />
                  <h3 className="text-base font-bold text-white">Cómo funciona Wise</h3>
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Usa Wise en solo unos sencillos pasos para enviar y recibir divisas con el tipo de cambio oficial del mercado.
                </p>

                <div className="space-y-3.5 pt-2">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </div>
                    <div className="text-xs">
                      <strong className="text-white block">Crea tu cuenta o inicia sesión</strong>
                      <span className="text-neutral-400">Verificación de identidad instantánea mediante biometría.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </div>
                    <div className="text-xs">
                      <strong className="text-white block">Elige la cantidad y moneda</strong>
                      <span className="text-neutral-400">Te mostramos de antemano el tipo de cambio garantizado durante 96 horas.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </div>
                    <div className="text-xs">
                      <strong className="text-white block">Introduce los datos del destinatario</strong>
                      <span className="text-neutral-400">Ingresa su código SWIFT/BIC o número de cuenta local (CLABE o IBAN).</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      4
                    </div>
                    <div className="text-xs">
                      <strong className="text-white block">Paga tu transferencia</strong>
                      <span className="text-neutral-400">Usa saldo Gold Payments Bank o tarjeta autorizada. Liquidación en menos de 20 seg.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
