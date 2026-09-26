'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
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
  Code2,
  Sliders,
  ExternalLink,
  Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MercadoPagoProductionInspector() {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedManifest, setCopiedManifest] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{
    status: number;
    data: any;
    timestamp: string;
  } | null>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);

  // Production variables provided
  const prodVars = {
    id: '10982348572',
    requestId: '8d264516-ec08-410a-810a-36b0ec71ccb7',
    ts: '1790383490',
    signatureTs: '1790383524',
    signatureV1: 'ac97a8c5d522dd1c7b5ed07270347a204baa152ccc1165823633c905713a2c52',
    canonicalManifest: 'id:10982348572;request-id:8d264516-ec08-410a-810a-36b0ec71ccb7;ts:1790383490;',
    endpoint: '/v1/webhooks/mercadopago?data.id=10982348572&type=payment',
  };

  const curlCommand = `curl -X POST "https://api.yourdomain.com/v1/webhooks/mercadopago?data.id=10982348572&type=payment" \\
  -H "Content-Type: application/json" \\
  -H "x-signature: ts=${prodVars.signatureTs},v1=${prodVars.signatureV1}" \\
  -H "x-request-id: ${prodVars.requestId}" \\
  -d '{
  "id": 11029384756,
  "live_mode": true,
  "type": "payment",
  "date_created": "2026-09-19T15:30:00.000Z",
  "application_id": 48201948291029,
  "user_id": 194820192,
  "version": 1,
  "api_version": "v1",
  "action": "payment.created",
  "data": {
    "id": "10982348572"
  }
}'`;

  const fetchLogs = () => {
    fetch('/api/webhooks/mercadopago?action=history')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.logs) setRecentLogs(data.logs);
      })
      .catch(() => {});
  };

  // Fetch recent logs on mount
  useEffect(() => {
    let active = true;
    fetch('/api/webhooks/mercadopago?action=history')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (active && data?.logs) {
          setRecentLogs(data.logs);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(curlCommand);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyManifest = () => {
    navigator.clipboard.writeText(prodVars.canonicalManifest);
    setCopiedManifest(true);
    setTimeout(() => setCopiedManifest(false), 2000);
  };

  // Test live webhook dispatch
  const handleTestWebhook = async () => {
    setIsSendingTest(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/webhooks/mercadopago?data.id=10982348572&type=payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-signature': `ts=${prodVars.signatureTs},v1=${prodVars.signatureV1}`,
          'x-request-id': prodVars.requestId,
        },
        body: JSON.stringify({
          id: 11029384756,
          live_mode: true,
          type: 'payment',
          date_created: new Date().toISOString(),
          application_id: 48201948291029,
          user_id: 194820192,
          version: 1,
          api_version: 'v1',
          action: 'payment.created',
          data: {
            id: prodVars.id,
          },
        }),
      });

      const data = await res.json();
      setTestResult({
        status: res.status,
        data,
        timestamp: new Date().toLocaleTimeString(),
      });

      fetchLogs();
    } catch (err: any) {
      setTestResult({
        status: 500,
        data: { error: err?.message || 'Error al ejecutar prueba de webhook' },
        timestamp: new Date().toLocaleTimeString(),
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-extrabold tracking-wide uppercase flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Modo Producción Activo
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700 text-xs font-semibold">
              Sandbox Desactivado
            </span>
          </div>

          <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldCheck size={22} className="text-amber-400" />
            <span>Mercado Pago • Producción Live & Webhooks</span>
          </h3>
          <p className="text-xs text-neutral-400 mt-1 max-w-xl">
            Integración de variables de modo producción, verificación HMAC-SHA256 contra el manifiesto canónico y receptor SLA &lt; 3000ms.
          </p>
        </div>

        {/* Live CTA */}
        <button
          type="button"
          onClick={handleTestWebhook}
          disabled={isSendingTest}
          className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20 active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shrink-0"
        >
          {isSendingTest ? (
            <>
              <RefreshCw size={14} className="animate-spin" />
              <span>Enviando Payload...</span>
            </>
          ) : (
            <>
              <Zap size={15} />
              <span>Probar Webhook en Vivo</span>
            </>
          )}
        </button>
      </div>

      {/* Production Variables Grid */}
      <div>
        <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">
          Variables Modo Producción Inyectadas
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl">
            <span className="text-[10px] text-neutral-500 block uppercase font-bold">Transaction / Data ID</span>
            <span className="text-sm font-mono font-bold text-amber-400">{prodVars.id}</span>
          </div>
          <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl">
            <span className="text-[10px] text-neutral-500 block uppercase font-bold">x-request-id</span>
            <span className="text-xs font-mono font-semibold text-neutral-200 truncate block">{prodVars.requestId}</span>
          </div>
          <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl">
            <span className="text-[10px] text-neutral-500 block uppercase font-bold">Timestamp (ts)</span>
            <span className="text-sm font-mono font-bold text-sky-400">{prodVars.ts}</span>
          </div>
        </div>
      </div>

      {/* Canonical Manifest Card */}
      <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
            <Code2 size={14} className="text-amber-400" />
            <span>Manifiesto Canónico de Verificación (HMAC-SHA256)</span>
          </span>
          <button
            type="button"
            onClick={handleCopyManifest}
            className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
          >
            {copiedManifest ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            <span>{copiedManifest ? 'Copiado' : 'Copiar'}</span>
          </button>
        </div>
        <div className="p-2.5 bg-neutral-900 border border-neutral-850 rounded-xl font-mono text-xs text-amber-300 break-all select-all">
          {prodVars.canonicalManifest}
        </div>
        <p className="text-[11px] text-neutral-500">
          Estructura oficial: <code className="text-neutral-400">id:[data.id];request-id:[x-request-id];ts:[ts];</code>
        </p>
      </div>

      {/* Test Result Toast/Box */}
      {testResult && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'p-4 rounded-2xl border flex items-start gap-3',
            testResult.status === 200
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : 'bg-rose-500/10 border-rose-500/30'
          )}
        >
          {testResult.status === 200 ? (
            <CheckCircle2 size={20} className="text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle size={20} className="text-rose-400 shrink-0 mt-0.5" />
          )}
          <div className="w-full">
            <div className="flex justify-between items-center">
              <h5 className="text-xs font-bold text-white">
                Respuesta del Servidor HTTP {testResult.status} ({testResult.timestamp})
              </h5>
              <span className="text-[10px] text-emerald-400 font-mono font-bold">
                {testResult.data?.status || 'OK'}
              </span>
            </div>
            <pre className="mt-2 p-2.5 bg-neutral-950 rounded-xl text-[11px] font-mono text-neutral-200 overflow-x-auto border border-neutral-800">
              {JSON.stringify(testResult.data, null, 2)}
            </pre>
          </div>
        </motion.div>
      )}

      {/* Terminal cURL Viewer */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
            <Terminal size={14} className="text-amber-400" />
            <span>Comando cURL de Prueba en Producción</span>
          </span>
          <button
            type="button"
            onClick={handleCopyCurl}
            className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
          >
            {copiedCode ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            <span>{copiedCode ? 'Copiado al portapapeles' : 'Copiar cURL'}</span>
          </button>
        </div>

        <pre className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl font-mono text-xs text-neutral-300 overflow-x-auto leading-relaxed select-all">
          {curlCommand}
        </pre>
      </div>

      {/* Logs stream */}
      {recentLogs.length > 0 && (
        <div className="pt-2 border-t border-neutral-800">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
              Historial de Notificaciones Webhook ({recentLogs.length})
            </span>
            <button
              onClick={fetchLogs}
              className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
            >
              <RefreshCw size={11} />
              <span>Refrescar</span>
            </button>
          </div>

          <div className="space-y-2">
            {recentLogs.slice(0, 3).map((log, idx) => (
              <div
                key={log.id || idx}
                className="p-3 bg-neutral-950/70 border border-neutral-800/80 rounded-xl flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="font-mono font-bold text-amber-400">ID: {log.dataId}</span>
                  <span className="text-neutral-400">({log.action})</span>
                </div>

                <div className="flex items-center gap-3 text-neutral-400 text-[11px]">
                  <span className="font-semibold text-emerald-400 uppercase">{log.status}</span>
                  <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
