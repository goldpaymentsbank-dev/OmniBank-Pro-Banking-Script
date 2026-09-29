'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, UserCheck, Phone, MapPin, Building2, CheckCircle2, Save } from 'lucide-react';
import { useBanking, UserAccountItem } from '@/lib/bankingStore';

interface EditUserModalProps {
  user: UserAccountItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function EditUserModal({
  user,
  isOpen,
  onClose,
  onSuccess,
}: EditUserModalProps) {
  if (!isOpen || !user) return null;

  return (
    <EditUserModalContent
      key={user.id}
      user={user}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}

function EditUserModalContent({
  user,
  onClose,
  onSuccess,
}: {
  user: UserAccountItem;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const { adminEditUser } = useBanking();

  const [phone, setPhone] = useState(user.phone || '');
  const [postalCode, setPostalCode] = useState(user.postalCode || '06600');
  const [address, setAddress] = useState(user.address || '');
  const [tier, setTier] = useState<'Personal' | 'Premier' | 'Empresarial'>(user.tier || 'Personal');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;

    adminEditUser(user.id, {
      phone: phone.trim(),
      postalCode: postalCode.trim() || '06600',
      address: address.trim(),
      tier,
    });

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
      if (onSuccess) onSuccess();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 md:p-8 max-w-md w-full space-y-5 shadow-2xl text-neutral-100 relative overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <UserCheck size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-100">
                Editar Datos de Usuario
              </h3>
              <p className="text-[11px] text-neutral-400 font-mono">
                {user.name} ({user.accountNumber})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-neutral-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {savedSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
              <CheckCircle2 size={32} />
            </div>
            <h4 className="text-lg font-bold text-neutral-100">¡Configuración Guardada Exitosamente!</h4>
            <p className="text-xs text-neutral-400 max-w-xs mx-auto">
              Se ha actualizado el teléfono a <strong className="text-neutral-200">{phone}</strong> y el código postal AVS a <strong className="text-neutral-200">{postalCode}</strong>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1 flex items-center gap-1.5">
                <Phone size={13} className="text-emerald-400" />
                <span>Número de Teléfono Móvil *</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+52 55 8492 7104"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-neutral-100 font-mono focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[10px] text-neutral-400 mt-1">
                Número registrado para envío de códigos OTP y confirmaciones telefónicas.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1 flex items-center gap-1.5">
                <Building2 size={13} className="text-amber-400" />
                <span>Código Postal (Validación AVS Compras en Línea) *</span>
              </label>
              <input
                type="text"
                required
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="Ej. 06600"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-neutral-100 focus:outline-none focus:border-amber-500"
              />
              <p className="text-[10px] text-neutral-400 mt-1">
                Utilizado para verificar pagos con tarjeta en plataformas de e-commerce y pasarelas de pago.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1 flex items-center gap-1.5">
                <MapPin size={13} className="text-emerald-400" />
                <span>Dirección de Domicilio Registrada</span>
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Calle, número, colonia, ciudad"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-neutral-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Nivel de Cuenta (Tier)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Personal', 'Premier', 'Empresarial'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTier(t)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                      tier === t
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-semibold hover:bg-neutral-750 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-950/40 flex items-center justify-center gap-1.5"
              >
                <Save size={14} />
                <span>Guardar Configuración</span>
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
