'use client';

import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Calendar, 
  Building2, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Clock, 
  ExternalLink,
  Sparkles,
  Layers,
  FileCheck2,
  Printer
} from 'lucide-react';
import { useBanking, TransactionItem } from '@/lib/bankingStore';
import { generateMonthlyStatementPdf } from '@/lib/statementPdf';
import { cn } from '@/lib/utils';

export default function MonthlyStatementGenerator() {
  const { 
    userName, 
    userEmail, 
    userPhone, 
    userAccount, 
    userClabe, 
    balance, 
    transactions,
    activeUserId,
    users
  } = useBanking();

  const currentUser = users.find(u => u.id === activeUserId);

  const [selectedMonth, setSelectedMonth] = useState('Septiembre 2026');
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const months = [
    { id: 'Septiembre 2026', label: 'Septiembre 2026 (Mes en Curso)', cutDate: '30 de Septiembre de 2026' },
    { id: 'Agosto 2026', label: 'Agosto 2026', cutDate: '31 de Agosto de 2026' },
    { id: 'Julio 2026', label: 'Julio 2026', cutDate: '31 de Julio de 2026' },
    { id: 'Últimos 30 Días', label: 'Últimos 30 Días (Corte Inmediato)', cutDate: new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }) },
  ];

  const activePeriod = months.find(m => m.id === selectedMonth) || months[0];

  // Calculate stats for preview
  const totalDeposits = transactions
    .filter(t => t.type === 'received')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalWithdrawals = transactions
    .filter(t => t.type === 'sent')
    .reduce((acc, t) => acc + t.amount, 0);

  const initialBalance = Math.max(0, balance - totalDeposits + totalWithdrawals);

  const handleDownloadPdf = () => {
    setIsGenerating(true);
    setDownloadSuccess(false);

    try {
      generateMonthlyStatementPdf({
        userName,
        userEmail,
        userPhone: currentUser?.phone || userPhone || '+52 55 8492 7104',
        accountNumber: userAccount,
        clabe: userClabe,
        tier: currentUser?.tier || 'Personal',
        postalCode: currentUser?.postalCode || '06600',
        address: currentUser?.address || 'Av. Insurgentes Sur 1602, Crédito Constructor',
        currentBalance: balance,
        transactions,
        monthName: selectedMonth,
        cutOffDate: activePeriod.cutDate,
        currency: 'USD',
      });

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 5000);
    } catch (error) {
      console.error('Error generando estado de cuenta PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-900 to-amber-950/30 border border-amber-500/20 rounded-2xl p-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <FileText className="w-4 h-4" />
              </span>
              <span className="text-[11px] uppercase font-mono tracking-widest text-amber-400 font-bold">
                ESTADO DE CUENTA BANCARIO OFICIAL
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Certificado PDF
              </span>
            </div>
            <h2 className="text-xl font-bold text-neutral-100">
              Generador de Estado de Cuenta Mensual
            </h2>
            <p className="text-xs text-neutral-400 max-w-2xl">
              Emite y descarga tu estado de cuenta con validez legal, desglose cronológico de movimientos, comprobantes SPEI, sellos digitales de autenticidad y normatividad del Banco de México.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="py-3 px-5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>Generando PDF Oficial...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Descargar Estado de Cuenta (PDF)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {downloadSuccess && (
          <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              ¡Estado de cuenta descargado exitosamente! El archivo PDF contiene tu desglose de transacciones y sellos bancarios.
            </span>
          </div>
        )}
      </div>

      {/* Selector de Período y Datos de Cuenta */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Selector de Mes */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
            <Calendar className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-neutral-200 uppercase tracking-wider">
              Período de Facturación
            </h3>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-neutral-400 block">Selecciona el Mes a Consultar:</label>
            <div className="space-y-1.5">
              {months.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMonth(m.id)}
                  className={cn(
                    "w-full px-3 py-2.5 rounded-xl text-xs text-left font-medium transition-all flex items-center justify-between cursor-pointer",
                    selectedMonth === m.id
                      ? "bg-amber-500 text-neutral-950 font-bold shadow-md shadow-amber-500/10"
                      : "bg-neutral-950 text-neutral-300 border border-neutral-800 hover:border-neutral-700"
                  )}
                >
                  <span>{m.label}</span>
                  {selectedMonth === m.id && <CheckCircle2 className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-neutral-800 text-[11px] text-neutral-400 space-y-1">
            <p className="flex justify-between">
              <span>Fecha de Corte:</span>
              <strong className="text-neutral-200">{activePeriod.cutDate}</strong>
            </p>
            <p className="flex justify-between">
              <span>Moneda de Registro:</span>
              <strong className="text-neutral-200">USD ($)</strong>
            </p>
          </div>
        </div>

        {/* Resumen del Período */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4 md:col-span-2">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-neutral-200 uppercase tracking-wider">
                Resumen Financiero del Período ({selectedMonth})
              </h3>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              {transactions.length} Movimientos Registrados
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1">
              <span className="text-[11px] text-neutral-400">Saldo Inicial</span>
              <p className="text-sm font-bold text-neutral-200 font-mono">
                ${initialBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1">
              <span className="text-[11px] text-neutral-400">Total Abonos (+)</span>
              <p className="text-sm font-bold text-emerald-400 font-mono">
                +${totalDeposits.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1">
              <span className="text-[11px] text-neutral-400">Total Cargos (-)</span>
              <p className="text-sm font-bold text-red-400 font-mono">
                -${totalWithdrawals.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            <div className="p-3 bg-neutral-950 border border-amber-500/30 rounded-xl space-y-1">
              <span className="text-[11px] text-amber-400 font-bold">Saldo al Corte</span>
              <p className="text-sm font-bold text-amber-400 font-mono">
                ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <p className="font-semibold text-neutral-200">Titular: {userName}</p>
              <p className="text-[11px] text-neutral-400 font-mono">
                Cuenta: {userAccount} • CLABE: {userClabe}
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="py-2 px-3.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Descargar PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Previsualización de Movimientos Incluidos en el Estado */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-neutral-200 uppercase tracking-wider">
              Movimientos que se incluirán en el Documento PDF ({transactions.length})
            </h3>
          </div>
          <span className="text-[11px] text-neutral-500">
            Formato estándar bancario oficial
          </span>
        </div>

        {transactions.length === 0 ? (
          <div className="py-8 text-center text-neutral-500 text-xs">
            No hay transacciones registradas en este período.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-neutral-800 text-neutral-400 text-[11px]">
                  <th className="pb-2.5 font-semibold">Fecha / Hora</th>
                  <th className="pb-2.5 font-semibold">Descripción / Beneficiario</th>
                  <th className="pb-2.5 font-semibold">Folio / Clave SPEI</th>
                  <th className="pb-2.5 font-semibold">Tipo</th>
                  <th className="pb-2.5 font-semibold text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {transactions.slice(0, 8).map((tx) => (
                  <tr key={tx.id} className="hover:bg-neutral-800/30 transition-colors">
                    <td className="py-2.5 pr-3 text-neutral-400">{tx.date}</td>
                    <td className="py-2.5 pr-3 text-neutral-200 truncate max-w-[220px]">
                      {tx.title} - {tx.recipientOrSender}
                    </td>
                    <td className="py-2.5 pr-3 text-neutral-500 text-[11px]">
                      {tx.trackingKey || tx.id}
                    </td>
                    <td className="py-2.5 pr-3">
                      {tx.type === 'received' ? (
                        <span className="text-emerald-400 font-bold text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded">
                          ABONO
                        </span>
                      ) : (
                        <span className="text-red-400 font-bold text-[10px] bg-red-500/10 px-2 py-0.5 rounded">
                          CARGO
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 text-right font-bold">
                      {tx.type === 'received' ? (
                        <span className="text-emerald-400">
                          +${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      ) : (
                        <span className="text-neutral-200">
                          -${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {transactions.length > 8 && (
              <p className="text-[11px] text-neutral-500 text-center mt-3">
                Mostrando 8 de {transactions.length} movimientos. El estado de cuenta en PDF incluirá el historial completo con paginación automática.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Certificación y Seguridad */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h4 className="font-bold text-neutral-200">Documento Oficial Certificado con Cadena Original</h4>
            <p className="text-[11px] text-neutral-400">
              Emitido con firma digital SHA-256 e interoperabilidad SPEI Banxico / STP. Apto para comprobación fiscal y de ingresos.
            </p>
          </div>
        </div>

        <button
          onClick={handleDownloadPdf}
          disabled={isGenerating}
          className="py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 shadow-md shadow-amber-500/10"
        >
          <Download size={14} />
          <span>Descargar PDF</span>
        </button>
      </div>
    </div>
  );
}
