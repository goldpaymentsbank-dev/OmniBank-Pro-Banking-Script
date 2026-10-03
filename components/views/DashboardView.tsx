'use client';

import { useState, useMemo } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  ArrowDownLeft,
  CreditCard, 
  Wallet, 
  Send, 
  RefreshCcw, 
  Plus, 
  X, 
  CheckCircle2, 
  Copy, 
  Check, 
  Search,
  Building2,
  Heart,
  Bitcoin,
  Eye,
  ArrowRight,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { cn } from '@/lib/utils';
import { useBanking, TransactionItem } from '@/lib/bankingStore';
import TransactionReceiptModal from '@/components/TransactionReceiptModal';
import Plus500PaymentModal from '@/components/Plus500PaymentModal';
import MercadoPagoWithdrawModal from '@/components/MercadoPagoWithdrawModal';

export default function DashboardView({ onNavigate }: { onNavigate: (view: any) => void }) {
  const { 
    balance, 
    userClabe, 
    cards, 
    transactions, 
    cryptoBtc, 
    btcPrice, 
    depositFunds,
    mids,
    morseBeneficiary
  } = useBanking();

  // Modals state
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isPlus500ModalOpen, setIsPlus500ModalOpen] = useState(false);
  const [isMpWithdrawModalOpen, setIsMpWithdrawModalOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositMethod, setDepositMethod] = useState<'spei' | 'card' | 'crypto'>('spei');
  const [depositSuccess, setDepositSuccess] = useState('');

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const [selectedTransaction, setSelectedTransaction] = useState<TransactionItem | null>(null);
  const [copiedClabe, setCopiedClabe] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // Recharts 7-Day Trend Mode: 'flow' (Ingresos vs Egresos), 'balance' (Evolución Saldo), 'volume' (Volumen Diario)
  const [chartMode, setChartMode] = useState<'flow' | 'balance' | 'volume'>('flow');
  const [referenceTime] = useState(() => Date.now());

  // Compute past 7 days trend using real transaction data from the banking store
  const past7DaysData = useMemo(() => {
    const days: {
      key: string;
      name: string;
      fullDate: string;
      inflow: number;
      outflow: number;
      net: number;
      volume: number;
      balance: number;
      count: number;
    }[] = [];

    const now = new Date(referenceTime);
    // Build array for last 7 days (index 0 = 6 days ago, index 6 = today)
    for (let i = 6; i >= 0; i--) {
      const d = new Date(referenceTime);
      d.setDate(now.getDate() - i);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      
      let dayLabel = '';
      if (i === 0) {
        dayLabel = 'Hoy';
      } else if (i === 1) {
        dayLabel = 'Ayer';
      } else {
        const weekday = d.toLocaleDateString('es-ES', { weekday: 'short' });
        dayLabel = weekday.charAt(0).toUpperCase() + weekday.slice(1, 3);
      }

      const fullDate = d.toLocaleDateString('es-ES', { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short' 
      });

      days.push({
        key: dateKey,
        name: dayLabel,
        fullDate,
        inflow: 0,
        outflow: 0,
        net: 0,
        volume: 0,
        balance: 0,
        count: 0,
      });
    }

    // Accumulate transactions for each day
    transactions.forEach((tx) => {
      let txTime = tx.timestamp;
      if (!txTime) {
        if (typeof tx.date === 'string' && tx.date.toLowerCase().includes('hoy')) {
          txTime = referenceTime;
        } else if (typeof tx.date === 'string' && tx.date.toLowerCase().includes('ayer')) {
          txTime = referenceTime - 86400000;
        } else {
          txTime = referenceTime;
        }
      }

      const txDate = new Date(txTime);
      const txKey = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}-${String(txDate.getDate()).padStart(2, '0')}`;

      const targetDay = days.find((d) => d.key === txKey);
      if (targetDay) {
        const amt = Math.abs(Number(tx.amount) || 0);
        targetDay.count += 1;
        targetDay.volume += amt;
        if (tx.type === 'received') {
          targetDay.inflow += amt;
          targetDay.net += amt;
        } else {
          targetDay.outflow += amt;
          targetDay.net -= amt;
        }
      }
    });

    // Reconstruct backwards historical balance trajectory up to current balance
    let rollingBalance = balance;
    days[6].balance = Number(rollingBalance.toFixed(2));

    for (let i = 5; i >= 0; i--) {
      rollingBalance = rollingBalance - days[i + 1].net;
      days[i].balance = Math.max(0, Number(rollingBalance.toFixed(2)));
    }

    return days;
  }, [transactions, balance, referenceTime]);

  const sevenDayTotals = useMemo(() => {
    return past7DaysData.reduce(
      (acc, day) => {
        acc.inflow += day.inflow;
        acc.outflow += day.outflow;
        acc.volume += day.volume;
        acc.count += day.count;
        return acc;
      },
      { inflow: 0, outflow: 0, volume: 0, count: 0 }
    );
  }, [past7DaysData]);

  const activeCard = cards[0];
  const cryptoValue = cryptoBtc * btcPrice;

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(depositAmount);
    if (!amountNum || amountNum <= 0) return;

    const methodName = depositMethod === 'spei' ? 'SPEI Banxico' : depositMethod === 'card' ? 'Tarjeta Bancaria' : 'Criptomoneda';
    depositFunds(amountNum, methodName);
    setDepositSuccess(`¡Depósito de $${amountNum.toFixed(2)} USD acreditado con éxito!`);
    
    setTimeout(() => {
      setDepositSuccess('');
      setIsDepositModalOpen(false);
      setDepositAmount('');
    }, 1500);
  };

  const copyClabe = () => {
    navigator.clipboard?.writeText(userClabe);
    setCopiedClabe(true);
    setTimeout(() => setCopiedClabe(false), 2000);
  };

  const copyKey = (key: string) => {
    navigator.clipboard?.writeText(key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const filteredTransactions = transactions.filter((tx) => {
    const matchesCategory = categoryFilter === 'all' || tx.category === categoryFilter;
    const matchesSearch = tx.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
                          tx.recipientOrSender.toLowerCase().includes(searchFilter.toLowerCase()) ||
                          (tx.trackingKey && tx.trackingKey.toLowerCase().includes(searchFilter.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-100">Hola de nuevo, John</h1>
          <p className="text-neutral-400 text-sm mt-0.5">
            CLABE Interbancaria SPEI: <span className="font-mono text-amber-400 font-semibold">{userClabe}</span>
            <button 
              onClick={copyClabe}
              className="ml-2 inline-flex items-center text-xs text-neutral-400 hover:text-neutral-200 underline"
            >
              {copiedClabe ? 'Copiada ✓' : 'Copiar'}
            </button>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            id="btn-mercadopago-withdraw-dash"
            onClick={() => setIsMpWithdrawModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-neutral-950 rounded-xl font-bold transition-all text-sm shadow-md shadow-sky-500/20 cursor-pointer"
          >
            <ArrowDownLeft size={16} className="stroke-[2.5]" />
            <span>Retirar MXN (Mercado Pago)</span>
          </button>
          <button 
            onClick={() => setIsDepositModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl font-semibold hover:bg-emerald-500/20 transition-colors text-sm"
          >
            <Plus size={16} />
            <span>Recargar Saldo</span>
          </button>
          <button 
            onClick={() => onNavigate('transfer')}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-neutral-950 rounded-xl font-bold hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/10 text-sm"
          >
            <Send size={16} />
            <span>Transferir</span>
          </button>
          <button 
            id="btn-plus500-dash-shortcut"
            onClick={() => setIsPlus500ModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 rounded-xl font-bold transition-all text-sm shadow-md shadow-amber-500/20"
          >
            <Building2 size={16} />
            <span>Pagar Plus500 (MXN)</span>
          </button>
          <button 
            id="btn-morse-dash-shortcut"
            onClick={() => onNavigate('morse')}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500/10 to-amber-600/10 hover:from-amber-500/20 hover:to-amber-600/20 text-amber-300 rounded-xl font-semibold transition-colors text-sm border border-amber-500/30"
          >
            <Send size={16} className="text-amber-400" />
            <span>Beneficiario Morse (ACH)</span>
          </button>
          <button 
            id="btn-crypto-dash-shortcut"
            onClick={() => onNavigate('crypto')}
            className="flex items-center gap-2 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl font-semibold transition-colors text-sm border border-neutral-700/60"
          >
            <Bitcoin size={16} className="text-amber-400" />
            <span>Enviar / Operar Cripto</span>
          </button>
        </div>
      </div>

      {/* Main Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Balance & 7-Day Trend Card */}
        <div className="md:col-span-2 p-6 rounded-3xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-neutral-400 text-xs font-medium uppercase tracking-wider">Balance General Consolidado (USD)</p>
                <span className="text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <TrendingUp size={11} /> Tendencia 7 días
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-neutral-100 font-mono">
                ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex items-center bg-neutral-950 p-1 rounded-xl border border-neutral-800 shrink-0 text-xs font-medium">
              <button
                type="button"
                onClick={() => setChartMode('flow')}
                className={cn(
                  'px-2.5 py-1 rounded-lg transition-all cursor-pointer text-xs',
                  chartMode === 'flow'
                    ? 'bg-neutral-800 text-emerald-400 font-bold shadow'
                    : 'text-neutral-400 hover:text-neutral-200'
                )}
              >
                Ingresos vs Egresos
              </button>
              <button
                type="button"
                onClick={() => setChartMode('balance')}
                className={cn(
                  'px-2.5 py-1 rounded-lg transition-all cursor-pointer text-xs',
                  chartMode === 'balance'
                    ? 'bg-neutral-800 text-amber-400 font-bold shadow'
                    : 'text-neutral-400 hover:text-neutral-200'
                )}
              >
                Evolución Saldo
              </button>
              <button
                type="button"
                onClick={() => setChartMode('volume')}
                className={cn(
                  'px-2.5 py-1 rounded-lg transition-all cursor-pointer text-xs',
                  chartMode === 'volume'
                    ? 'bg-neutral-800 text-sky-400 font-bold shadow'
                    : 'text-neutral-400 hover:text-neutral-200'
                )}
              >
                Volumen Diario
              </button>
            </div>
          </div>

          {/* 7-Day Metric Quick Badges */}
          <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-2xl bg-neutral-950/60 border border-neutral-800/80 mb-3 text-xs">
            <div>
              <span className="text-[10px] text-neutral-500 block">Ingresos 7d:</span>
              <span className="font-mono font-bold text-emerald-400">
                +${sevenDayTotals.inflow.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-neutral-500 block">Egresos 7d:</span>
              <span className="font-mono font-bold text-rose-400">
                -${sevenDayTotals.outflow.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-neutral-500 block">Operaciones 7d:</span>
              <span className="font-mono font-semibold text-neutral-300">
                {sevenDayTotals.count} {sevenDayTotals.count === 1 ? 'operación' : 'operaciones'}
              </span>
            </div>
          </div>

          {/* Recharts Line Chart */}
          <div className="h-[210px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={past7DaysData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#737373" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={{ stroke: '#333' }}
                />
                <YAxis 
                  stroke="#737373" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={{ stroke: '#333' }}
                  tickFormatter={(val) => `$${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const dataPoint = payload[0].payload;
                      return (
                        <div className="bg-neutral-900 border border-neutral-700/80 rounded-xl p-3 shadow-2xl text-xs space-y-1.5 font-mono">
                          <p className="font-sans font-bold text-neutral-200 border-b border-neutral-800 pb-1 flex justify-between gap-4">
                            <span>{dataPoint.fullDate}</span>
                            <span className="text-neutral-400 font-normal">{dataPoint.count} op{dataPoint.count === 1 ? '' : 's'}</span>
                          </p>
                          {chartMode === 'flow' ? (
                            <>
                              <p className="text-emerald-400 flex justify-between gap-4">
                                <span>Ingresos:</span>
                                <strong className="font-bold">+${dataPoint.inflow.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
                              </p>
                              <p className="text-rose-400 flex justify-between gap-4">
                                <span>Egresos:</span>
                                <strong className="font-bold">-${dataPoint.outflow.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
                              </p>
                              <p className="text-neutral-400 flex justify-between gap-4 border-t border-neutral-800 pt-1">
                                <span>Flujo Neto:</span>
                                <strong className={dataPoint.net >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                  {dataPoint.net >= 0 ? '+' : '-'}${Math.abs(dataPoint.net).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </strong>
                              </p>
                            </>
                          ) : chartMode === 'balance' ? (
                            <p className="text-amber-400 flex justify-between gap-4">
                              <span>Saldo al Cierre:</span>
                              <strong className="font-bold">${dataPoint.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
                            </p>
                          ) : (
                            <p className="text-sky-400 flex justify-between gap-4">
                              <span>Volumen Transaccionado:</span>
                              <strong className="font-bold">${dataPoint.volume.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
                            </p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend 
                  verticalAlign="top" 
                  align="right" 
                  height={28}
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px', paddingBottom: '4px' }}
                />
                {chartMode === 'flow' && (
                  <>
                    <Line 
                      type="monotone" 
                      dataKey="inflow" 
                      name="Ingresos (+$)" 
                      stroke="#10b981" 
                      strokeWidth={2.5} 
                      dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} 
                      activeDot={{ r: 6, fill: '#34d399' }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="outflow" 
                      name="Egresos (-$)" 
                      stroke="#ef4444" 
                      strokeWidth={2.5} 
                      dot={{ r: 4, fill: '#ef4444', strokeWidth: 0 }} 
                      activeDot={{ r: 6, fill: '#f87171' }} 
                    />
                  </>
                )}
                {chartMode === 'balance' && (
                  <Line 
                    type="monotone" 
                    dataKey="balance" 
                    name="Saldo Estimado ($)" 
                    stroke="#f59e0b" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#f59e0b', strokeWidth: 0 }} 
                    activeDot={{ r: 6, fill: '#fbbf24' }} 
                  />
                )}
                {chartMode === 'volume' && (
                  <Line 
                    type="monotone" 
                    dataKey="volume" 
                    name="Volumen Diario ($)" 
                    stroke="#38bdf8" 
                    strokeWidth={2.5} 
                    dot={{ r: 4, fill: '#38bdf8', strokeWidth: 0 }} 
                    activeDot={{ r: 6, fill: '#7dd3fc' }} 
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Side Cards */}
        <div className="space-y-6 flex flex-col justify-between">
          {/* Crypto Holding Card */}
          <div 
            onClick={() => onNavigate('crypto')}
            className="p-6 rounded-3xl bg-gradient-to-br from-indigo-950 via-neutral-900 to-indigo-900 border border-indigo-500/30 text-white relative overflow-hidden cursor-pointer hover:border-indigo-500/50 transition-all shadow-lg"
          >
            <div className="flex justify-between items-start mb-2">
              <p className="text-indigo-300 font-semibold text-xs tracking-wider uppercase">Custodia Cripto</p>
              <Bitcoin size={20} className="text-amber-400" />
            </div>
            <h3 className="text-2xl font-bold font-mono mb-1">
              ${cryptoValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-indigo-300/80 mb-4">{cryptoBtc.toFixed(4)} BTC @ ${btcPrice.toLocaleString()} USD</p>
            <div className="flex items-center justify-between text-xs pt-2 border-t border-indigo-500/20">
              <span className="text-emerald-400 font-medium">+3.4% Hoy</span>
              <span className="text-indigo-200 font-semibold flex items-center gap-1">
                Operar &rarr;
              </span>
            </div>
          </div>

          {/* Virtual Card Preview */}
          {activeCard && (
            <div 
              onClick={() => onNavigate('cards')}
              className="p-6 rounded-3xl bg-neutral-900 border border-neutral-800 hover:border-amber-500/40 transition-all cursor-pointer shadow-lg space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                    <CreditCard size={18} />
                  </div>
                  <span className="text-xs font-semibold text-neutral-300">Tarjeta {activeCard.brand}</span>
                </div>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono font-bold">
                  Luhn OK
                </span>
              </div>
              <p className="font-mono text-base font-bold text-neutral-100 tracking-wider">
                •••• •••• •••• {activeCard.number.slice(-4)}
              </p>
              <div className="flex justify-between text-xs text-neutral-400 pt-1 border-t border-neutral-800/80">
                <span>Exp: {activeCard.exp}</span>
                <span className="text-amber-400 font-semibold">Administrar tarjeta &rarr;</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Plus500 Beneficiary & Payment Widget */}
      <div className="bg-gradient-to-r from-neutral-900 via-amber-950/20 to-neutral-950 border border-amber-500/40 rounded-3xl p-5 md:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center font-black text-xl text-amber-400 shrink-0">
              <Building2 size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Orden de Pago Plus500SEY Ltd
                </span>
                <span className="text-[11px] text-neutral-300 font-mono">Deutsche Bank AG (Frankfurt)</span>
                <span className="text-[11px] bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded-md font-bold">MXN</span>
              </div>
              <p className="text-base sm:text-lg font-bold text-neutral-100 mt-1">
                Depósito Internacional a Plus500 &bull; Referencia: <span className="font-mono text-amber-300 font-black">185591571</span>
              </p>
              <p className="text-xs text-neutral-400 mt-0.5">
                IBAN: <strong className="font-mono text-neutral-200">DE98 5007 0010 0176 9009 04</strong> &bull; BIC: <span className="font-mono text-neutral-300">DEUTDEFFXXX</span> &bull; Cuenta: <span className="font-mono text-neutral-300">176900904</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsPlus500ModalOpen(true)}
              id="btn-dash-pay-plus500"
              className="flex-1 sm:flex-initial px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-black rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2"
            >
              <Send size={15} />
              <span>Pagar Orden Ahora</span>
            </button>
          </div>
        </div>
      </div>

      {/* Meru Deposit Order Widget (KOYWE / NVIO) */}
      <div className="bg-gradient-to-r from-[#15171c] via-neutral-900 to-[#15171c] border border-amber-500/30 rounded-3xl p-5 md:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center shrink-0 overflow-hidden shadow-md">
              <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
                <path fill="#006847" d="M0 0h213.3v480H0z"/>
                <path fill="#fff" d="M213.3 0h213.4v480H213.3z"/>
                <path fill="#ce1126" d="M426.7 0H640v480H426.7z"/>
                <circle cx="320" cy="240" r="45" fill="#a0522d" opacity="0.8"/>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                  Depósito Meru Pendiente
                </span>
                <span className="text-[11px] text-neutral-400">SPEI NVIO</span>
              </div>
              <p className="text-base sm:text-lg font-bold text-neutral-100 mt-1">
                1.720,00 MXN <span className="text-sm font-normal text-neutral-400">para</span> KOYWE S de RL de CV
              </p>
              <p className="text-xs text-neutral-400 font-mono mt-0.5">
                CLABE: <span className="text-amber-300 font-semibold">710969000021584949</span> &bull; Institución: NVIO
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onNavigate('meru')}
              id="btn-goto-meru-flow"
              className="flex-1 sm:flex-initial px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-amber-500/10 flex items-center justify-center gap-2"
            >
              <span>Completar y Subir Soporte</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Morse Beneficiary & ACH Transfer Widget */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-900/95 to-neutral-950 border border-amber-500/30 rounded-3xl p-5 md:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-emerald-500/20 border border-amber-500/30 flex items-center justify-center font-black text-xl text-amber-400 shrink-0">
              M
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Beneficiario Morse Activo (ACH)
                </span>
                <span className="text-[11px] text-neutral-400 font-mono">Routing: {morseBeneficiary.routingNumber}</span>
                <span className="text-[11px] bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded-md">Checking</span>
              </div>
              <p className="text-base sm:text-lg font-bold text-neutral-100 mt-1">
                Transferencias ACH a tu Cuenta Morse (Euros o Dólares Digitales)
              </p>
              <p className="text-xs text-neutral-400 mt-0.5">
                Titular: <strong className="text-neutral-200">{morseBeneficiary.holderName}</strong> &bull; Banco: <span className="text-neutral-300">{morseBeneficiary.bankName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onNavigate('morse')}
              id="btn-goto-morse-flow"
              className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-amber-500/10 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Gestionar Morse y Enviar ACH</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Comercios & MIDs en Modo Producción Widget */}
      <div className="bg-neutral-900 border border-neutral-800 hover:border-amber-500/40 rounded-3xl p-5 md:p-6 transition-all shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Building2 size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  MIDs en Modo Producción
                </span>
                <span className="text-xs text-neutral-400">{mids.length} Afiliaciones Activas</span>
              </div>
              <p className="text-sm sm:text-base font-bold text-neutral-200 mt-1">
                Adquirencia y Procesamiento de Pagos para Comercios
              </p>
              <p className="text-xs text-neutral-400 mt-0.5">
                Emisión de Merchant IDs (MIDs) certificados con SPEI y tarjetas Visa/Mastercard.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onNavigate('mids')}
              id="btn-goto-mids-flow"
              className="w-full sm:w-auto px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-amber-400 font-bold rounded-xl text-xs sm:text-sm transition-all border border-neutral-700 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Gestionar y Registrar Nuevos MIDs</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Transactions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-neutral-100">Actividad Reciente y Comprobantes</h3>
            <p className="text-xs text-neutral-400">Haz clic en cualquier movimiento para ver su folio y recibo oficial.</p>
          </div>
          <button 
            onClick={() => setIsHistoryModalOpen(true)}
            className="text-xs font-semibold text-amber-400 hover:text-amber-300 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors"
          >
            Ver Todas ({transactions.length})
          </button>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-xl divide-y divide-neutral-800/80">
          {transactions.slice(0, 5).map((tx) => (
            <div 
              key={tx.id} 
              onClick={() => setSelectedTransaction(tx)}
              className="flex items-center justify-between p-4.5 hover:bg-neutral-800/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-11 h-11 rounded-2xl flex items-center justify-center shrink-0",
                  tx.type === 'received' 
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                )}>
                  {tx.type === 'received' ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
                </div>
                <div>
                  <p className="font-semibold text-sm text-neutral-200">{tx.title}</p>
                  <p className="text-xs text-neutral-400 mt-0.5">{tx.recipientOrSender} &bull; {tx.date}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={cn(
                  "font-mono font-bold text-sm",
                  tx.type === 'received' ? "text-emerald-400" : "text-neutral-200"
                )}>
                  {tx.type === 'received' ? '+' : '-'}${tx.amount.toFixed(2)} USD
                </p>
                <div className="flex items-center justify-end gap-1 mt-0.5">
                  <span className="text-[10px] bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded capitalize">
                    {tx.category.toUpperCase()}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-medium">Liquidado ✓</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL: Deposit Funds / Recargar Saldo */}
      {isDepositModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 md:p-8 max-w-md w-full space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-neutral-100">Recargar Saldo a la Cuenta</h3>
              <button 
                onClick={() => setIsDepositModalOpen(false)}
                className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-neutral-100"
              >
                <X size={20} />
              </button>
            </div>

            {depositSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-center text-sm font-semibold">
                {depositSuccess}
              </div>
            ) : (
              <form onSubmit={handleDeposit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-2">Canal de Depósito</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'spei', label: 'SPEI / CLABE', icon: Building2 },
                      { id: 'card', label: 'Tarjeta', icon: CreditCard },
                      { id: 'crypto', label: 'Cripto BTC', icon: Bitcoin },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setDepositMethod(m.id as any)}
                        className={cn(
                          "p-2.5 rounded-xl border text-center text-xs font-semibold flex flex-col items-center gap-1.5 transition-all",
                          depositMethod === m.id
                            ? "bg-amber-500 text-neutral-950 border-amber-500 font-bold"
                            : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                        )}
                      >
                        <m.icon size={16} />
                        <span>{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-2">Monto a Recargar (USD)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-bold">$</span>
                    <input 
                      type="number" 
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-8 pr-4 py-3 text-neutral-100 text-lg font-mono focus:outline-none focus:border-amber-500"
                      placeholder="500.00"
                      min="1"
                      step="0.01"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  {[100, 250, 500, 1000].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setDepositAmount(val.toString())}
                      className="flex-1 py-1 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-xs text-neutral-400"
                    >
                      +${val}
                    </button>
                  ))}
                </div>

                <button 
                  type="submit"
                  className="w-full py-3.5 bg-emerald-500 text-emerald-950 font-bold rounded-xl hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/10 text-sm mt-2"
                >
                  Acreditar Depósito Inmediato
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL: Full Transaction History with Filters */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 md:p-8 max-w-3xl w-full space-y-5 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-neutral-100">Historial Completo de Movimientos</h3>
              <button 
                onClick={() => setIsHistoryModalOpen(false)}
                className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-neutral-100"
              >
                <X size={20} />
              </button>
            </div>

            {/* Filter controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input 
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Buscar por concepto, destinatario o folio..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-4 py-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-1 overflow-x-auto pb-1">
                {['all', 'spei', 'gofundme', 'card', 'crypto', 'deposit'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap capitalize transition-colors",
                      categoryFilter === cat ? "bg-amber-500 text-neutral-950 font-bold" : "bg-neutral-950 text-neutral-400 border border-neutral-800"
                    )}
                  >
                    {cat === 'all' ? 'Todos' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 divide-y divide-neutral-800/80">
              {filteredTransactions.map((tx) => (
                <div 
                  key={tx.id}
                  onClick={() => {
                    setSelectedTransaction(tx);
                    setIsHistoryModalOpen(false);
                  }}
                  className="p-3.5 flex items-center justify-between hover:bg-neutral-800/50 rounded-xl cursor-pointer transition-colors"
                >
                  <div className="space-y-0.5">
                    <p className="font-semibold text-sm text-neutral-200">{tx.title}</p>
                    <p className="text-xs text-neutral-400">{tx.recipientOrSender} &bull; {tx.date}</p>
                    {tx.trackingKey && (
                      <p className="text-[10px] font-mono text-amber-400/80">Folio: {tx.trackingKey}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "font-mono font-bold text-sm",
                      tx.type === 'received' ? "text-emerald-400" : "text-neutral-200"
                    )}>
                      {tx.type === 'received' ? '+' : '-'}${tx.amount.toFixed(2)} USD
                    </p>
                    <span className="text-[10px] text-emerald-400">Ver Recibo &rarr;</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Detailed Printable Transaction Receipt Modal */}
      <TransactionReceiptModal 
        transaction={selectedTransaction} 
        onClose={() => setSelectedTransaction(null)} 
      />

      {/* Plus500 Direct Payment Modal */}
      <Plus500PaymentModal
        isOpen={isPlus500ModalOpen}
        onClose={() => setIsPlus500ModalOpen(false)}
        onViewReceipt={(tx) => setSelectedTransaction(tx)}
      />

      {/* Mercado Pago SPEI Withdrawal Modal */}
      <MercadoPagoWithdrawModal
        isOpen={isMpWithdrawModalOpen}
        onClose={() => setIsMpWithdrawModalOpen(false)}
        onViewReceipt={(tx) => setSelectedTransaction(tx)}
      />
    </div>
  );
}
