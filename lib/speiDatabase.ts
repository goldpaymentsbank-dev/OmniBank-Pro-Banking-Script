// lib/speiDatabase.ts
// Gold Payments Bank - Base de Datos Centralizada y Manejador de Eventos SPEI / Banxico

export interface SpeiTransaction {
  id: string;
  claveRastreo: string;
  folioStp?: string | number;
  tipo: 'cargo' | 'abono';
  monto: number;
  cuentaOrdenante: string;
  nombreOrdenante: string;
  cuentaBeneficiario: string;
  nombreBeneficiario: string;
  concepto: string;
  institucionContraparte: string;
  institucionContraparteNombre?: string;
  estado: 'REGISTRADA' | 'EN_PROCESO' | 'LIQUIDADA' | 'DEVUELTA' | 'CANCELADA' | 'RECHAZADA';
  causaDevolucion?: string;
  selloDigital?: string;
  fechaOperacion: string;
  tsLiquidacion?: string;
  cepUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SpeiWebhookEvent {
  id: string;
  receivedAt: string;
  eventTipo: 'ORDEN_LIQUIDADA' | 'ABONO_ENTRANTE' | 'ORDEN_DEVUELTA' | 'ORDEN_CANCELADA' | 'ESTADO_DESCONOCIDO';
  claveRastreo: string;
  estadoBanxico: string;
  monto?: number;
  payload: any;
  procesado: boolean;
  resultado: string;
  affectedTxId?: string;
}

// Catálogo de causas de devolución oficiales de Banxico
export const BANXICO_CAUSAS_DEVOLUCION: Record<number | string, string> = {
  1: 'Cuenta Inexistente en Banco Receptor',
  2: 'Cuenta Bloqueada por la Entidad Receptora',
  3: 'Cuenta Cancelada',
  4: 'Cuenta del Beneficiario no Pertenece al Tipo Especificado',
  5: 'Tipo de Pago Incorrecto',
  6: 'Nombre del Beneficiario no Coincide con la Cuenta',
  13: 'Excede el Límite de Saldo / Abonos Permitidos',
  14: 'Falta de Información o Datos Incompletos',
  15: 'Devolución Solicitada por el Participante Emisor',
  16: 'Fondos No Disponibles en Liquidación Banxico',
};

// Nombres de bancos participantes comunes en Banxico
export const BANXICO_INSTITUCIONES: Record<string, string> = {
  '002': 'BANAMEX (Citibanamex)',
  '012': 'BBVA México',
  '014': 'Santander México',
  '021': 'HSBC México',
  '044': 'Scotiabank Inverlat',
  '058': 'Banco Banregio',
  '072': 'Banorte (Banco Mercantil del Norte)',
  '127': 'Banco Azteca',
  '137': 'Bancoppel',
  '646': 'STP (Sistema de Transferencias y Pagos)',
  '659': 'OXXO / Spin by OXXO',
  '684': 'AlquimiaPay',
  '846': 'Gold Payments Bank (GPB)',
};

// Store en memoria persistente a nivel de Node global
declare global {
  var __SPEI_TRANSACTIONS__: SpeiTransaction[] | undefined;
  var __SPEI_WEBHOOK_EVENTS__: SpeiWebhookEvent[] | undefined;
}

function getInitialTransactions(): SpeiTransaction[] {
  return [
    {
      id: 'tx-spei-init-01',
      claveRastreo: 'GPB20260929KL881',
      folioStp: 'STP-948201',
      tipo: 'cargo',
      monto: 15400.00,
      cuentaOrdenante: '846180492019284017',
      nombreOrdenante: 'Carlos Mendoza',
      cuentaBeneficiario: '012180015678901234',
      nombreBeneficiario: 'Corporativo Financiero del Norte S.A.',
      concepto: 'Pago de servicios y logística',
      institucionContraparte: '012',
      institucionContraparteNombre: 'BBVA México',
      estado: 'LIQUIDADA',
      fechaOperacion: '2026-09-29',
      tsLiquidacion: '2026-09-29T10:15:22.000-06:00',
      selloDigital: 'A489F382180E894129A8C7182903B4278190ACDE1894017263548190ABCD8812',
      cepUrl: 'https://www.banxico.org.mx/cep/',
      createdAt: '2026-09-29T10:14:50.000Z',
      updatedAt: '2026-09-29T10:15:22.000Z',
    },
    {
      id: 'tx-spei-init-02',
      claveRastreo: 'BBVA202609299482019',
      folioStp: 'STP-948202',
      tipo: 'abono',
      monto: 32000.00,
      cuentaOrdenante: '072180009876543210',
      nombreOrdenante: 'Grupo Alfa Distribuciones',
      cuentaBeneficiario: '846180492019284017',
      nombreBeneficiario: 'Carlos Mendoza',
      concepto: 'Liquidación de honorarios profesionales',
      institucionContraparte: '072',
      institucionContraparteNombre: 'Banorte',
      estado: 'LIQUIDADA',
      fechaOperacion: '2026-09-29',
      tsLiquidacion: '2026-09-29T11:30:10.000-06:00',
      cepUrl: 'https://www.banxico.org.mx/cep/',
      createdAt: '2026-09-29T11:29:45.000Z',
      updatedAt: '2026-09-29T11:30:10.000Z',
    }
  ];
}

function getInitialWebhookEvents(): SpeiWebhookEvent[] {
  return [
    {
      id: 'wh-evt-01',
      receivedAt: '2026-09-29T10:15:22.000Z',
      eventTipo: 'ORDEN_LIQUIDADA',
      claveRastreo: 'GPB20260929KL881',
      estadoBanxico: 'LIQUIDADA',
      monto: 15400.00,
      payload: {
        id: 948201,
        claveRastreo: 'GPB20260929KL881',
        estado: 'LIQUIDADA',
        tsLiquidacion: '2026-09-29T10:15:22.000-06:00',
        empresa: 'GOLDPAYMENTS',
      },
      procesado: true,
      resultado: 'Transacción GPB20260929KL881 actualizada a estado LIQUIDADA en Banxico.',
      affectedTxId: 'tx-spei-init-01',
    },
    {
      id: 'wh-evt-02',
      receivedAt: '2026-09-29T11:30:10.000Z',
      eventTipo: 'ABONO_ENTRANTE',
      claveRastreo: 'BBVA202609299482019',
      estadoBanxico: 'LIQUIDADA',
      monto: 32000.00,
      payload: {
        id: 948202,
        claveRastreo: 'BBVA202609299482019',
        monto: 32000.00,
        nombreBeneficiario: 'Carlos Mendoza',
        cuentaBeneficiario: '846180492019284017',
        conceptoPago: 'Liquidación de honorarios profesionales',
      },
      procesado: true,
      resultado: 'Abono recibido por $32,000.00 MXN acreditado a cuenta 846180492019284017.',
      affectedTxId: 'tx-spei-init-02',
    }
  ];
}

// Inicializar almacenamiento global seguro
if (!global.__SPEI_TRANSACTIONS__) {
  global.__SPEI_TRANSACTIONS__ = getInitialTransactions();
}
if (!global.__SPEI_WEBHOOK_EVENTS__) {
  global.__SPEI_WEBHOOK_EVENTS__ = getInitialWebhookEvents();
}

export const speiDb = {
  getTransactions(): SpeiTransaction[] {
    return global.__SPEI_TRANSACTIONS__ || [];
  },

  getTransactionByClaveRastreo(claveRastreo: string): SpeiTransaction | undefined {
    return (global.__SPEI_TRANSACTIONS__ || []).find(
      t => t.claveRastreo.trim().toUpperCase() === claveRastreo.trim().toUpperCase()
    );
  },

  createTransaction(tx: Omit<SpeiTransaction, 'id' | 'createdAt' | 'updatedAt'>): SpeiTransaction {
    const now = new Date().toISOString();
    const instCode = tx.cuentaBeneficiario?.slice(0, 3) || tx.institucionContraparte || '646';
    const newTx: SpeiTransaction = {
      ...tx,
      id: `spei-tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      institucionContraparte: instCode,
      institucionContraparteNombre: tx.institucionContraparteNombre || BANXICO_INSTITUCIONES[instCode] || 'Entidad Interbancaria',
      createdAt: now,
      updatedAt: now,
    };

    global.__SPEI_TRANSACTIONS__ = [newTx, ...(global.__SPEI_TRANSACTIONS__ || [])];
    return newTx;
  },

  updateTransactionStatus(
    claveRastreo: string, 
    newStatus: SpeiTransaction['estado'], 
    extra?: { causaDevolucion?: string; tsLiquidacion?: string; folioStp?: string | number }
  ): SpeiTransaction | undefined {
    const list = global.__SPEI_TRANSACTIONS__ || [];
    const index = list.findIndex(
      t => t.claveRastreo.trim().toUpperCase() === claveRastreo.trim().toUpperCase()
    );

    if (index === -1) return undefined;

    const current = list[index];
    const updated: SpeiTransaction = {
      ...current,
      estado: newStatus,
      updatedAt: new Date().toISOString(),
      ...(extra?.causaDevolucion ? { causaDevolucion: extra.causaDevolucion } : {}),
      ...(extra?.tsLiquidacion ? { tsLiquidacion: extra.tsLiquidacion } : {}),
      ...(extra?.folioStp ? { folioStp: extra.folioStp } : {}),
    };

    list[index] = updated;
    global.__SPEI_TRANSACTIONS__ = [...list];
    return updated;
  },

  getWebhookEvents(): SpeiWebhookEvent[] {
    return global.__SPEI_WEBHOOK_EVENTS__ || [];
  },

  addWebhookEvent(event: Omit<SpeiWebhookEvent, 'id' | 'receivedAt'>): SpeiWebhookEvent {
    const newEvent: SpeiWebhookEvent = {
      ...event,
      id: `wh-evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      receivedAt: new Date().toISOString(),
    };

    global.__SPEI_WEBHOOK_EVENTS__ = [newEvent, ...(global.__SPEI_WEBHOOK_EVENTS__ || [])];
    return newEvent;
  },

  /**
   * MANEJADOR PRINCIPAL DE EVENTOS DE WEBHOOKS STP / BANXICO
   * Procesa la carga útil y actualiza automáticamente el estado en la base de datos
   */
  handleStpWebhook(payload: any): { 
    success: boolean; 
    actionTaken: string; 
    event: SpeiWebhookEvent; 
    transaction?: SpeiTransaction 
  } {
    const claveRastreo = payload.claveRastreo || payload.id || `REC-${Date.now()}`;
    const rawEstado = (payload.estado || '').toUpperCase();
    const rawCausa = payload.causaDevolucion !== undefined ? Number(payload.causaDevolucion) : undefined;
    const causaDesc = rawCausa ? (BANXICO_CAUSAS_DEVOLUCION[rawCausa] || `Causa Banxico Código ${rawCausa}`) : undefined;
    const monto = payload.monto ? Number(payload.monto) : undefined;

    let eventTipo: SpeiWebhookEvent['eventTipo'] = 'ESTADO_DESCONOCIDO';
    let actionTaken = '';
    let updatedTx: SpeiTransaction | undefined;

    // CASO 1: Es un abono entrante (depósito recibido a una CLABE de nuestro banco)
    if (payload.cuentaBeneficiario && payload.institucionBeneficiaria) {
      eventTipo = 'ABONO_ENTRANTE';
      const instEmisora = String(payload.institucionOrdenante || '').slice(-3) || '012';

      // Verificar si ya existía la transacción
      const existing = this.getTransactionByClaveRastreo(claveRastreo);
      if (existing) {
        updatedTx = this.updateTransactionStatus(claveRastreo, 'LIQUIDADA', {
          tsLiquidacion: payload.tsLiquidacion || new Date().toISOString(),
          folioStp: payload.id,
        });
        actionTaken = `Abono SPEI existente actualizado a LIQUIDADO. Folio: ${payload.id || claveRastreo}`;
      } else {
        // Registrar el nuevo abono acreditado
        updatedTx = this.createTransaction({
          claveRastreo,
          folioStp: payload.id,
          tipo: 'abono',
          monto: Number(payload.monto) || 0,
          cuentaOrdenante: payload.cuentaOrdenante || 'Cuenta Externa',
          nombreOrdenante: payload.nombreOrdenante || 'Ordenante Externo Banxico',
          cuentaBeneficiario: payload.cuentaBeneficiario,
          nombreBeneficiario: payload.nombreBeneficiario || 'Beneficiario GPB',
          concepto: payload.conceptoPago || 'Depósito SPEI Entrante',
          institucionContraparte: instEmisora,
          institucionContraparteNombre: BANXICO_INSTITUCIONES[instEmisora] || `Banco Código ${instEmisora}`,
          estado: 'LIQUIDADA',
          fechaOperacion: String(payload.fechaOperacion || new Date().toISOString().split('T')[0]),
          tsLiquidacion: payload.tsLiquidacion || new Date().toISOString(),
          cepUrl: 'https://www.banxico.org.mx/cep/',
        });
        actionTaken = `Nuevo abono recibido por $${updatedTx.monto.toFixed(2)} acreditado exitosamente a la cuenta ${payload.cuentaBeneficiario}.`;
      }
    } 
    // CASO 2: Actualización de estado de una orden enviada (Dispersión)
    else {
      const existing = this.getTransactionByClaveRastreo(claveRastreo);

      if (rawEstado === 'LIQUIDADA' || rawEstado === 'LIQUIDACION') {
        eventTipo = 'ORDEN_LIQUIDADA';
        if (existing) {
          updatedTx = this.updateTransactionStatus(claveRastreo, 'LIQUIDADA', {
            tsLiquidacion: payload.tsLiquidacion || new Date().toISOString(),
            folioStp: payload.id,
          });
          actionTaken = `Transacción ${claveRastreo} confirmada y LIQUIDADA en Banxico.`;
        } else {
          // Si no estaba en BD, crear el registro como liquidado
          updatedTx = this.createTransaction({
            claveRastreo,
            folioStp: payload.id,
            tipo: 'cargo',
            monto: monto || 0,
            cuentaOrdenante: '646180123456789012',
            nombreOrdenante: 'Gold Payments Bank S.A.',
            cuentaBeneficiario: payload.cuentaBeneficiario || '012180015678901234',
            nombreBeneficiario: payload.nombreBeneficiario || 'Beneficiario',
            concepto: payload.conceptoPago || 'Orden Liquidada en Banxico',
            institucionContraparte: '012',
            estado: 'LIQUIDADA',
            fechaOperacion: String(payload.fechaOperacion || new Date().toISOString().split('T')[0]),
            tsLiquidacion: payload.tsLiquidacion || new Date().toISOString(),
            cepUrl: 'https://www.banxico.org.mx/cep/',
          });
          actionTaken = `Nueva orden SPEI ${claveRastreo} liquidada por Banxico registrada en base de datos.`;
        }
      } else if (rawEstado === 'DEVUELTA' || rawEstado === 'DEVOLUCION') {
        eventTipo = 'ORDEN_DEVUELTA';
        updatedTx = this.updateTransactionStatus(claveRastreo, 'DEVUELTA', {
          causaDevolucion: causaDesc || 'Devolución automática de fondos por Banxico',
          tsLiquidacion: payload.tsLiquidacion || new Date().toISOString(),
          folioStp: payload.id,
        });
        actionTaken = `Transacción ${claveRastreo} DEVUELTA por Banxico. Motivo: ${causaDesc || 'Sin causa informada'}. Fondos restablecidos.`;
      } else if (rawEstado === 'CANCELADA') {
        eventTipo = 'ORDEN_CANCELADA';
        updatedTx = this.updateTransactionStatus(claveRastreo, 'CANCELADA', {
          causaDevolucion: 'Cancelación de orden solicitada antes de liquidación.',
          tsLiquidacion: payload.tsLiquidacion || new Date().toISOString(),
          folioStp: payload.id,
        });
        actionTaken = `Transacción ${claveRastreo} CANCELADA en STP.`;
      } else {
        actionTaken = `Evento recibido para clave ${claveRastreo} con estado ${rawEstado}.`;
      }
    }

    // Registrar en el log de eventos de webhook
    const event = this.addWebhookEvent({
      eventTipo,
      claveRastreo,
      estadoBanxico: rawEstado || 'OK',
      monto: monto || updatedTx?.monto,
      payload,
      procesado: true,
      resultado: actionTaken,
      affectedTxId: updatedTx?.id,
    });

    return {
      success: true,
      actionTaken,
      event,
      transaction: updatedTx,
    };
  }
};
