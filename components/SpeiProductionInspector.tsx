'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  ShieldCheck, 
  Terminal, 
  Copy, 
  Check, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Lock, 
  Zap, 
  RefreshCw, 
  ExternalLink,
  Layers,
  FileCode2,
  Server,
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw,
  CheckCircle,
  XCircle,
  Database
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SpeiTransaction, SpeiWebhookEvent } from '@/lib/speiDatabase';

export default function SpeiProductionInspector() {
  const [copiedEnv, setCopiedEnv] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);
  const [gatewayStatus, setGatewayStatus] = useState<any | null>(null);

  // Database and Webhook state
  const [transactions, setTransactions] = useState<SpeiTransaction[]>([]);
  const [webhookEvents, setWebhookEvents] = useState<SpeiWebhookEvent[]>([]);
  const [isLoadingDb, setIsLoadingDb] = useState(false);
  const [simulatingWebhook, setSimulatingWebhook] = useState(false);
  const [webhookFeedback, setWebhookFeedback] = useState<string | null>(null);

  // Form states for live test
  const [testClabe, setTestClabe] = useState('012180015678901234');
  const [testBeneficiary, setTestBeneficiary] = useState('Empresa Proveedora de Servicios S.A.');
  const [testAmount, setTestAmount] = useState('1500.00');
  const [testConcept, setTestConcept] = useState('Pago de factura 9942');

  const envSample = `# ========================================================
# GOLD PAYMENTS BANK - CONFIGURACIÓN PRODUCCIÓN SPEI
# Conexión Banxico / STP (Sistema de Transferencias y Pagos)
# ========================================================

STP_API_URL="https://prod.stpmex.com"
STP_EMPRESA="GOLDPAYMENTS"
STP_CUENTA_CONCENTRADORA="646180123456789012"
STP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\\nMIIEowIBAAKCAQEA...\\n-----END RSA PRIVATE KEY-----"
STP_API_TOKEN="tu_token_de_produccion_aqui"
SPEI_ENVIRONMENT="production"
NEXT_PUBLIC_BANCO_NAME="Gold Payments Bank"
NEXT_PUBLIC_BANCO_EMAIL="GPB@goldpaymentsbank.com"`;

  const reloadDatabase = async () => {
    setIsLoadingDb(true);
    try {
      const res = await fetch('/api/spei/transactions');
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
        setWebhookEvents(data.recentWebhookEvents || []);
      }
    } catch (err) {
      console.warn('Error cargando transacciones de BD SPEI:', err);
    } finally {
      setIsLoadingDb(false);
    }
  };

  useEffect(() => {
    let isCancelled = false;

    fetch('/api/spei/transfer')
      .then(res => res.json())
      .then(data => {
        if (!isCancelled) setGatewayStatus(data);
      })
      .catch(err => console.warn('Could not query SPEI status:', err));

    fetch('/api/spei/transactions')
      .then(res => res.json())
      .then(data => {
        if (!isCancelled) {
          setTransactions(data.transactions || []);
          setWebhookEvents(data.recentWebhookEvents || []);
        }
      })
      .catch(err => console.warn('Error cargando transacciones de BD SPEI:', err));

    return () => {
      isCancelled = true;
    };
  }, []);

  const handleCopyEnv = () => {
    navigator.clipboard.writeText(envSample);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2000);
  };

  const handleRunLiveTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingTest(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/spei/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cuentaBeneficiario: testClabe.trim(),
          nombreBeneficiario: testBeneficiary.trim(),
          monto: parseFloat(testAmount) || 100,
          concepto: testConcept.trim(),
        }),
      });
      const data = await res.json();
      setTestResult({
        status: res.status,
        data,
        timestamp: new Date().toLocaleTimeString(),
      });
      // Recargar base de datos para mostrar la orden recién registrada
      await reloadDatabase();
    } catch (err: any) {
      setTestResult({
        status: 500,
        data: { error: err.message || 'Error de conexión con el endpoint /api/spei/transfer' },
        timestamp: new Date().toLocaleTimeString(),
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  /**
   * Simula un evento real enviado por STP / Banxico al webhook /api/spei/webhook
   */
  const handleSimulateBanxicoWebhook = async (
    action: 'liquidar' | 'devolver' | 'abono', 
    targetClave?: string
  ) => {
    setSimulatingWebhook(true);
    setWebhookFeedback(null);

    let payload: any;
    const trackingKey = targetClave || transactions[0]?.claveRastreo || 'GPB20260929KL881';

    if (action === 'liquidar') {
      payload = {
        id: Math.floor(100000 + Math.random() * 900000),
        claveRastreo: trackingKey,
        estado: 'LIQUIDADA',
        fechaOperacion: parseInt(new Date().toISOString().slice(0, 10).replace(/-/g, ''), 10),
        tsLiquidacion: new Date().toISOString(),
        empresa: 'GOLDPAYMENTS',
      };
    } else if (action === 'devolver') {
      payload = {
        id: Math.floor(100000 + Math.random() * 900000),
        claveRastreo: trackingKey,
        estado: 'DEVUELTA',
        causaDevolucion: 1, // 1 = Cuenta Inexistente
        fechaOperacion: parseInt(new Date().toISOString().slice(0, 10).replace(/-/g, ''), 10),
        tsLiquidacion: new Date().toISOString(),
        empresa: 'GOLDPAYMENTS',
      };
    } else {
      // Abono entrante desde BBVA / Banorte
      payload = {
        id: Math.floor(100000 + Math.random() * 900000),
        fechaOperacion: parseInt(new Date().toISOString().slice(0, 10).replace(/-/g, ''), 10),
        institucionOrdenante: 40012, // BBVA
        institucionBeneficiaria: 90646, // STP
        claveRastreo: `BBVA${Date.now().toString(36).toUpperCase()}`,
        monto: 25000.00,
        nombreOrdenante: 'CLIENTE EXTERNO BBVA MÉXICO',
        cuentaOrdenante: '012180019283746501',
        rfcCurpOrdenante: 'CLI890412XYZ',
        nombreBeneficiario: 'Carlos Mendoza',
        cuentaBeneficiario: '846180492019284017',
        conceptoPago: 'Abono interbancario SPEI en tiempo real',
        tipoPago: 1,
        tsLiquidacion: new Date().toISOString(),
      };
    }

    try {
      const res = await fetch('/api/spei/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setWebhookFeedback(data.accion || 'Evento procesado correctamente por el manejador de webhooks.');
      await reloadDatabase();
      setTimeout(() => setWebhookFeedback(null), 6000);
    } catch (err: any) {
      setWebhookFeedback(`Error al simular webhook: ${err.message}`);
    } finally {
      setSimulatingWebhook(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border border-emerald-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Building2 className="w-4 h-4" />
              </span>
              <span className="text-xs uppercase font-mono tracking-widest text-emerald-400 font-bold">
                SPEI BANXICO • PRODUCCIÓN & BACKEND
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Participante 646 STP
              </span>
            </div>
            <h2 className="text-xl font-black text-white">
              Gateway SPEI Producción & Manejador de Webhooks Banxico
            </h2>
            <p className="text-xs text-slate-400 max-w-3xl">
              Actualización automática del estado de las transacciones en la base de datos al recibir confirmaciones de liquidación o devoluciones de Banxico vía STP.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={reloadDatabase}
              disabled={isLoadingDb}
              className="px-3 py-2 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-semibold text-slate-300 flex items-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isLoadingDb && "animate-spin text-emerald-400")} />
              <span>Sincronizar BD</span>
            </button>
            <a
              href="https://www.banxico.org.mx/cep/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 bg-slate-950 border border-slate-800 hover:border-emerald-500/50 rounded-xl text-xs font-semibold text-emerald-400 flex items-center gap-2 transition-all"
            >
              <span>Validador CEP Banxico</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Grid: Gateway Info & Webhook Receiver */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Estado de Pasarela SPEI</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <p className="text-xl font-black text-white font-mono">
            {gatewayStatus?.status || 'ONLINE_24_7'}
          </p>
          <p className="text-[11px] text-slate-400">
            Ambiente activo: <strong className="text-emerald-400 uppercase font-mono">{gatewayStatus?.environment || 'PRODUCCIÓN'}</strong>
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Transacciones en BD</span>
            <Database className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-black text-white font-mono">
            {transactions.length} Registros
          </p>
          <p className="text-[11px] text-slate-400">
            {transactions.filter(t => t.estado === 'LIQUIDADA').length} liquidadas • {transactions.filter(t => t.estado === 'DEVUELTA').length} devueltas
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Manejador Webhooks STP</span>
            <Layers className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xs font-mono text-emerald-300 truncate">
            /api/spei/webhook
          </p>
          <p className="text-[11px] text-slate-400">
            {webhookEvents.length} eventos registrados y procesados automáticamente.
          </p>
        </div>
      </div>

      {/* BANXICO WEBHOOK EVENT HANDLER SIMULATOR / CONTROLLER */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white">
              Manejador de Eventos de Webhook STP (Actualización Automática de BD)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Endpoint: POST /api/spei/webhook
          </span>
        </div>

        <p className="text-xs text-slate-400">
          Prueba en tiempo real cómo el manejador de webhooks procesa las confirmaciones de Banxico y actualiza automáticamente el estado en la base de datos:
        </p>

        {webhookFeedback && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{webhookFeedback}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            disabled={simulatingWebhook}
            onClick={() => handleSimulateBanxicoWebhook('liquidar')}
            className="p-3 bg-slate-950 hover:bg-slate-800 border border-emerald-500/30 hover:border-emerald-500 rounded-xl text-left transition-all group cursor-pointer disabled:opacity-50"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-emerald-400 group-hover:text-emerald-300">
                1. Liquidar en Banxico
              </span>
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-[11px] text-slate-400">
              Envía confirmación con estado <strong className="text-slate-200">LIQUIDADA</strong>. Actualiza la transacción inmediatamente en la BD.
            </p>
          </button>

          <button
            type="button"
            disabled={simulatingWebhook}
            onClick={() => handleSimulateBanxicoWebhook('devolver')}
            className="p-3 bg-slate-950 hover:bg-slate-800 border border-red-500/30 hover:border-red-500 rounded-xl text-left transition-all group cursor-pointer disabled:opacity-50"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-red-400 group-hover:text-red-300">
                2. Devolución Banxico
              </span>
              <RotateCcw className="w-4 h-4 text-red-400" />
            </div>
            <p className="text-[11px] text-slate-400">
              Envía evento <strong className="text-slate-200">DEVUELTA</strong> (Causa 01: Cuenta Inexistente). Actualiza estado y cancela cargo.
            </p>
          </button>

          <button
            type="button"
            disabled={simulatingWebhook}
            onClick={() => handleSimulateBanxicoWebhook('abono')}
            className="p-3 bg-slate-950 hover:bg-slate-800 border border-cyan-500/30 hover:border-cyan-500 rounded-xl text-left transition-all group cursor-pointer disabled:opacity-50"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-cyan-400 group-hover:text-cyan-300">
                3. Abono Entrante (+25K)
              </span>
              <ArrowDownLeft className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-[11px] text-slate-400">
              Simula depósito interbancario entrante desde BBVA a cuenta de usuario con estado <strong className="text-slate-200">LIQUIDADA</strong>.
            </p>
          </button>
        </div>
      </div>

      {/* DATABASE TRANSACTIONS TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">
              Transacciones SPEI en Base de Datos ({transactions.length})
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Actualización reactiva en tiempo real
          </span>
        </div>

        {transactions.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            No hay transacciones SPEI registradas en la base de datos.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                  <th className="pb-2.5 font-semibold">Clave de Rastreo</th>
                  <th className="pb-2.5 font-semibold">Tipo</th>
                  <th className="pb-2.5 font-semibold">Monto</th>
                  <th className="pb-2.5 font-semibold">Beneficiario / CLABE</th>
                  <th className="pb-2.5 font-semibold">Institución</th>
                  <th className="pb-2.5 font-semibold">Estado Banxico</th>
                  <th className="pb-2.5 font-semibold text-right">Comprobante</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 pr-3 font-bold text-slate-200">
                      <div>{tx.claveRastreo}</div>
                      {tx.folioStp && (
                        <div className="text-[10px] text-slate-500">Folio: {tx.folioStp}</div>
                      )}
                    </td>
                    <td className="py-3 pr-3">
                      {tx.tipo === 'abono' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px] font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          <ArrowDownLeft className="w-3 h-3" /> Abono
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-sky-400 text-[11px] font-semibold bg-sky-500/10 px-2 py-0.5 rounded-full">
                          <ArrowUpRight className="w-3 h-3" /> Cargo
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-3 font-bold text-white">
                      ${tx.monto.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
                    </td>
                    <td className="py-3 pr-3">
                      <div className="text-slate-200 truncate max-w-[160px]">{tx.nombreBeneficiario}</div>
                      <div className="text-[10px] text-slate-500">{tx.cuentaBeneficiario}</div>
                    </td>
                    <td className="py-3 pr-3 text-slate-300">
                      {tx.institucionContraparteNombre || tx.institucionContraparte}
                    </td>
                    <td className="py-3 pr-3">
                      {tx.estado === 'LIQUIDADA' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <CheckCircle className="w-3 h-3" /> LIQUIDADA
                        </span>
                      )}
                      {tx.estado === 'EN_PROCESO' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          <Clock className="w-3 h-3 animate-spin" /> EN PROCESO
                        </span>
                      )}
                      {tx.estado === 'DEVUELTA' && (
                        <div>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                            <XCircle className="w-3 h-3" /> DEVUELTA
                          </span>
                          {tx.causaDevolucion && (
                            <div className="text-[9px] text-red-400/80 mt-0.5 truncate max-w-[160px]">
                              {tx.causaDevolucion}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <a
                        href={tx.cepUrl || 'https://www.banxico.org.mx/cep/'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        <span>CEP Banxico</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* WEBHOOK EVENT LOGS */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">
              Historial de Eventos Webhook Recibidos ({webhookEvents.length})
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Auditoría de confirmaciones STP / Banxico
          </span>
        </div>

        {webhookEvents.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            No se han registrado eventos en el webhook aún.
          </div>
        ) : (
          <div className="space-y-2.5">
            {webhookEvents.slice(0, 6).map((evt) => (
              <div
                key={evt.id}
                className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold",
                      evt.eventTipo === 'ORDEN_LIQUIDADA' && "bg-emerald-500/20 text-emerald-300",
                      evt.eventTipo === 'ABONO_ENTRANTE' && "bg-cyan-500/20 text-cyan-300",
                      evt.eventTipo === 'ORDEN_DEVUELTA' && "bg-red-500/20 text-red-300"
                    )}>
                      {evt.eventTipo}
                    </span>
                    <span className="text-slate-200 font-bold">{evt.claveRastreo}</span>
                    {evt.monto && (
                      <span className="text-slate-400">
                        (${evt.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN)
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans">{evt.resultado}</p>
                </div>
                <div className="text-[10px] text-slate-500 text-right shrink-0">
                  {new Date(evt.receivedAt).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Configuration Instructions & .env variables */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode2 className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">
              Configuración del Archivo .env para Producción (Vercel, Cloud Run o .env.local)
            </h3>
          </div>
          <button
            onClick={handleCopyEnv}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copiedEnv ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedEnv ? 'Copiado al Portapapeles' : 'Copiar Variables'}</span>
          </button>
        </div>

        <p className="text-xs text-slate-400">
          Agrega estas variables en la consola de tu proveedor de hosting (Settings &gt; Environment Variables en Vercel o en las variables de servicio de Google Cloud Run):
        </p>

        <div className="relative">
          <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-emerald-300/90 overflow-x-auto leading-relaxed">
            {envSample}
          </pre>
        </div>
      </div>

      {/* Formulario de Prueba de Dispersión */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Terminal className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">
              Nueva Orden de Transferencia SPEI (/api/spei/transfer)
            </h3>
          </div>

          <form onSubmit={handleRunLiveTest} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Cuenta CLABE Beneficiario (18 dígitos Banxico):
              </label>
              <input
                type="text"
                required
                maxLength={18}
                value={testClabe}
                onChange={(e) => setTestClabe(e.target.value.replace(/\D/g, ''))}
                placeholder="012180015678901234"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Institución receptora: Código {testClabe.slice(0, 3) || '---'} (BBVA / Santander / STP / Banorte)
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Nombre del Beneficiario:
              </label>
              <input
                type="text"
                required
                value={testBeneficiary}
                onChange={(e) => setTestBeneficiary(e.target.value)}
                placeholder="Nombre o Razón Social"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Monto (MXN / USD):
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={testAmount}
                  onChange={(e) => setTestAmount(e.target.value)}
                  placeholder="1500.00"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Concepto del Pago:
                </label>
                <input
                  type="text"
                  required
                  value={testConcept}
                  onChange={(e) => setTestConcept(e.target.value)}
                  placeholder="Factura, honorarios, etc."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSendingTest}
              className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSendingTest ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Procesando y Guardando en BD...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Registrar Orden y Enviar a Servidor SPEI</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Respuesta de la Pasarela */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Respuesta del Servidor Banxico / STP</h3>
              </div>
              {testResult && (
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-mono font-bold",
                  testResult.status === 200 ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"
                )}>
                  HTTP {testResult.status}
                </span>
              )}
            </div>

            {testResult ? (
              <div className="mt-4 space-y-3">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-1.5 text-slate-300">
                  <p className="flex justify-between">
                    <span className="text-slate-500">Clave de Rastreo:</span>
                    <strong className="text-emerald-400">{testResult.data.claveRastreo || '---'}</strong>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-500">Estado en BD:</span>
                    <strong className="text-emerald-300">{testResult.data.status || 'OK'}</strong>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-500">Modo de Operación:</span>
                    <span className="text-slate-200">{testResult.data.mode || 'STP_SERVER_ROUTE'}</span>
                  </p>
                  {testResult.data.selloDigitalBanxico && (
                    <div className="pt-1 border-t border-slate-800/80">
                      <span className="text-slate-500 block mb-0.5">Sello Digital SHA-256:</span>
                      <p className="text-[10px] text-slate-400 break-all bg-slate-900 p-1.5 rounded border border-slate-800">
                        {testResult.data.selloDigitalBanxico}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleSimulateBanxicoWebhook('liquidar', testResult.data.claveRastreo)}
                    className="flex-1 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Confirmar Liquidación Webhook</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSimulateBanxicoWebhook('devolver', testResult.data.claveRastreo)}
                    className="flex-1 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Simular Devolución</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <Clock className="w-8 h-8 mx-auto opacity-40" />
                <p className="text-xs">No se ha enviado ninguna orden reciente en esta sesión.</p>
                <p className="text-[11px] text-slate-600 max-w-xs mx-auto">
                  Registra una orden desde el formulario para ver cómo se guarda en la base de datos y cómo el webhook actualiza su estado.
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Protocolo Criptográfico:</span>
            <span className="font-mono text-emerald-400">RSA-SHA256 • PKI Banxico</span>
          </div>
        </div>
      </div>
    </div>
  );
}
