'use client';

import React, { useState } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  Key, 
  Copy, 
  Check, 
  Plus, 
  ExternalLink, 
  Search, 
  Filter, 
  CreditCard, 
  Laptop, 
  Store, 
  Link2, 
  RefreshCw, 
  AlertTriangle, 
  Printer, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  X, 
  DollarSign, 
  TrendingUp, 
  ArrowUpRight, 
  Sparkles,
  Lock,
  ChevronRight,
  HelpCircle
} from 'lucide-react';
import { useBanking, MidItem } from '@/lib/bankingStore';
import { 
  MCC_CATALOG, 
  validateRfc, 
  validateClabe, 
  MccOption,
  MERU_ORDER_INFO
} from '@/lib/bankingValidation';
import { cn } from '@/lib/utils';

interface MidsViewProps {
  onNavigate?: (view: any) => void;
}

export default function MidsView({ onNavigate }: MidsViewProps) {
  const { mids, registerMid, toggleMidStatus, simulateMidCharge, userClabe, balance } = useBanking();

  // Filters and search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  
  // Registration modal
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [registrationStep, setRegistrationStep] = useState<1 | 2 | 3>(1);

  // Form State for new MID
  const [formBusinessName, setFormBusinessName] = useState('');
  const [formLegalName, setFormLegalName] = useState('');
  const [formRfc, setFormRfc] = useState('');
  const [formMcc, setFormMcc] = useState(MCC_CATALOG[0].code);
  const [formChannel, setFormChannel] = useState<'e_commerce' | 'pos_terminal' | 'payment_link' | 'recurrent'>('e_commerce');
  const [formCurrency, setFormCurrency] = useState<'MXN' | 'USD' | 'MULTI'>('MXN');
  const [formSettlementClabe, setFormSettlementClabe] = useState(userClabe);
  const [formSettlementCycle, setFormSettlementCycle] = useState<'T+0' | 'T+1'>('T+1');
  const [formMonthlyVolume, setFormMonthlyVolume] = useState<number>(500000);
  const [formDiscountRate, setFormDiscountRate] = useState<number>(MCC_CATALOG[0].suggestedTdr);
  const [formFixedFee, setFormFixedFee] = useState<number>(2.50);
  const [formWebhookUrl, setFormWebhookUrl] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Success result after registration
  const [createdMid, setCreatedMid] = useState<MidItem | null>(null);

  // Modals
  const [selectedMidForCertificate, setSelectedMidForCertificate] = useState<MidItem | null>(null);
  const [selectedMidForKeys, setSelectedMidForKeys] = useState<MidItem | null>(null);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [selectedMidForTerminal, setSelectedMidForTerminal] = useState<MidItem | null>(null);
  
  // Terminal test state
  const [terminalAmount, setTerminalAmount] = useState('450.00');
  const [terminalConcept, setTerminalConcept] = useState('Cobro Tarjeta Tienda Online');
  const [terminalProcessing, setTerminalProcessing] = useState(false);
  const [terminalSuccessMsg, setTerminalSuccessMsg] = useState<string | null>(null);

  // Copy feedback
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, keyId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Validations
  const rfcValidation = validateRfc(formRfc);
  const clabeValidation = validateClabe(formSettlementClabe);

  // Handle MCC change to auto-update suggested TDR
  const handleMccSelect = (code: string) => {
    setFormMcc(code);
    const found = MCC_CATALOG.find(m => m.code === code);
    if (found) {
      setFormDiscountRate(found.suggestedTdr);
    }
  };

  // Handle submission of new MID in production mode
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formBusinessName.trim() || !formLegalName.trim() || !rfcValidation.isValid || !clabeValidation.isValid || !acceptedTerms) {
      return;
    }

    const mccObj = MCC_CATALOG.find(m => m.code === formMcc) || MCC_CATALOG[0];

    const newMid = registerMid({
      businessName: formBusinessName.trim(),
      legalName: formLegalName.trim(),
      rfc: formRfc.trim().toUpperCase(),
      mcc: formMcc,
      mccCategory: mccObj.name,
      channel: formChannel,
      currency: formCurrency,
      settlementClabe: formSettlementClabe.trim(),
      settlementCycle: formSettlementCycle,
      discountRatePct: Number(formDiscountRate) || 1.85,
      fixedFee: Number(formFixedFee) || 2.50,
      monthlyVolumeLimit: Number(formMonthlyVolume) || 500000,
      webhookUrl: formWebhookUrl.trim(),
    });

    setCreatedMid(newMid);
    setRegistrationStep(3);
  };

  const resetForm = () => {
    setFormBusinessName('');
    setFormLegalName('');
    setFormRfc('');
    setFormMcc(MCC_CATALOG[0].code);
    setFormChannel('e_commerce');
    setFormCurrency('MXN');
    setFormSettlementClabe(userClabe);
    setFormSettlementCycle('T+1');
    setFormMonthlyVolume(500000);
    setFormDiscountRate(MCC_CATALOG[0].suggestedTdr);
    setFormFixedFee(2.50);
    setFormWebhookUrl('');
    setAcceptedTerms(false);
    setRegistrationStep(1);
    setCreatedMid(null);
  };

  // Process a simulation charge in production mode
  const handleSimulateCharge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMidForTerminal) return;
    const amt = parseFloat(terminalAmount);
    if (isNaN(amt) || amt <= 0) return;

    setTerminalProcessing(true);
    setTerminalSuccessMsg(null);

    setTimeout(() => {
      const result = simulateMidCharge(selectedMidForTerminal.id, amt, terminalConcept);
      setTerminalProcessing(false);
      if (result.success) {
        setTerminalSuccessMsg(`Cobro aprobado exitosamente. Folio SPEI generado. Neto acreditado: $${result.netAmount.toFixed(2)} ${selectedMidForTerminal.currency}`);
        setTimeout(() => {
          setSelectedMidForTerminal(null);
          setTerminalSuccessMsg(null);
        }, 2200);
      }
    }, 1200);
  };

  // Filtering
  const filteredMids = mids.filter(mid => {
    const matchesSearch = 
      mid.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mid.legalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mid.midNumber.includes(searchQuery) ||
      mid.rfc.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesChannel = selectedChannel === 'all' || mid.channel === selectedChannel;
    return matchesSearch && matchesChannel;
  });

  // Aggregated Stats
  const totalVolume = mids.reduce((acc, m) => acc + m.currentVolume, 0);
  const totalTxCount = mids.reduce((acc, m) => acc + m.transactionsCount, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner: Modo Producción Live */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-900 to-amber-950/40 border border-amber-500/30 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                MODO PRODUCCIÓN LIVE
              </span>
              <span className="text-xs text-neutral-400 font-mono bg-neutral-800/80 px-2.5 py-1 rounded-full border border-neutral-700">
                Adquirente Gold Payments Bank (Código 846)
              </span>
              <span className="text-xs text-neutral-400 font-mono bg-neutral-800/80 px-2.5 py-1 rounded-full border border-neutral-700">
                PCI-DSS Level 1 & Banxico SPEI
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-neutral-100 tracking-tight">
              MIDs para Comercios (Afiliación Adquirente)
            </h1>
            <p className="text-sm md:text-base text-neutral-400 max-w-2xl">
              Administración y alta de Identificadores de Comercio (<strong className="text-neutral-200">Merchant IDs</strong>) certificados para procesamiento de pagos con tarjetas Visa/Mastercard y SPEI interbancario en <strong className="text-amber-400">Modo Producción Real</strong>.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            <button
              onClick={() => {
                resetForm();
                setIsRegisterModalOpen(true);
              }}
              id="btn-register-new-mid"
              className="w-full sm:w-auto px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-2xl text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2.5 active:scale-95 cursor-pointer"
            >
              <Plus size={18} className="stroke-[2.5]" />
              <span>Registrar Nuevo MID</span>
            </button>
          </div>
        </div>

        {/* Global Production Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-neutral-800/80">
          <div className="bg-neutral-950/60 p-4 rounded-2xl border border-neutral-800">
            <p className="text-xs text-neutral-400 font-medium">MIDs de Producción</p>
            <p className="text-xl md:text-2xl font-bold text-neutral-100 mt-1">{mids.length} Comercios</p>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-400 font-medium">
              <CheckCircle2 size={13} />
              <span>100% Certificados SAT / CNBV</span>
            </div>
          </div>

          <div className="bg-neutral-950/60 p-4 rounded-2xl border border-neutral-800">
            <p className="text-xs text-neutral-400 font-medium">Volumen Total Procesado</p>
            <p className="text-xl md:text-2xl font-bold text-amber-400 mt-1">
              ${totalVolume.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
            </p>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-neutral-400">
              <TrendingUp size={13} className="text-amber-400" />
              <span>{totalTxCount} transacciones en vivo</span>
            </div>
          </div>

          <div className="bg-neutral-950/60 p-4 rounded-2xl border border-neutral-800">
            <p className="text-xs text-neutral-400 font-medium">Liquidación Media</p>
            <p className="text-xl md:text-2xl font-bold text-neutral-100 mt-1">T+1 Automático</p>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-neutral-400">
              <span>Depósito directo a CLABE SPEI</span>
            </div>
          </div>

          <div className="bg-neutral-950/60 p-4 rounded-2xl border border-neutral-800">
            <p className="text-xs text-neutral-400 font-medium">Tasa de Aprobación</p>
            <p className="text-xl md:text-2xl font-bold text-emerald-400 mt-1">99.4%</p>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-neutral-400">
              <span>3D Secure 2.2 integrado</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Channel Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-neutral-900/60 border border-neutral-800 p-4 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Buscar por MID, Comercio, RFC..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs sm:text-sm text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedChannel('all')}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all",
              selectedChannel === 'all'
                ? "bg-amber-500 text-neutral-950 font-bold"
                : "bg-neutral-800/60 text-neutral-400 hover:text-neutral-200"
            )}
          >
            Todos ({mids.length})
          </button>
          <button
            onClick={() => setSelectedChannel('e_commerce')}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all",
              selectedChannel === 'e_commerce'
                ? "bg-amber-500 text-neutral-950 font-bold"
                : "bg-neutral-800/60 text-neutral-400 hover:text-neutral-200"
            )}
          >
            🌐 E-Commerce & API
          </button>
          <button
            onClick={() => setSelectedChannel('pos_terminal')}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all",
              selectedChannel === 'pos_terminal'
                ? "bg-amber-500 text-neutral-950 font-bold"
                : "bg-neutral-800/60 text-neutral-400 hover:text-neutral-200"
            )}
          >
            💳 Terminal TPV
          </button>
          <button
            onClick={() => setSelectedChannel('payment_link')}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all",
              selectedChannel === 'payment_link'
                ? "bg-amber-500 text-neutral-950 font-bold"
                : "bg-neutral-800/60 text-neutral-400 hover:text-neutral-200"
            )}
          >
            🔗 Link de Pago
          </button>
        </div>
      </div>

      {/* MIDs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filteredMids.map((mid) => {
          const isKoywe = mid.rfc === 'KOY210904NV0';
          const volumePercentage = Math.min(100, (mid.currentVolume / mid.monthlyVolumeLimit) * 100);

          return (
            <div
              key={mid.id}
              className="bg-neutral-900 border border-neutral-800 hover:border-amber-500/40 rounded-3xl p-6 transition-all duration-300 shadow-lg relative flex flex-col justify-between group"
            >
              {/* Card Header */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-center text-amber-400 font-bold text-lg shadow-inner">
                      {mid.channel === 'e_commerce' && <Laptop size={22} />}
                      {mid.channel === 'pos_terminal' && <CreditCard size={22} />}
                      {mid.channel === 'payment_link' && <Link2 size={22} />}
                      {mid.channel === 'recurrent' && <RefreshCw size={22} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-neutral-100">{mid.businessName}</h2>
                        {isKoywe && (
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                            Koywe / NVIO
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-400 font-medium truncate max-w-[260px] sm:max-w-xs">
                        {mid.legalName} &bull; <span className="font-mono text-neutral-300">{mid.rfc}</span>
                      </p>
                    </div>
                  </div>

                  {/* Status badge */}
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5",
                      mid.status === 'active'
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        : "bg-neutral-800 text-neutral-400 border border-neutral-700"
                    )}>
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        mid.status === 'active' ? "bg-emerald-400 animate-pulse" : "bg-neutral-500"
                      )} />
                      {mid.status === 'active' ? 'PROD LIVE' : 'PAUSADO'}
                    </span>
                  </div>
                </div>

                {/* MID Number Bar */}
                <div className="bg-neutral-950 border border-neutral-800/80 rounded-2xl p-3.5 my-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-neutral-400 font-medium">MID de Afiliación:</span>
                    <span className="font-mono text-base font-bold text-amber-400 tracking-wider">
                      {mid.midNumber}
                    </span>
                    <span className="text-[11px] text-neutral-500 font-mono">({mid.terminalId})</span>
                  </div>

                  <button
                    onClick={() => handleCopy(mid.midNumber, `mid-${mid.id}`)}
                    className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-amber-400 font-medium px-2 py-1 rounded-lg hover:bg-neutral-800 transition-colors"
                  >
                    {copiedKey === `mid-${mid.id}` ? (
                      <>
                        <Check size={14} className="text-emerald-400" />
                        <span className="text-emerald-400">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>Copiar MID</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-2 text-xs">
                  <div className="bg-neutral-950/40 p-2.5 rounded-xl border border-neutral-800/50">
                    <span className="text-neutral-500 block text-[11px]">MCC Giro</span>
                    <span className="font-medium text-neutral-200 mt-0.5 block truncate" title={mid.mccCategory}>
                      {mid.mcc} &bull; {mid.mccCategory.split(' ')[0]}
                    </span>
                  </div>

                  <div className="bg-neutral-950/40 p-2.5 rounded-xl border border-neutral-800/50">
                    <span className="text-neutral-500 block text-[11px]">TDR Acordada</span>
                    <span className="font-bold text-emerald-400 mt-0.5 block">
                      {mid.discountRatePct}% + ${mid.fixedFee.toFixed(2)} MXN
                    </span>
                  </div>

                  <div className="bg-neutral-950/40 p-2.5 rounded-xl border border-neutral-800/50">
                    <span className="text-neutral-500 block text-[11px]">Liquidación</span>
                    <span className="font-semibold text-neutral-200 mt-0.5 block">
                      {mid.settlementCycle} SPEI
                    </span>
                  </div>
                </div>

                {/* Settlement Account */}
                <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/60 text-xs flex items-center justify-between my-2">
                  <div>
                    <span className="text-neutral-500 block text-[11px]">CLABE de Depósito (Concentradora):</span>
                    <span className="font-mono text-neutral-200 font-medium tracking-wide">
                      {mid.settlementClabe}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-amber-400/90 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {mid.settlementClabe.startsWith('710') ? 'NVIO Pagos' : 'Gold Payments'}
                  </span>
                </div>

                {/* Volume Progress Bar */}
                <div className="mt-3 space-y-1.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-neutral-400">
                      Volumen Mes: <strong className="text-neutral-200">${mid.currentVolume.toLocaleString('es-MX')} {mid.currency}</strong>
                    </span>
                    <span className="text-neutral-500">
                      Límite: ${mid.monthlyVolumeLimit.toLocaleString('es-MX')} {mid.currency}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(4, volumePercentage)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-4 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedMidForKeys(mid);
                      setShowSecretKey(false);
                    }}
                    className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Ver llaves de API de Producción"
                  >
                    <Key size={13} className="text-amber-400" />
                    <span>API Keys Live</span>
                  </button>

                  <button
                    onClick={() => setSelectedMidForCertificate(mid)}
                    className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Ver Cédula Oficial de Afiliación MID"
                  >
                    <Printer size={13} className="text-neutral-400" />
                    <span>Cédula MID</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedMidForTerminal(mid);
                      setTerminalAmount('450.00');
                      setTerminalConcept(`Venta Online ${mid.businessName}`);
                    }}
                    className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Procesar cobro de prueba en Producción"
                  >
                    <DollarSign size={13} />
                    <span>Cobro Test Live</span>
                  </button>

                  <button
                    onClick={() => toggleMidStatus(mid.id)}
                    className={cn(
                      "px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer",
                      mid.status === 'active'
                        ? "text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10"
                        : "text-emerald-400 hover:bg-emerald-500/10"
                    )}
                    title={mid.status === 'active' ? 'Pausar procesamiento' : 'Reanudar procesamiento'}
                  >
                    {mid.status === 'active' ? 'Pausar' : 'Activar'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredMids.length === 0 && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-12 text-center max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-500 mx-auto">
            <Building2 size={32} />
          </div>
          <h3 className="text-lg font-bold text-neutral-200">No se encontraron MIDs</h3>
          <p className="text-xs text-neutral-400">
            No hay ningún comercio registrado que coincida con el filtro aplicado.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedChannel('all');
            }}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold rounded-xl transition-colors"
          >
            Limpiar filtros
          </button>
        </div>
      )}

      {/* MODAL 1: REGISTRAR NUEVO MID PARA COMERCIO (MODO PRODUCCIÓN) */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-neutral-900 border border-amber-500/30 rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl relative">
            {/* Modal Header */}
            <div className="sticky top-0 bg-neutral-900/95 backdrop-blur-md px-6 py-5 border-b border-neutral-800 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Building2 size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-neutral-100">
                    Registrar Nuevo MID para Comercio
                  </h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold text-emerald-400">Ambiente de Producción Live</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsRegisterModalOpen(false)}
                className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-neutral-200 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Step indicator */}
              <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
                    registrationStep === 1 ? "bg-amber-500 text-neutral-950" : "bg-neutral-800 text-neutral-400"
                  )}>
                    1
                  </div>
                  <span className={cn("text-xs font-medium", registrationStep === 1 ? "text-neutral-100 font-bold" : "text-neutral-400")}>
                    Identidad Fiscal
                  </span>
                </div>
                <div className="w-8 h-0.5 bg-neutral-800" />
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
                    registrationStep === 2 ? "bg-amber-500 text-neutral-950" : "bg-neutral-800 text-neutral-400"
                  )}>
                    2
                  </div>
                  <span className={cn("text-xs font-medium", registrationStep === 2 ? "text-neutral-100 font-bold" : "text-neutral-400")}>
                    Parámetros & Liquidación
                  </span>
                </div>
                <div className="w-8 h-0.5 bg-neutral-800" />
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
                    registrationStep === 3 ? "bg-emerald-500 text-neutral-950" : "bg-neutral-800 text-neutral-400"
                  )}>
                    3
                  </div>
                  <span className={cn("text-xs font-medium", registrationStep === 3 ? "text-emerald-400 font-bold" : "text-neutral-400")}>
                    Emisión Live
                  </span>
                </div>
              </div>

              {/* Alert notice for production mode */}
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">
                <ShieldCheck size={20} className="text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-neutral-300 space-y-1">
                  <p className="font-bold text-amber-300">Certificación de Afiliación en Producción</p>
                  <p>
                    El MID asignado tendrá capacidad inmediata para procesar transacciones bancarias reales de adquirencia nacional e internacional. Asegúrese de que el RFC y la cuenta CLABE coincidan con la razón social declarada.
                  </p>
                </div>
              </div>

              {/* STEP 1: IDENTIDAD FISCAL */}
              {registrationStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                      Nombre Comercial de la Tienda o App <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Tienda Tech Store, Koywe Payments, Farmacia Express"
                      value={formBusinessName}
                      onChange={(e) => setFormBusinessName(e.target.value)}
                      className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-neutral-100 focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                      Razón Social Legal (SAT) <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. SERVICIOS COMERCIALES DIGITALES SA DE CV"
                      value={formLegalName}
                      onChange={(e) => setFormLegalName(e.target.value.toUpperCase())}
                      className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-neutral-100 uppercase focus:outline-none focus:border-amber-500"
                      required
                    />
                    <span className="text-[11px] text-neutral-500 mt-1 block">
                      Tal y como aparece en la Constancia de Situación Fiscal (CSF).
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium text-neutral-300">
                        RFC con Homoclave <span className="text-amber-400">*</span>
                      </label>
                      {formRfc && (
                        <span className={cn(
                          "text-[11px] font-mono font-bold",
                          rfcValidation.isValid ? "text-emerald-400" : "text-rose-400"
                        )}>
                          {rfcValidation.isValid 
                            ? `✓ RFC Válido (${rfcValidation.type === 'moral' ? 'Persona Moral' : 'Persona Física'})` 
                            : 'RFC Inválido'}
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="Ej. KOY210904NV0 o GOPM850314HDF"
                      value={formRfc}
                      onChange={(e) => setFormRfc(e.target.value.toUpperCase())}
                      maxLength={13}
                      className={cn(
                        "w-full px-4 py-3 bg-neutral-950 border rounded-xl text-sm font-mono tracking-wider text-neutral-100 focus:outline-none transition-colors",
                        formRfc 
                          ? rfcValidation.isValid ? "border-emerald-500/50" : "border-rose-500/50"
                          : "border-neutral-800 focus:border-amber-500"
                      )}
                      required
                    />
                    {formRfc && !rfcValidation.isValid && (
                      <p className="text-[11px] text-rose-400 mt-1">{rfcValidation.error}</p>
                    )}
                  </div>

                  {/* MCC Category Selector */}
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                      Giro de Negocio / Merchant Category Code (MCC) <span className="text-amber-400">*</span>
                    </label>
                    <select
                      value={formMcc}
                      onChange={(e) => handleMccSelect(e.target.value)}
                      className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-neutral-200 focus:outline-none focus:border-amber-500"
                    >
                      {MCC_CATALOG.map((mcc) => (
                        <option key={mcc.code} value={mcc.code}>
                          MCC {mcc.code} - {mcc.name} (TDR sugerida: {mcc.suggestedTdr}%)
                        </option>
                      ))}
                    </select>
                    <span className="text-[11px] text-neutral-500 mt-1 block">
                      Determina la clasificación de riesgo ante las marcas Visa, Mastercard y Banxico.
                    </span>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="button"
                      disabled={!formBusinessName.trim() || !formLegalName.trim() || !rfcValidation.isValid}
                      onClick={() => setRegistrationStep(2)}
                      className="px-6 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-neutral-950 font-bold rounded-xl text-sm transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <span>Siguiente: Parámetros de Liquidación</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: PARÁMETROS & LIQUIDACIÓN */}
              {registrationStep === 2 && (
                <div className="space-y-4">
                  {/* Canal de Venta */}
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-2">
                      Canal de Cobro Principal <span className="text-amber-400">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {[
                        { id: 'e_commerce', label: 'E-Commerce / API', icon: Laptop },
                        { id: 'pos_terminal', label: 'Terminal TPV', icon: CreditCard },
                        { id: 'payment_link', label: 'Link de Cobro', icon: Link2 },
                        { id: 'recurrent', label: 'Cobro Recurrente', icon: RefreshCw },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setFormChannel(item.id as any)}
                          className={cn(
                            "p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer",
                            formChannel === item.id
                              ? "bg-amber-500/10 border-amber-500 text-amber-400 font-bold shadow-md shadow-amber-500/5"
                              : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200"
                          )}
                        >
                          <item.icon size={18} />
                          <span className="text-xs">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Settlement CLABE */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium text-neutral-300">
                        Cuenta CLABE Interbancaria de Liquidación <span className="text-amber-400">*</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setFormSettlementClabe(userClabe)}
                          className="text-[11px] text-amber-400 hover:underline"
                        >
                          Usar Gold Payments
                        </button>
                        <span className="text-neutral-600">&bull;</span>
                        <button
                          type="button"
                          onClick={() => setFormSettlementClabe(MERU_ORDER_INFO.clabe)}
                          className="text-[11px] text-emerald-400 hover:underline"
                        >
                          Usar NVIO / Meru
                        </button>
                      </div>
                    </div>

                    <input
                      type="text"
                      placeholder="18 dígitos de CLABE"
                      value={formSettlementClabe}
                      onChange={(e) => setFormSettlementClabe(e.target.value.replace(/\D/g, '').slice(0, 18))}
                      maxLength={18}
                      className={cn(
                        "w-full px-4 py-3 bg-neutral-950 border rounded-xl text-sm font-mono tracking-wider text-neutral-100 focus:outline-none transition-colors",
                        formSettlementClabe.length === 18
                          ? clabeValidation.isValid ? "border-emerald-500/50" : "border-rose-500/50"
                          : "border-neutral-800 focus:border-amber-500"
                      )}
                      required
                    />

                    {formSettlementClabe.length === 18 && (
                      <div className="mt-1.5 flex items-center justify-between text-[11px]">
                        <span className={cn(clabeValidation.isValid ? "text-emerald-400 font-medium" : "text-rose-400")}>
                          {clabeValidation.isValid ? `✓ CLABE Válida: ${clabeValidation.bankName}` : clabeValidation.error}
                        </span>
                        <span className="text-neutral-500 font-mono">Dígito control: {clabeValidation.calculatedControlDigit}</span>
                      </div>
                    )}
                  </div>

                  {/* Settlement Cycle & Currency */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                        Ciclo de Liquidación
                      </label>
                      <select
                        value={formSettlementCycle}
                        onChange={(e) => setFormSettlementCycle(e.target.value as any)}
                        className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-xs sm:text-sm text-neutral-200 focus:outline-none focus:border-amber-500"
                      >
                        <option value="T+1">T+1 (Siguiente día hábil SPEI)</option>
                        <option value="T+0">T+0 (Mismo día - Instantáneo)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                        Moneda Operativa
                      </label>
                      <select
                        value={formCurrency}
                        onChange={(e) => setFormCurrency(e.target.value as any)}
                        className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-xs sm:text-sm text-neutral-200 focus:outline-none focus:border-amber-500"
                      >
                        <option value="MXN">MXN (Pesos Mexicanos)</option>
                        <option value="USD">USD (Dólar Estadounidense)</option>
                        <option value="MULTI">Multidivisa (MXN / USD / EUR)</option>
                      </select>
                    </div>
                  </div>

                  {/* Rates and Volume */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                        TDR (%)
                      </label>
                      <input
                        type="number"
                        step="0.05"
                        value={formDiscountRate}
                        onChange={(e) => setFormDiscountRate(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs sm:text-sm font-mono text-neutral-200"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                        Fijo (MXN)
                      </label>
                      <input
                        type="number"
                        step="0.50"
                        value={formFixedFee}
                        onChange={(e) => setFormFixedFee(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs sm:text-sm font-mono text-neutral-200"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                        Volumen Mensual (MXN)
                      </label>
                      <input
                        type="number"
                        step="50000"
                        value={formMonthlyVolume}
                        onChange={(e) => setFormMonthlyVolume(parseFloat(e.target.value) || 100000)}
                        className="w-full px-3 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs sm:text-sm font-mono text-neutral-200"
                      />
                    </div>
                  </div>

                  {/* Webhook URL (optional) */}
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                      URL de Webhook de Producción (Opcional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://api.tudominio.com/webhooks/goldpayments"
                      value={formWebhookUrl}
                      onChange={(e) => setFormWebhookUrl(e.target.value)}
                      className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs sm:text-sm text-neutral-200 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>

                  {/* Terms checkbox */}
                  <div className="pt-2">
                    <label className="flex items-start gap-3 p-3.5 bg-neutral-950 border border-neutral-800 rounded-2xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={acceptedTerms}
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-amber-500 focus:ring-amber-500/20"
                      />
                      <span className="text-xs text-neutral-300 leading-relaxed">
                        Acepto el contrato de adhesión de Adquirencia Bancaria en <strong>Modo Producción</strong>, certificación PCI-DSS Level 1, y autorizo a Gold Payments Bank a liquidar las ventas directamente en la CLABE registrada.
                      </span>
                    </label>
                  </div>

                  <div className="pt-4 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setRegistrationStep(1)}
                      className="px-4 py-2.5 text-xs text-neutral-400 hover:text-neutral-200 transition-colors"
                    >
                      &larr; Volver
                    </button>

                    <button
                      type="button"
                      disabled={!clabeValidation.isValid || !acceptedTerms}
                      onClick={handleRegisterSubmit}
                      className="px-6 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-neutral-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
                    >
                      <Sparkles size={16} />
                      <span>Emitir y Activar MID en Producción</span>
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: CREATED SUCCESS SCREEN */}
              {registrationStep === 3 && createdMid && (
                <div className="space-y-6 text-center py-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                    <CheckCircle2 size={36} />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-neutral-100">
                      ¡MID de Producción Asignado Exitosamente!
                    </h3>
                    <p className="text-xs text-neutral-400 max-w-md mx-auto">
                      El comercio <strong>{createdMid.businessName}</strong> ha sido dado de alta en los switches adquirentes y se encuentra en estado <span className="text-emerald-400 font-semibold">ACTIVO LIVE</span>.
                    </p>
                  </div>

                  {/* Official Credentials Box */}
                  <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 text-left space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                      <div>
                        <span className="text-xs text-neutral-500 block">Número Oficial de Afiliación (MID):</span>
                        <span className="font-mono text-xl font-bold text-amber-400">{createdMid.midNumber}</span>
                      </div>
                      <button
                        onClick={() => handleCopy(createdMid.midNumber, 'created-mid')}
                        className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        {copiedKey === 'created-mid' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                        <span>Copiar MID</span>
                      </button>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-neutral-500">Llave Pública de Producción (Live):</span>
                        <button
                          onClick={() => handleCopy(createdMid.livePublicKey, 'created-pk')}
                          className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
                        >
                          {copiedKey === 'created-pk' ? 'Copiado' : 'Copiar'}
                        </button>
                      </div>
                      <code className="block p-2.5 bg-neutral-900 rounded-lg text-xs font-mono text-emerald-400 truncate">
                        {createdMid.livePublicKey}
                      </code>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-neutral-500">Llave Secreta de Producción (Live):</span>
                        <button
                          onClick={() => handleCopy(createdMid.liveSecretKey, 'created-sk')}
                          className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
                        >
                          {copiedKey === 'created-sk' ? 'Copiado' : 'Copiar'}
                        </button>
                      </div>
                      <code className="block p-2.5 bg-neutral-900 rounded-lg text-xs font-mono text-amber-400 truncate">
                        {createdMid.liveSecretKey}
                      </code>
                      <span className="text-[10px] text-rose-400 mt-1 block">
                        ⚠️ Mantenga esta llave secreta protegida en su backend. Nunca la exponga en el navegador.
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => {
                        setSelectedMidForCertificate(createdMid);
                        setIsRegisterModalOpen(false);
                      }}
                      className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold rounded-xl text-xs transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <Printer size={15} />
                      <span>Ver Cédula Oficial MID</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsRegisterModalOpen(false);
                        resetForm();
                      }}
                      className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-amber-500/10 cursor-pointer"
                    >
                      Finalizar y Ver MIDs
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: VER LLAVES DE API LIVE */}
      {selectedMidForKeys && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Key size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-neutral-100">Credenciales API Producción Live</h3>
                  <p className="text-xs text-neutral-400">{selectedMidForKeys.businessName} &bull; MID {selectedMidForKeys.midNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMidForKeys(null)}
                className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-neutral-200 flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Public Key */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs text-neutral-400 font-medium">Public API Key (Live)</label>
                  <button
                    onClick={() => handleCopy(selectedMidForKeys.livePublicKey, 'modal-pk')}
                    className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1"
                  >
                    {copiedKey === 'modal-pk' ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    <span>{copiedKey === 'modal-pk' ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl font-mono text-xs text-emerald-400 break-all select-all">
                  {selectedMidForKeys.livePublicKey}
                </div>
              </div>

              {/* Secret Key */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs text-neutral-400 font-medium">Secret API Key (Live)</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowSecretKey(!showSecretKey)}
                      className="text-xs text-neutral-400 hover:text-neutral-200 flex items-center gap-1"
                    >
                      {showSecretKey ? <EyeOff size={13} /> : <Eye size={13} />}
                      <span>{showSecretKey ? 'Ocultar' : 'Revelar'}</span>
                    </button>
                    <button
                      onClick={() => handleCopy(selectedMidForKeys.liveSecretKey, 'modal-sk')}
                      className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1"
                    >
                      {copiedKey === 'modal-sk' ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                      <span>{copiedKey === 'modal-sk' ? 'Copiado' : 'Copiar'}</span>
                    </button>
                  </div>
                </div>
                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl font-mono text-xs text-amber-400 break-all select-all">
                  {showSecretKey ? selectedMidForKeys.liveSecretKey : 'sk_live_gp_••••••••••••••••••••••••••••••••'}
                </div>
              </div>

              {/* Webhook Secret */}
              <div>
                <label className="block text-xs text-neutral-400 font-medium mb-1.5">Endpoint URL para Webhooks</label>
                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl font-mono text-xs text-neutral-300 break-all">
                  {selectedMidForKeys.webhookUrl || 'No configurado (Utiliza la API REST por defecto)'}
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSelectedMidForKeys(null)}
                className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CÉDULA OFICIAL DE AFILIACIÓN (CERTIFICADO IMPRIMIBLE) */}
      {selectedMidForCertificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto print:p-0 print:bg-white">
          <div className="bg-neutral-900 border border-amber-500/30 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6 relative print:border-none print:shadow-none print:max-w-none print:w-full print:bg-white print:text-black">
            {/* Modal Controls (Hidden on print) */}
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800 print:hidden">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                  Cédula Oficial de Afiliación
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer size={14} />
                  <span>Imprimir / PDF</span>
                </button>
                <button
                  onClick={() => setSelectedMidForCertificate(null)}
                  className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-neutral-200 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Printable Document Body */}
            <div className="space-y-6 print:text-neutral-900">
              {/* Institutional Header */}
              <div className="text-center space-y-2 border-b border-neutral-800 pb-6 print:border-neutral-300">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-800 text-neutral-300 text-[11px] font-mono border border-neutral-700 print:bg-neutral-100 print:text-neutral-800">
                  <span>GOLD PAYMENTS BANK S.A. DE C.V. IFPE</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-neutral-100 print:text-neutral-900 tracking-tight">
                  CONSTANCIA DE REGISTRO Y ASIGNACIÓN DE MID
                </h2>
                <p className="text-xs text-neutral-400 print:text-neutral-600">
                  RED ADQUIRENTE NACIONAL &bull; PARTICIPANTE BANXICO SPEI 846 &bull; PROSA / E-GLOBAL
                </p>
              </div>

              {/* Status Ribbon */}
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between print:border-neutral-300 print:bg-neutral-50">
                <div>
                  <span className="text-[11px] text-emerald-400 print:text-emerald-700 font-bold block uppercase tracking-wider">
                    Ambiente Certificado
                  </span>
                  <p className="text-base font-bold text-neutral-100 print:text-neutral-900">
                    Modo Producción Live (Activo)
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-neutral-400 print:text-neutral-600 block">Fecha de Emisión</span>
                  <span className="text-xs font-mono font-bold text-neutral-200 print:text-neutral-900">
                    {selectedMidForCertificate.createdAt}
                  </span>
                </div>
              </div>

              {/* Core Parameters Table */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 print:border-neutral-200 print:bg-neutral-50">
                    <span className="text-neutral-500 print:text-neutral-600 block text-[11px]">MID (Número de Comercio)</span>
                    <span className="text-base font-mono font-bold text-amber-400 print:text-amber-800">
                      {selectedMidForCertificate.midNumber}
                    </span>
                  </div>
                  <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 print:border-neutral-200 print:bg-neutral-50">
                    <span className="text-neutral-500 print:text-neutral-600 block text-[11px]">Terminal Asignada (TID)</span>
                    <span className="text-base font-mono font-bold text-neutral-200 print:text-neutral-900">
                      {selectedMidForCertificate.terminalId}
                    </span>
                  </div>
                </div>

                <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-2.5 text-xs print:border-neutral-200 print:bg-neutral-50">
                  <div className="flex justify-between border-b border-neutral-800/80 pb-2 print:border-neutral-200">
                    <span className="text-neutral-400 print:text-neutral-600">Nombre Comercial:</span>
                    <span className="font-bold text-neutral-100 print:text-neutral-900">{selectedMidForCertificate.businessName}</span>
                  </div>
                  <div className="flex justify-between border-b border-neutral-800/80 pb-2 print:border-neutral-200">
                    <span className="text-neutral-400 print:text-neutral-600">Razón Social:</span>
                    <span className="font-semibold text-neutral-100 print:text-neutral-900">{selectedMidForCertificate.legalName}</span>
                  </div>
                  <div className="flex justify-between border-b border-neutral-800/80 pb-2 print:border-neutral-200">
                    <span className="text-neutral-400 print:text-neutral-600">RFC con Homoclave:</span>
                    <span className="font-mono font-bold text-neutral-100 print:text-neutral-900">{selectedMidForCertificate.rfc}</span>
                  </div>
                  <div className="flex justify-between border-b border-neutral-800/80 pb-2 print:border-neutral-200">
                    <span className="text-neutral-400 print:text-neutral-600">Giro / MCC:</span>
                    <span className="text-neutral-100 print:text-neutral-900">
                      {selectedMidForCertificate.mcc} - {selectedMidForCertificate.mccCategory}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-neutral-800/80 pb-2 print:border-neutral-200">
                    <span className="text-neutral-400 print:text-neutral-600">CLABE Liquidación:</span>
                    <span className="font-mono text-neutral-100 print:text-neutral-900">{selectedMidForCertificate.settlementClabe}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400 print:text-neutral-600">Esquema TDR Acordado:</span>
                    <span className="font-bold text-emerald-400 print:text-emerald-700">
                      {selectedMidForCertificate.discountRatePct}% + ${selectedMidForCertificate.fixedFee.toFixed(2)} MXN
                    </span>
                  </div>
                </div>
              </div>

              {/* Digital Seal Footer */}
              <div className="pt-4 border-t border-neutral-800 space-y-2 print:border-neutral-300 text-[10px] text-neutral-500 print:text-neutral-600">
                <p className="font-mono break-all leading-tight">
                  SELLO DIGITAL ADQUIRENTE GP-BANXICO: 9a8f4c01b49e82104381ff018320492810aa812736192834b928109384910284910293849102
                </p>
                <p>
                  Certificación emitida conforme a las Disposiciones de Carácter General Aplicables a las Redes de Medios de Disposición expedidas por Banco de México y la Comisión Nacional Bancaria y de Valores.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: SIMULADOR DE COBRO EN PRODUCCIÓN (TEST LIVE TERMINAL) */}
      {selectedMidForTerminal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <DollarSign size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-neutral-100">Cobro de Prueba (Modo Producción)</h3>
                  <p className="text-xs text-neutral-400">MID {selectedMidForTerminal.midNumber} &bull; {selectedMidForTerminal.businessName}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMidForTerminal(null)}
                className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-neutral-200 flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {terminalSuccessMsg ? (
              <div className="p-5 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-center space-y-2">
                <CheckCircle2 size={32} className="text-emerald-400 mx-auto" />
                <p className="text-sm font-bold text-emerald-300">¡Transacción Exitosa!</p>
                <p className="text-xs text-neutral-300">{terminalSuccessMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleSimulateCharge} className="space-y-4">
                <div>
                  <label className="block text-xs text-neutral-300 font-medium mb-1.5">
                    Monto de Venta a Procesar ({selectedMidForTerminal.currency})
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 font-bold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="10"
                      value={terminalAmount}
                      onChange={(e) => setTerminalAmount(e.target.value)}
                      className="w-full pl-8 pr-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-base font-bold text-neutral-100 focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-neutral-300 font-medium mb-1.5">
                    Concepto de Venta
                  </label>
                  <input
                    type="text"
                    value={terminalConcept}
                    onChange={(e) => setTerminalConcept(e.target.value)}
                    className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs sm:text-sm text-neutral-200 focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                {/* Calculation preview */}
                {(() => {
                  const gross = parseFloat(terminalAmount) || 0;
                  const fee = (gross * (selectedMidForTerminal.discountRatePct / 100)) + selectedMidForTerminal.fixedFee;
                  const net = Math.max(0, gross - fee);
                  return (
                    <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1 text-xs">
                      <div className="flex justify-between text-neutral-400">
                        <span>Comisión TDR ({selectedMidForTerminal.discountRatePct}% + ${selectedMidForTerminal.fixedFee}):</span>
                        <span className="text-neutral-200">-${fee.toFixed(2)} MXN</span>
                      </div>
                      <div className="flex justify-between text-neutral-100 font-bold pt-1 border-t border-neutral-800">
                        <span>Neto a Liquidar en Cuenta:</span>
                        <span className="text-emerald-400">${net.toFixed(2)} {selectedMidForTerminal.currency}</span>
                      </div>
                    </div>
                  );
                })()}

                <button
                  type="submit"
                  disabled={terminalProcessing}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 font-bold rounded-xl text-sm transition-all shadow-md shadow-amber-500/10 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {terminalProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                      <span>Procesando en Red Adquirente...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>Autorizar Cobro Live</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
