'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  X, 
  Send, 
  Bot, 
  User, 
  ShieldCheck, 
  Clock, 
  HelpCircle, 
  CreditCard, 
  ArrowRightLeft, 
  Building2, 
  CheckCircle2, 
  Sparkles,
  Minimize2,
  Headphones
} from 'lucide-react';
import { useBanking } from '@/lib/bankingStore';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user' | 'agent';
  text: string;
  timestamp: string;
}

export default function LiveSupportChat() {
  const { 
    userName, 
    userClabe, 
    userAccount, 
    balance, 
    isAccountBlocked,
    securityConfig 
  } = useBanking();

  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(1);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const msgCounterRef = useRef(100);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'bot',
      text: `¡Hola ${userName}! Bienvenido al Centro de Atención al Cliente y Soporte Bancario en Vivo de Banco Gold Payments. ¿En qué podemos orientarte el día de hoy?`,
      timestamp: 'Ahora',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages]);

  const quickQuestions = [
    {
      id: 'q-clabe',
      label: '¿Cuál es mi CLABE y cuenta?',
      reply: `Tu cuenta oficial registrada en Banco Gold Payments es la número ${userAccount} y tu CLABE Interbancaria certificada por Banxico es ${userClabe}. Con estos datos puedes recibir depósitos y transferencias SPEI en tiempo real.`,
    },
    {
      id: 'q-cot-imf',
      label: '¿Para qué sirven los códigos COT e IMF?',
      reply: `Los códigos de transferencia son candados de seguridad bancaria:\n• COT (Cost of Transfer / Certificado de Transferencia): Valida la liquidación de tarifas y gravámenes de envío.\n• IMF (International Monetary Fund): Código de autorización monetaria para giros de alto valor.\nActualmente tu sistema tiene activados: ${securityConfig.requireCot ? 'COT (Activo: ' + securityConfig.cotCode + ')' : 'COT (Inactivo)'} y ${securityConfig.requireImf ? 'IMF (Activo: ' + securityConfig.imfCode + ')' : 'IMF (Inactivo)'}. Puedes solicitar o desactivar estos códigos en el Panel Gestor.`,
    },
    {
      id: 'q-approval',
      label: '¿Por qué mi transferencia está pendiente?',
      reply: `Por políticas de prevención de lavado y seguridad, las transferencias superiores a $${securityConfig.minAmountForApproval.toLocaleString()} USD requieren aprobación manual del Gestor en el Panel de Control. Una vez que el Gestor revise y apruebe la operación, se liquidará automáticamente y recibirás un correo de confirmación.`,
    },
    {
      id: 'q-status',
      label: '¿Cuál es el estado de mi cuenta?',
      reply: isAccountBlocked 
        ? `ALERTA: Tu cuenta se encuentra temporalmente bloqueada/congelada por orden del departamento de cumplimiento. Comunícate con un asesor para solicitar la reactivación.`
        : `Tu cuenta está 100% ACTIVA y en regla. Tienes un saldo disponible de $${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD para operar transferencias, depósitos y retiros.`,
    },
    {
      id: 'q-deposit',
      label: '¿Cómo realizar un depósito o débito?',
      reply: `Puedes realizar depósitos de forma directa mediante SPEI, tarjeta o a través del Panel Gestor (Administrador), donde el operador puede acreditar fondos inmediatos a cualquier cuenta con folio oficial.`,
    },
  ];

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text) return;

    chatMsgCounter += 1;
    const msgId = 'msg-u-' + chatMsgCounter;
    const nowTime = 'Ahora';

    const userMsg: ChatMessage = {
      id: msgId,
      sender: 'user',
      text,
      timestamp: nowTime,
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    // Dynamic bank agent response calculation
    setTimeout(() => {
      let botResponse = '';
      const lower = text.toLowerCase();

      if (lower.includes('clabe') || lower.includes('cuenta')) {
        botResponse = `Tu número de cuenta es ${userAccount} y tu CLABE interbancaria es ${userClabe}. Ambos se encuentran vigentes en el sistema SPEI.`;
      } else if (lower.includes('cot') || lower.includes('imf') || lower.includes('swift') || lower.includes('código')) {
        botResponse = `Información de Códigos de Transferencia:\n- Código COT: ${securityConfig.requireCot ? securityConfig.cotCode : 'Desactivado'}\n- Código IMF: ${securityConfig.requireImf ? securityConfig.imfCode : 'Desactivado'}\n- Código SWIFT: ${securityConfig.requireSwift ? securityConfig.swiftCode : 'Desactivado'}\nEstos parámetros se administran desde la pestaña "Seguridad y Códigos" en el Panel Gestor.`;
      } else if (lower.includes('pendiente') || lower.includes('aprobar') || lower.includes('gestor')) {
        botResponse = `Las transferencias pendientes se auditan en tiempo real en el Panel Gestor. Al ingresar como Gestor/Administrador, puedes aprobarlas con un solo clic o rechazarlas para reembolsar el monto al usuario.`;
      } else if (lower.includes('saldo') || lower.includes('balance') || lower.includes('dinero')) {
        botResponse = `Tu saldo disponible es de $${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD. Si requieres un abono, el Gestor puede realizar depósitos directos desde la administración.`;
      } else if (lower.includes('bloque') || lower.includes('congel')) {
        botResponse = isAccountBlocked 
          ? `Tu cuenta está marcada como bloqueada. Puedes desbloquearla inmediatamente en la pestaña "Gestión de Cuentas" del Panel Gestor.`
          : `Tu cuenta está completamente activa y sin restricciones.`;
      } else if (lower.includes('asesor') || lower.includes('humano')) {
        botResponse = `Te hemos conectado con la Lic. Valeria Morales, Asesora Senior de Operaciones Bancarias. Ella tiene acceso directo a tu expediente para asistirte con transferencias y autorizaciones.`;
      } else {
        botResponse = `Entendido. Tu solicitud ha sido registrada en el sistema de tickets de Banco Gold Payments. Si se trata de una transferencia o validación de códigos (COT/IMF), recuerda que puedes gestionarla directamente en el Panel Gestor. ¿Hay algo más en lo que te podamos ayudar?`;
      }

      chatMsgCounter += 1;
      const botId = 'bot-' + chatMsgCounter;
      setMessages(prev => [
        ...prev,
        {
          id: botId,
          sender: 'agent',
          text: botResponse,
          timestamp: 'Ahora',
        },
      ]);
      setIsTyping(false);
    }, 900);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setIsOpen(true);
            setUnreadCount(0);
          }}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-full shadow-2xl shadow-emerald-950/50 border border-emerald-400/30 transition-all cursor-pointer"
        >
          <div className="relative">
            <Headphones className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-300 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-300 rounded-full" />
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-bold leading-tight">Chat de Atención en Vivo</p>
            <p className="text-[10px] text-emerald-100 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
              Asesoría Bancaria 24/7
            </p>
          </div>
          {unreadCount > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs font-black bg-white text-emerald-700 rounded-full shadow-sm">
              {unreadCount}
            </span>
          )}
        </motion.button>
      )}

      {/* Chat Window Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-4 sm:right-6 z-50 w-[95vw] sm:w-[420px] h-[580px] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-850 to-emerald-950/40 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold">
                    <Headphones className="w-5 h-5" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-slate-900 rounded-full" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    Atención al Cliente Bancario
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium">
                      En Línea
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Lic. Valeria Morales • Asesoría Financiera Inmediata
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Context Bar */}
            <div className="px-4 py-2 bg-slate-950/70 border-b border-slate-800/80 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Cuenta: <strong className="text-slate-200">{userAccount}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <span>Saldo: <strong className="text-emerald-400">${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD</strong></span>
              </div>
            </div>

            {/* Message Thread */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 text-sm">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender !== 'user' && (
                    <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xs shrink-0 mt-0.5">
                      <Headphones className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 shadow-sm text-xs leading-relaxed whitespace-pre-line ${
                      msg.sender === 'user'
                        ? 'bg-emerald-600 text-white rounded-br-none'
                        : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-bl-none'
                    }`}
                  >
                    {msg.text}
                    <div
                      className={`text-[9px] mt-1 text-right font-mono ${
                        msg.sender === 'user' ? 'text-emerald-200' : 'text-slate-400'
                      }`}
                    >
                      {msg.timestamp}
                    </div>
                  </div>

                  {msg.sender === 'user' && (
                    <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 text-xs shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex gap-2.5 items-center text-slate-400 text-xs italic">
                  <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xs shrink-0">
                    <Headphones className="w-3.5 h-3.5" />
                  </div>
                  <div className="bg-slate-800 border border-slate-700/60 rounded-2xl rounded-bl-none px-3 py-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" />
                    <span className="text-[11px] text-slate-400 ml-1">Escribiendo respuesta...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestion Chips */}
            <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-950/40">
              <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Preguntas Rápidas:
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
                {quickQuestions.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => {
                      handleSendMessage(q.label);
                    }}
                    className="shrink-0 text-[11px] px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors cursor-pointer"
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Escribe tu consulta bancaria aquí..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim()}
                className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
