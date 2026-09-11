'use client';

import { useState, useEffect } from 'react';
import { 
  X, 
  ArrowUpRight, 
  Send, 
  Wallet, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  ShieldCheck, 
  Clock, 
  ArrowRight, 
  Bitcoin, 
  Coins, 
  Zap, 
  Building2, 
  Lock, 
  FileText,
  HelpCircle,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { useBanking, TransactionItem } from '@/lib/bankingStore';
import { 
  CryptoAsset, 
  CRYPTO_NETWORKS, 
  CRYPTO_WALLET_PRESETS, 
  WalletPreset,
  validateCryptoAddress 
} from '@/lib/bankingValidation';
import TransactionReceiptModal from './TransactionReceiptModal';

interface SendCryptoModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAsset?: CryptoAsset;
}

export default function SendCryptoModal({ isOpen, onClose, defaultAsset = 'BTC' }: SendCryptoModalProps) {
  if (!isOpen) return null;
  return <SendCryptoModalContent key={defaultAsset} onClose={onClose} defaultAsset={defaultAsset} />;
}

function SendCryptoModalContent({ onClose, defaultAsset = 'BTC' }: { onClose: () => void; defaultAsset?: CryptoAsset }) {
  const { 
    cryptoBtc, 
    cryptoEth, 
    cryptoUsdt, 
    cryptoSol, 
    cryptoPrices, 
    sendCryptoTransfer,
    activeOtp,
    transactions
  } = useBanking();

  const [selectedAsset, setSelectedAsset] = useState<CryptoAsset>(defaultAsset);
  const [selectedNetworkId, setSelectedNetworkId] = useState<string>(() => {
    const networks = CRYPTO_NETWORKS[defaultAsset];
    return networks && networks.length > 0 ? networks[0].id : '';
  });
  const [targetAddress, setTargetAddress] = useState<string>('');
  const [walletLabel, setWalletLabel] = useState<string>('');
  const [selectedPreset, setSelectedPreset] = useState<WalletPreset | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [otpCode, setOtpCode] = useState<string>('');
  const [otpError, setOtpError] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1); // 1: Datos & Billetera, 2: Seguridad OTP, 3: Éxito
  const [copiedTxHash, setCopiedTxHash] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<string>('');
  const [lastTxItem, setLastTxItem] = useState<TransactionItem | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // When asset changes, update network to first available for that asset
  const handleAssetChange = (asset: CryptoAsset) => {
    setSelectedAsset(asset);
    const networks = CRYPTO_NETWORKS[asset];
    if (networks && networks.length > 0) {
      setSelectedNetworkId(networks[0].id);
    }
    // If current preset does not support asset, clear it
    if (selectedPreset && !selectedPreset.supportedAssets.includes(asset)) {
      setSelectedPreset(null);
      setTargetAddress('');
      setWalletLabel('');
    } else if (selectedPreset && selectedPreset.sampleAddresses[asset]) {
      setTargetAddress(selectedPreset.sampleAddresses[asset] || '');
    }
    setErrorMsg('');
  };

  const currentBalance = 
    selectedAsset === 'BTC' ? cryptoBtc :
    selectedAsset === 'ETH' ? cryptoEth :
    selectedAsset === 'USDT' ? cryptoUsdt :
    cryptoSol;

  const currentPrice = cryptoPrices[selectedAsset] || 1;
  const currentNetworks = CRYPTO_NETWORKS[selectedAsset] || [];
  const activeNetwork = currentNetworks.find(n => n.id === selectedNetworkId) || currentNetworks[0];

  // Address validation
  const validation = validateCryptoAddress(targetAddress, selectedAsset, selectedNetworkId);

  // Fee and amounts
  const networkFee = activeNetwork ? activeNetwork.feeEstimate : 0.0001;
  const numericAmount = parseFloat(amount) || 0;
  const usdValue = numericAmount * currentPrice;
  const feeUsd = networkFee * currentPrice;
  const totalDeduction = numericAmount + networkFee;
  const isBalanceSufficient = currentBalance >= totalDeduction;

  const handleSelectPreset = (preset: WalletPreset) => {
    setSelectedPreset(preset);
    setWalletLabel(preset.name);
    // If preset supports current asset, set address
    if (preset.sampleAddresses[selectedAsset]) {
      setTargetAddress(preset.sampleAddresses[selectedAsset]!);
    } else {
      // Pick first supported asset of preset
      const firstSupported = preset.supportedAssets[0];
      setSelectedAsset(firstSupported);
      const networks = CRYPTO_NETWORKS[firstSupported];
      if (networks && networks.length > 0) {
        setSelectedNetworkId(networks[0].id);
      }
      setTargetAddress(preset.sampleAddresses[firstSupported] || '');
    }
    setErrorMsg('');
  };

  const handleSetPercentage = (pct: number) => {
    if (currentBalance <= 0) return;
    const maxAvailable = Math.max(0, currentBalance - networkFee);
    const calculated = (pct === 1 ? maxAvailable : currentBalance * pct);
    const decimals = selectedAsset === 'USDT' ? 2 : selectedAsset === 'SOL' ? 4 : 6;
    setAmount(calculated.toFixed(decimals));
  };

  const handleProceedToAuth = () => {
    if (!targetAddress.trim()) {
      setErrorMsg('Por favor ingrese la dirección pública de la billetera destino.');
      return;
    }
    if (!validation.isValid) {
      setErrorMsg(validation.error || 'La dirección de la billetera de destino no tiene un formato válido.');
      return;
    }
    if (numericAmount <= 0) {
      setErrorMsg('Por favor ingrese un monto mayor a cero para enviar.');
      return;
    }
    if (!isBalanceSufficient) {
      setErrorMsg(`Saldo insuficiente. Disponible: ${currentBalance.toFixed(6)} ${selectedAsset} (incluyendo comisión de red de ${networkFee} ${selectedAsset}).`);
      return;
    }
    setErrorMsg('');
    setCurrentStep(2);
  };

  const handleExecuteSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.trim() !== activeOtp) {
      setOtpError('Código de seguridad 2FA inválido. Verifique el código activo generado en pantalla.');
      return;
    }

    setOtpError('');
    const result = sendCryptoTransfer({
      asset: selectedAsset,
      amount: numericAmount,
      toAddress: targetAddress.trim(),
      network: activeNetwork.name,
      walletName: walletLabel || (selectedPreset ? selectedPreset.name : 'Billetera Externa'),
      networkFee,
    });

    if (result.success) {
      setLastTxHash(result.txHash);
      // Retrieve the generated transaction item from history
      const createdTx = transactions[0];
      if (createdTx) {
        setLastTxItem(createdTx);
      }
      setCurrentStep(3);
    } else {
      setErrorMsg(result.error || 'Error al procesar la transferencia en la red blockchain.');
      setCurrentStep(1);
    }
  };

  const copyTxHash = () => {
    navigator.clipboard.writeText(lastTxHash);
    setCopiedTxHash(true);
    setTimeout(() => setCopiedTxHash(false), 2000);
  };

  return (
    <>
      <div 
        id="send-crypto-modal-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden my-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-800/80 bg-neutral-950/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-orange-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-sm">
                <Send size={18} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
                  Enviar Cripto a Billeteras
                  <span className="text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Blockchain Live
                  </span>
                </h2>
                <p className="text-xs text-neutral-400">
                  Transfiere tus activos a MetaMask, Phantom, Ledger, Trezor o Exchanges.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800/70 transition-colors"
              aria-label="Cerrar ventana"
            >
              <X size={20} />
            </button>
          </div>

          {/* Stepper indicator */}
          <div className="flex items-center justify-between px-6 py-2.5 bg-neutral-950/30 border-b border-neutral-800/50 text-xs">
            <div className={cn("flex items-center gap-1.5 font-medium", currentStep >= 1 ? "text-amber-400" : "text-neutral-500")}>
              <span className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold", currentStep >= 1 ? "bg-amber-500 text-neutral-950" : "bg-neutral-800 text-neutral-400")}>
                1
              </span>
              <span>Billetera y Monto</span>
            </div>
            <div className="h-[1px] flex-1 mx-3 bg-neutral-800" />
            <div className={cn("flex items-center gap-1.5 font-medium", currentStep >= 2 ? "text-amber-400" : "text-neutral-500")}>
              <span className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold", currentStep >= 2 ? "bg-amber-500 text-neutral-950" : "bg-neutral-800 text-neutral-400")}>
                2
              </span>
              <span>Autorización 2FA</span>
            </div>
            <div className="h-[1px] flex-1 mx-3 bg-neutral-800" />
            <div className={cn("flex items-center gap-1.5 font-medium", currentStep === 3 ? "text-emerald-400" : "text-neutral-500")}>
              <span className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold", currentStep === 3 ? "bg-emerald-500 text-neutral-950" : "bg-neutral-800 text-neutral-400")}>
                3
              </span>
              <span>Comprobante Tx</span>
            </div>
          </div>

          {/* Body content */}
          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {errorMsg && (
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-400" />
                <p>{errorMsg}</p>
              </div>
            )}

            {/* STEP 1: ASSET, WALLET & AMOUNT */}
            {currentStep === 1 && (
              <div className="space-y-6">
                {/* Asset Selection */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                      1. Selecciona el Activo a Enviar
                    </label>
                    <span className="text-xs text-neutral-400">
                      Saldo disponible: <span className="font-mono text-neutral-100 font-bold">{currentBalance.toFixed(selectedAsset === 'USDT' ? 2 : 4)} {selectedAsset}</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { id: 'BTC', name: 'Bitcoin', bal: cryptoBtc, sym: 'BTC', icon: Bitcoin, color: 'text-orange-500 bg-orange-500/10 border-orange-500/30' },
                      { id: 'ETH', name: 'Ethereum', bal: cryptoEth, sym: 'ETH', icon: Coins, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' },
                      { id: 'USDT', name: 'Tether USD', bal: cryptoUsdt, sym: 'USDT', icon: ShieldCheck, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
                      { id: 'SOL', name: 'Solana', bal: cryptoSol, sym: 'SOL', icon: Zap, color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
                    ].map(item => {
                      const Icon = item.icon;
                      const isSelected = selectedAsset === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleAssetChange(item.id as CryptoAsset)}
                          className={cn(
                            "p-3 rounded-2xl border text-left transition-all relative overflow-hidden",
                            isSelected 
                              ? "bg-neutral-800 border-amber-500 shadow-md ring-1 ring-amber-500/40" 
                              : "bg-neutral-950/70 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900"
                          )}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", item.color)}>
                              <Icon size={16} />
                            </div>
                            {isSelected && (
                              <span className="w-2 h-2 rounded-full bg-amber-400" />
                            )}
                          </div>
                          <p className="font-bold text-xs text-neutral-100">{item.name}</p>
                          <p className="text-[11px] font-mono text-neutral-400 mt-0.5">
                            {item.bal.toFixed(item.id === 'USDT' ? 2 : 4)} {item.sym}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Network Selection */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                    2. Red Blockchain de Salida
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {currentNetworks.map(net => {
                      const isSelected = selectedNetworkId === net.id;
                      return (
                        <div
                          key={net.id}
                          onClick={() => setSelectedNetworkId(net.id)}
                          className={cn(
                            "p-3 rounded-2xl border cursor-pointer transition-all",
                            isSelected 
                              ? "bg-neutral-800 border-amber-500/80 ring-1 ring-amber-500/20" 
                              : "bg-neutral-950/60 border-neutral-800 hover:border-neutral-700"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-xs text-neutral-100">{net.name}</span>
                            <span className="text-[10px] font-mono text-amber-400 font-bold">{net.confirmationTime}</span>
                          </div>
                          <p className="text-[11px] text-neutral-400 mt-0.5">{net.chain} &bull; Tarifa ~{net.feeEstimate} {net.feeAsset}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Destination Wallet Quick Presets */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                      3. Billetera de Destino (Distintas Opciones)
                    </label>
                    <span className="text-[11px] text-neutral-500">Selecciona o escribe manualmente</span>
                  </div>

                  {/* Preset chips */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                    {CRYPTO_WALLET_PRESETS.map(preset => {
                      const isSelected = selectedPreset?.id === preset.id;
                      const supportsCurrent = preset.supportedAssets.includes(selectedAsset);
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleSelectPreset(preset)}
                          className={cn(
                            "p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all",
                            isSelected 
                              ? "bg-amber-500/10 border-amber-500 text-amber-200" 
                              : supportsCurrent 
                                ? "bg-neutral-950/80 border-neutral-800 hover:border-neutral-700 text-neutral-300"
                                : "bg-neutral-950/40 border-neutral-800/60 text-neutral-500 opacity-60"
                          )}
                        >
                          <Wallet size={15} className="mt-0.5 shrink-0 text-amber-400" />
                          <div className="truncate">
                            <p className="font-semibold text-xs truncate">{preset.name}</p>
                            <p className="text-[10px] text-neutral-400 truncate">
                              {preset.supportedAssets.join(', ')}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Manual Address Input */}
                  <div className="space-y-2">
                    <div className="relative">
                      <input 
                        type="text"
                        placeholder={activeNetwork?.addressFormatHint || "Ingresa la dirección pública de la billetera destino (0x..., bc1..., T...)"}
                        value={targetAddress}
                        onChange={(e) => {
                          setTargetAddress(e.target.value);
                          setErrorMsg('');
                        }}
                        className={cn(
                          "w-full bg-neutral-950 border rounded-2xl px-4 py-3 text-xs sm:text-sm font-mono text-neutral-100 placeholder:text-neutral-600 focus:outline-none transition-colors pr-24",
                          targetAddress 
                            ? validation.isValid 
                              ? "border-emerald-500/70 focus:border-emerald-500" 
                              : "border-red-500/70 focus:border-red-500"
                            : "border-neutral-800 focus:border-amber-500"
                        )}
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const text = await navigator.clipboard.readText();
                            if (text) setTargetAddress(text.trim());
                          } catch {
                            // clipboard read fallback
                          }
                        }}
                        className="absolute right-2 top-2 px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs rounded-xl font-medium"
                      >
                        Pegar
                      </button>
                    </div>

                    {/* Address validation feedback */}
                    {targetAddress && (
                      <div className="flex items-center gap-1.5 text-xs">
                        {validation.isValid ? (
                          <div className="flex items-center gap-1.5 text-emerald-400">
                            <CheckCircle2 size={14} />
                            <span className="font-medium">{validation.detectedType} &bull; Formato válido</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-red-400">
                            <AlertCircle size={14} />
                            <span>{validation.error || 'Dirección incompatible con la red seleccionada'}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Label/Concept */}
                    <div className="pt-1">
                      <input 
                        type="text"
                        placeholder="Etiqueta / Nombre del destinatario (ej. Mi Ledger Frío, Billetera Binance)"
                        value={walletLabel}
                        onChange={(e) => setWalletLabel(e.target.value)}
                        className="w-full bg-neutral-950/60 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-neutral-700"
                      />
                    </div>
                  </div>
                </div>

                {/* Amount to Send */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                      4. Monto a Enviar
                    </label>
                    <div className="flex items-center gap-1">
                      {[0.25, 0.50, 0.75, 1].map(pct => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => handleSetPercentage(pct)}
                          className="px-2 py-0.5 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-[10px] font-mono text-neutral-400 hover:text-neutral-200"
                        >
                          {pct === 1 ? 'MÁX' : `${pct * 100}%`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center bg-neutral-950 border border-neutral-800 focus-within:border-amber-500 rounded-2xl px-4 py-3 transition-colors">
                    <input 
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => {
                        setAmount(e.target.value);
                        setErrorMsg('');
                      }}
                      className="w-full bg-transparent text-xl font-bold font-mono text-neutral-100 focus:outline-none placeholder:text-neutral-700"
                    />
                    <div className="flex items-center gap-2 pl-3 border-l border-neutral-800 text-right">
                      <div>
                        <span className="font-bold text-neutral-200 text-sm">{selectedAsset}</span>
                        <p className="text-[10px] text-neutral-500 font-mono">
                          ~${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fee & Breakdown Box */}
                <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800 space-y-2 text-xs">
                  <div className="flex justify-between text-neutral-400">
                    <span>Comisión de Red ({activeNetwork?.name}):</span>
                    <span className="font-mono text-neutral-300">
                      {networkFee} {selectedAsset} (~${feeUsd.toFixed(2)} USD)
                    </span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>Tiempo de confirmación estimado:</span>
                    <span className="font-mono text-neutral-300">{activeNetwork?.confirmationTime}</span>
                  </div>
                  <div className="h-[1px] bg-neutral-800 my-1" />
                  <div className="flex justify-between font-bold text-sm text-neutral-100">
                    <span>Total a descontar:</span>
                    <span className="font-mono text-amber-400">
                      {totalDeduction > 0 ? totalDeduction.toFixed(selectedAsset === 'USDT' ? 2 : 6) : '0.00'} {selectedAsset}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleProceedToAuth}
                  disabled={!targetAddress || !validation.isValid || numericAmount <= 0 || !isBalanceSufficient}
                  className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-2xl transition-all shadow-lg shadow-amber-500/10 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                >
                  <span>Continuar a Autorización 2FA</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            )}

            {/* STEP 2: 2FA & SECURITY CONFIRMATION */}
            {currentStep === 2 && (
              <form onSubmit={handleExecuteSend} className="space-y-6">
                <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-neutral-300 space-y-3">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                    <ShieldCheck size={16} />
                    <span>Resumen de la Transacción Blockchain</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-neutral-500">Activo y Red:</p>
                      <p className="font-bold text-neutral-200">{selectedAsset} &bull; {activeNetwork?.name}</p>
                    </div>
                    <div>
                      <p className="text-neutral-500">Monto a Enviar:</p>
                      <p className="font-mono font-bold text-amber-400 text-sm">
                        {numericAmount} {selectedAsset} (~${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD)
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-neutral-500">Billetera de Destino:</p>
                      <p className="font-mono text-xs text-neutral-200 break-all bg-neutral-950/80 p-2 rounded-xl border border-neutral-800 mt-1">
                        {targetAddress}
                      </p>
                      {walletLabel && (
                        <p className="text-[11px] text-neutral-400 mt-1">Etiqueta: {walletLabel}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2FA Token Input */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Lock size={14} className="text-amber-400" />
                      Código de Autorización 2FA (Banxico / Token)
                    </label>
                    <div className="flex items-center gap-1 text-[11px] text-neutral-400">
                      <span>Token activo:</span>
                      <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                        {activeOtp}
                      </span>
                    </div>
                  </div>

                  <input 
                    type="text"
                    maxLength={6}
                    placeholder="749215"
                    value={otpCode}
                    onChange={(e) => {
                      setOtpCode(e.target.value.replace(/\D/g, ''));
                      setOtpError('');
                    }}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-3.5 text-center text-2xl font-mono tracking-widest text-neutral-100 focus:outline-none focus:border-amber-500"
                  />

                  {otpError && (
                    <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {otpError}
                    </p>
                  )}
                  <p className="text-[11px] text-neutral-500 mt-1 text-center">
                    Ingresa el código dinámico de 6 dígitos para firmar criptográficamente la transacción.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold rounded-2xl transition-colors text-sm"
                  >
                    Volver
                  </button>
                  <button
                    type="submit"
                    disabled={otpCode.length < 6}
                    className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-2xl transition-all shadow-lg shadow-amber-500/10 disabled:opacity-40 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
                  >
                    <Send size={16} />
                    <span>Firmar y Enviar</span>
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: TRANSACTION SUCCESS & BLOCKCHAIN RECEIPT */}
            {currentStep === 3 && (
              <div className="space-y-6 text-center py-2">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                  <CheckCircle2 size={36} />
                </div>

                <div>
                  <h3 className="text-xl font-bold text-neutral-100">
                    ¡Transferencia Cripto Transmitida con Éxito!
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1 max-w-md mx-auto">
                    La transacción ha sido propagada a los nodos de la red blockchain y está en proceso de validación por mineros/validadores.
                  </p>
                </div>

                {/* Tx Hash Box */}
                <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 text-left space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-400 font-medium">Hash de la Transacción (TxHash):</span>
                    <button
                      type="button"
                      onClick={copyTxHash}
                      className="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-semibold"
                    >
                      {copiedTxHash ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copiedTxHash ? 'Copiado' : 'Copiar Hash'}</span>
                    </button>
                  </div>
                  <div className="font-mono text-xs text-neutral-200 bg-neutral-900 p-2.5 rounded-xl border border-neutral-800/80 break-all select-all">
                    {lastTxHash}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 text-neutral-400">
                    <div>
                      <span>Red:</span> <strong className="text-neutral-200">{activeNetwork?.name}</strong>
                    </div>
                    <div>
                      <span>Monto:</span> <strong className="text-amber-400">{numericAmount} {selectedAsset}</strong>
                    </div>
                    <div className="col-span-2 truncate">
                      <span>Destino:</span> <strong className="text-neutral-300 font-mono text-[11px]">{targetAddress}</strong>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (lastTxItem) {
                        setShowReceiptModal(true);
                      } else {
                        // fallback to latest transaction in store
                        setShowReceiptModal(true);
                      }
                    }}
                    className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 font-semibold rounded-2xl transition-colors text-xs sm:text-sm flex items-center justify-center gap-2 border border-neutral-700"
                  >
                    <FileText size={16} className="text-amber-400" />
                    <span>Ver Comprobante Oficial</span>
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-2xl transition-all shadow-lg shadow-amber-500/10 text-xs sm:text-sm"
                  >
                    Cerrar y Volver
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Official Receipt Modal */}
      {showReceiptModal && (
        <TransactionReceiptModal 
          transaction={lastTxItem || transactions[0]} 
          onClose={() => setShowReceiptModal(false)} 
        />
      )}
    </>
  );
}
