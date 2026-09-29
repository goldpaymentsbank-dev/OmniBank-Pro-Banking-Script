'use client';

import React, { useState } from 'react';
import { 
  Cloud, 
  Terminal, 
  Copy, 
  Check, 
  Server, 
  Cpu, 
  ExternalLink, 
  Layers, 
  CheckCircle2, 
  Code2, 
  ShieldCheck,
  Zap,
  Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function GcpDeploymentInspector() {
  const [projectId, setProjectId] = useState('ais-gold-payments-416697');
  const [copiedBuildCmd, setCopiedBuildCmd] = useState(false);
  const [copiedDeployCmd, setCopiedDeployCmd] = useState(false);
  const [copiedScriptCmd, setCopiedScriptCmd] = useState(false);
  const [copiedYamlCmd, setCopiedYamlCmd] = useState(false);

  const cleanProject = projectId.trim() || 'TU_PROYECTO_GCP';

  const buildCmd = `gcloud builds submit --tag gcr.io/${cleanProject}/gold-payments-bank`;
  const deployCmd = `gcloud run deploy gold-payments-bank --image gcr.io/${cleanProject}/gold-payments-bank --platform managed --allow-unauthenticated --port 3000`;
  const scriptCmd = `bash ./deploy-gcp.sh ${cleanProject}`;
  const yamlCmd = `gcloud builds submit --config=cloudbuild.yaml --substitutions=_PROJECT_ID=${cleanProject}`;

  const copyToClipboard = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950/40 to-slate-900 border border-sky-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-sky-500/20 text-sky-400 border border-sky-500/30">
                <Cloud className="w-4 h-4" />
              </span>
              <span className="text-xs uppercase font-mono tracking-widest text-sky-400 font-bold">
                GOOGLE CLOUD PLATFORM • DESPLIEGUE CONTINUO
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                Cloud Run • Puerto 3000
              </span>
            </div>
            <h2 className="text-xl font-black text-white">
              Despliegue en Google Cloud Build & Cloud Run
            </h2>
            <p className="text-xs text-slate-400 max-w-3xl">
              Configuración de compilación automatizada en contenedor Dockerfile multi-stage con Next.js 15 Standalone y despliegue administrado en Google Cloud Run en el puerto 3000.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://console.cloud.google.com/run"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 bg-slate-950 border border-slate-800 hover:border-sky-500/50 rounded-xl text-xs font-semibold text-sky-400 flex items-center gap-2 transition-all"
            >
              <span>Consola Cloud Run</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Project ID Input Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-sky-400" />
              <span>ID del Proyecto de Google Cloud (GCP Project ID)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Ingresa tu Project ID para personalizar los comandos de despliegue en tiempo real:
            </p>
          </div>
          <div className="w-full sm:w-80">
            <input
              type="text"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder="Ej. mi-proyecto-gcp-12345"
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl text-xs font-mono text-sky-300 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Grid of Commands */}
      <div className="grid grid-cols-1 gap-4">
        {/* Step 1: Cloud Build */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 font-bold text-xs flex items-center justify-center border border-sky-500/30">
                1
              </span>
              <div>
                <h4 className="text-xs font-bold text-white">
                  Compilar y Subir Imagen a Google Container Registry (Cloud Build)
                </h4>
                <p className="text-[11px] text-slate-400">
                  Usa el Dockerfile optimizado para compilar la imagen de producción en la infraestructura de Google.
                </p>
              </div>
            </div>
            <button
              onClick={() => copyToClipboard(buildCmd, setCopiedBuildCmd)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedBuildCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedBuildCmd ? 'Copiado' : 'Copiar'}</span>
            </button>
          </div>

          <div className="relative">
            <pre className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-sky-300 overflow-x-auto">
              {buildCmd}
            </pre>
          </div>
        </div>

        {/* Step 2: Cloud Run Deploy */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center border border-emerald-500/30">
                2
              </span>
              <div>
                <h4 className="text-xs font-bold text-white">
                  Desplegar Servicio en Google Cloud Run (Puerto 3000)
                </h4>
                <p className="text-[11px] text-slate-400">
                  Levanta el servicio administrado con autoescalado desde cero, HTTPS gratuito y acceso público.
                </p>
              </div>
            </div>
            <button
              onClick={() => copyToClipboard(deployCmd, setCopiedDeployCmd)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedDeployCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedDeployCmd ? 'Copiado' : 'Copiar'}</span>
            </button>
          </div>

          <div className="relative">
            <pre className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-emerald-300 overflow-x-auto">
              {deployCmd}
            </pre>
          </div>
        </div>

        {/* Option 3: Script Automatizado */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <div>
                <h4 className="text-xs font-bold text-white">
                  Ejecución Automatizada con Script Todo-en-Uno (deploy-gcp.sh)
                </h4>
                <p className="text-[11px] text-slate-400">
                  Ejecuta ambos pasos de forma secuencial con comprobación de errores y logging en consola.
                </p>
              </div>
            </div>
            <button
              onClick={() => copyToClipboard(scriptCmd, setCopiedScriptCmd)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedScriptCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedScriptCmd ? 'Copiado' : 'Copiar'}</span>
            </button>
          </div>

          <div className="relative">
            <pre className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-amber-300 overflow-x-auto">
              {scriptCmd}
            </pre>
          </div>
        </div>
      </div>

      {/* Specifications & Architecture Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-1.5">
          <div className="flex items-center gap-2 text-sky-400">
            <Layers className="w-4 h-4" />
            <span className="text-xs font-bold">Dockerfile Multi-Stage</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Base Node.js 20 Alpine con separación de dependencias y usuario seguro sin privilegios (UID 1001).
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-1.5">
          <div className="flex items-center gap-2 text-emerald-400">
            <Cpu className="w-4 h-4" />
            <span className="text-xs font-bold">Next.js Standalone</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Exportación optimizada que reduce el tamaño del contenedor a menos de 150MB para inicios en frío ultra-rápidos.
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-1.5">
          <div className="flex items-center gap-2 text-purple-400">
            <Globe className="w-4 h-4" />
            <span className="text-xs font-bold">Cloud Run Managed</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Escalado automático hasta cero cuando no hay tráfico para costo cero en reposo y respuesta instantánea.
          </p>
        </div>
      </div>
    </div>
  );
}
