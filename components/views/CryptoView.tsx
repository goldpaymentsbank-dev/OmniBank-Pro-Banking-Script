'use client';

import { useState } from 'react';
import { 
  Bitcoin, 
  ArrowUpRight, 
  ArrowDownRight, 
  RefreshCcw, 
  CheckCircle2, 
  AlertCircle,
  Coins,
  Send,
  ShieldCheck,
  Zap,
  Wallet,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AreaChart, Area, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useBanking } from '@/lib/bankingStore';
import SendCryptoModal from '@/components/SendCryptoModal';
import { CryptoAsset } from '@/lib/bankingValidation';

const btcData = [
  { name: '10:00', price: 62400 },
  { name: '11:00', price: 62800 },
  { name: '12:00', price: 61500 },
  { name: '13:00', price: 63200 },
  { name: '14:00', price: 64100 },
  { name: '15:00', price: 63900 },
  { name: '16:00', price: 64540 },
];

export default function CryptoView() {
  const { 
    balance, 
    cryptoBtc, 
    cryptoEth, 
    cryptoUsdt, 
    cryptoSol, 
    btcPrice, 
    cryptoPrices, 
    tradeCrypto 
  } = useBanking();

  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [tradeMessage, setTradeMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // State for Send to Wallets Modal
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [sendModalAsset, setSendModalAsset] = useState<CryptoAsset>('BTC');

  const openSendModal = (asset: CryptoAsset = 'BTC') => {
    setSendModalAsset(asset);
    setIsSendModalOpen(true);
  };

  const parsedUsd = parseFloat(amount) || 0;
  const btcCalculated = parsedUsd > 0 ? (parsedUsd / btcPrice).toFixed(6) : '0.000000';

  const handleTrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedUsd <= 0) return;

    const result = tradeCrypto(tradeType, parsedUsd);
    if (result.success) {
      setTradeMessage({
        type: 'success',
        text: tradeType === 'buy' 
          ? `¡Has comprado ${(parsedUsd / btcPrice).toFixed(6)} BTC exitosamente!`
          : `¡Has vendido ${(parsedUsd / btcPrice).toFixed(6)} BTC y recibido $${parsedUsd.toFixed(2)} USD!`
      });
      setAmount('');
      setTimeout(() => setTradeMessage(null), 3000);
    } else {
      setTradeMessage({
        type: 'error',
        text: result.error || 'No se pudo completar la operación',
      });
    }
  };

  const handlePercentage = (pct: number) => {
    if (tradeType === 'buy') {
      setAmount((balance * pct).toFixed(2));
    } else {
      const maxUsdFromBtc = cryptoBtc * btcPrice;
      setAmount((maxUsdFromBtc * pct).toFixed(2));
    }
  };

  return (
    <div className="space-y-8">
      {/* Header with Send Crypto Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-100 flex items-center gap-2">
            <span>Mercado Cripto & Custodia</span>
            <span className="text-xs bg-amber-500/10 text-amber-400 font-semibold px-2.5 py-1 rounded-full border border-amber-500/20">
              Instantáneo
            </span>
          </h1>
          <p className="text-neutral-400 text-sm mt-0.5">
            Compra, vende y transfiere activos digitales a billeteras externas (MetaMask, Phantom, Ledger, Exchanges).
          </p>
        </div>

        {/* Primary Action Button: Enviar Cripto a Billeteras */}
        <div className="flex items-center gap-3">
          <button
            id="btn-send-crypto-header"
            onClick={() => openSendModal('BTC')}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-2xl font-bold transition-all shadow-lg shadow-amber-500/10 text-sm"
          >
            <Send size={16} />
            <span>Enviar Cripto a Billeteras</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Market Chart */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
                  <Bitcoin size={26} />
                </div>
                <div>
                  <h3 className="font-bold text-neutral-100 text-lg">Bitcoin (BTC / USD)</h3>
                  <p className="text-neutral-400 text-xs">Cotización SPOT en vivo</p>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-2xl md:text-3xl font-extrabold text-neutral-100 font-mono">
                  ${btcPrice.toLocaleString()} USD
                </h2>
                <span className="text-emerald-400 flex items-center justify-end gap-1 text-xs font-semibold mt-0.5">
                  <ArrowUpRight size={15} />
                  +3.4% (24h)
                </span>
              </div>
            </div>
            
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={btcData}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '12px', color: '#f5f5f5' }}
                    itemStyle={{ color: '#f97316' }}
                    formatter={(value: any) => [`$${Number(value).toLocaleString()} USD`, 'Precio']}
                  />
                  <Area type="monotone" dataKey="price" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorPrice)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Assets in custody with Enviar buttons */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-neutral-100">Activos en tu Billetera de Custodia</h3>
                <p className="text-xs text-neutral-400">Fondos disponibles para operar o transferir a billeteras externas.</p>
              </div>
              <button
                onClick={() => openSendModal('BTC')}
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20"
              >
                <Send size={13} />
                <span>Enviar a Wallet</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {/* BTC */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-neutral-950 rounded-2xl border border-neutral-800 hover:border-neutral-700 transition-all gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0">
                    <Bitcoin size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm text-neutral-100">Bitcoin</p>
                      <span className="text-[10px] bg-orange-500/10 text-orange-400 px-1.5 py-0.2 rounded font-mono font-bold">BTC</span>
                    </div>
                    <p className="text-xs text-neutral-400 font-mono">{cryptoBtc.toFixed(6)} BTC</p>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <div className="text-right">
                    <p className="font-mono font-bold text-sm text-neutral-100">
                      ${(cryptoBtc * (cryptoPrices?.BTC || btcPrice)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                    </p>
                    <p className="text-[11px] text-emerald-400 font-medium">Custodiado 100%</p>
                  </div>
                  <button
                    onClick={() => openSendModal('BTC')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-xl transition-colors shrink-0"
                  >
                    <Send size={13} className="text-amber-400" />
                    <span>Enviar</span>
                  </button>
                </div>
              </div>

              {/* ETH */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-neutral-950 rounded-2xl border border-neutral-800 hover:border-neutral-700 transition-all gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
                    <Coins size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm text-neutral-100">Ethereum</p>
                      <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.2 rounded font-mono font-bold">ETH</span>
                    </div>
                    <p className="text-xs text-neutral-400 font-mono">{cryptoEth.toFixed(4)} ETH</p>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <div className="text-right">
                    <p className="font-mono font-bold text-sm text-neutral-100">
                      ${(cryptoEth * (cryptoPrices?.ETH || 3450)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                    </p>
                    <p className="text-[11px] text-indigo-300 font-medium">ERC-20 / L2</p>
                  </div>
                  <button
                    onClick={() => openSendModal('ETH')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-xl transition-colors shrink-0"
                  >
                    <Send size={13} className="text-amber-400" />
                    <span>Enviar</span>
                  </button>
                </div>
              </div>

              {/* USDT */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-neutral-950 rounded-2xl border border-neutral-800 hover:border-neutral-700 transition-all gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm text-neutral-100">Tether USD</p>
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.2 rounded font-mono font-bold">USDT</span>
                    </div>
                    <p className="text-xs text-neutral-400 font-mono">{cryptoUsdt.toFixed(2)} USDT</p>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <div className="text-right">
                    <p className="font-mono font-bold text-sm text-neutral-100">
                      ${cryptoUsdt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                    </p>
                    <p className="text-[11px] text-neutral-400 font-medium">TRC20 / ERC20</p>
                  </div>
                  <button
                    onClick={() => openSendModal('USDT')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-xl transition-colors shrink-0"
                  >
                    <Send size={13} className="text-amber-400" />
                    <span>Enviar</span>
                  </button>
                </div>
              </div>

              {/* SOL */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-neutral-950 rounded-2xl border border-neutral-800 hover:border-neutral-700 transition-all gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0">
                    <Zap size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm text-neutral-100">Solana</p>
                      <span className="text-[10px] bg-purple-500/10 text-purple-400 px-1.5 py-0.2 rounded font-mono font-bold">SOL</span>
                    </div>
                    <p className="text-xs text-neutral-400 font-mono">{cryptoSol.toFixed(4)} SOL</p>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <div className="text-right">
                    <p className="font-mono font-bold text-sm text-neutral-100">
                      ${(cryptoSol * (cryptoPrices?.SOL || 145.2)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                    </p>
                    <p className="text-[11px] text-purple-400 font-medium">Solana SPL</p>
                  </div>
                  <button
                    onClick={() => openSendModal('SOL')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-xl transition-colors shrink-0"
                  >
                    <Send size={13} className="text-amber-400" />
                    <span>Enviar</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Trade Widget + Send to Wallets Card */}
        <div className="lg:col-span-1 space-y-6">
          {/* Quick Wallet Transfer Card */}
          <div className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-amber-950/30 border border-amber-500/30 rounded-3xl p-6 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Wallet size={20} />
              </div>
              <span className="text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
                Multi-Billetera
              </span>
            </div>
            <div>
              <h4 className="font-bold text-neutral-100 text-base">Retiros a Billeteras Externas</h4>
              <p className="text-xs text-neutral-400 mt-1">
                Envía Bitcoin, Ethereum, USDT o Solana directamente a tu MetaMask, Phantom, Ledger o exchange con validación instantánea.
              </p>
            </div>
            <button
              onClick={() => openSendModal('BTC')}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-2xl transition-all shadow-lg shadow-amber-500/10 text-xs flex items-center justify-center gap-2"
            >
              <Send size={15} />
              <span>Enviar a Distintas Billeteras</span>
            </button>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sticky top-6 shadow-xl space-y-5">
            <h3 className="text-lg font-bold text-neutral-100">Operar al Instante</h3>
            
            {/* Buy / Sell Tabs */}
            <div className="flex bg-neutral-950 p-1 rounded-2xl border border-neutral-800">
              <button 
                type="button"
                onClick={() => {
                  setTradeType('buy');
                  setAmount('');
                  setTradeMessage(null);
                }}
                className={cn(
                  "flex-1 py-2.5 text-xs font-bold rounded-xl transition-all",
                  tradeType === 'buy' 
                    ? "bg-emerald-500 text-emerald-950 shadow-md shadow-emerald-500/10" 
                    : "text-neutral-400 hover:text-neutral-200"
                )}
              >
                Comprar BTC
              </button>
              <button 
                type="button"
                onClick={() => {
                  setTradeType('sell');
                  setAmount('');
                  setTradeMessage(null);
                }}
                className={cn(
                  "flex-1 py-2.5 text-xs font-bold rounded-xl transition-all",
                  tradeType === 'sell' 
                    ? "bg-red-500 text-white shadow-md shadow-red-500/10" 
                    : "text-neutral-400 hover:text-neutral-200"
                )}
              >
                Vender BTC
              </button>
            </div>

            {tradeMessage && (
              <div className={cn(
                "p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2",
                tradeMessage.type === 'success' 
                  ? "bg-emerald-950/60 border border-emerald-500/40 text-emerald-300"
                  : "bg-red-950/60 border border-red-500/40 text-red-300"
              )}>
                {tradeMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{tradeMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleTrade} className="space-y-4">
              <div>
                <div className="flex justify-between text-xs text-neutral-400 mb-2">
                  <span>{tradeType === 'buy' ? 'Pagar con USD' : 'Monto en USD a vender'}</span>
                  <span>
                    {tradeType === 'buy' 
                      ? `Disp: $${balance.toFixed(2)} USD` 
                      : `Disp: ${(cryptoBtc * btcPrice).toFixed(2)} USD (${cryptoBtc.toFixed(4)} BTC)`}
                  </span>
                </div>
                <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 focus-within:border-amber-500">
                  <span className="text-neutral-500 mr-2 font-bold">$</span>
                  <input 
                    type="number" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-transparent text-neutral-100 focus:outline-none text-base font-mono"
                    placeholder="0.00"
                    step="0.01"
                    min="1"
                    required
                  />
                  <span className="text-neutral-500 text-xs font-bold">USD</span>
                </div>
              </div>

              {/* Percentage chips */}
              <div className="flex gap-2">
                {[0.25, 0.50, 0.75, 1.0].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handlePercentage(pct)}
                    className="flex-1 py-1.5 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-xs text-neutral-400 font-mono"
                  >
                    {pct * 100}%
                  </button>
                ))}
              </div>

              <div className="flex justify-center -my-2 relative z-10">
                <div className="w-8 h-8 rounded-full bg-neutral-800 border-2 border-neutral-900 flex items-center justify-center text-neutral-400">
                  <RefreshCcw size={14} />
                </div>
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-2">
                  {tradeType === 'buy' ? 'Recibes aproximadamente' : 'Descontando de tu saldo BTC'}
                </label>
                <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3">
                  <input 
                    type="text" 
                    value={btcCalculated}
                    readOnly
                    className="w-full bg-transparent text-neutral-100 focus:outline-none text-base font-mono"
                  />
                  <span className="text-orange-500 text-xs font-bold flex items-center gap-1">
                    <Bitcoin size={14} /> BTC
                  </span>
                </div>
              </div>

              <button 
                type="submit"
                disabled={!parsedUsd}
                className={cn(
                  "w-full py-3.5 font-bold rounded-xl transition-all shadow-lg text-sm disabled:opacity-40 disabled:cursor-not-allowed",
                  tradeType === 'buy' 
                    ? "bg-emerald-500 text-emerald-950 hover:bg-emerald-400 shadow-emerald-500/10" 
                    : "bg-red-500 text-white hover:bg-red-400 shadow-red-500/10"
                )}
              >
                {tradeType === 'buy' ? `Confirmar Compra de BTC` : `Confirmar Venta de BTC`}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Send Crypto Modal to Multiple Wallets */}
      <SendCryptoModal
        isOpen={isSendModalOpen}
        onClose={() => setIsSendModalOpen(false)}
        defaultAsset={sendModalAsset}
      />
    </div>
  );
}
