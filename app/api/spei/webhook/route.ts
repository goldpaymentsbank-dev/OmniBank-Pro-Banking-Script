// app/api/spei/webhook/route.ts
// Gold Payments Bank - Manejador de Webhooks de STP (SPEI) y Actualizador Automático de Estado de Banxico

import { NextRequest, NextResponse } from 'next/server';
import { speiDb } from '@/lib/speiDatabase';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    if (!payload || (typeof payload !== 'object')) {
      return NextResponse.json(
        { estado: 'ERROR', mensaje: 'Carga útil vacía o formato inválido' },
        { status: 400 }
      );
    }

    // Procesar evento en la base de datos de transacciones SPEI
    const result = speiDb.handleStpWebhook(payload);

    console.info(`[SPEI Webhook Procesado]: ${result.actionTaken}`);

    // Respuesta oficial esperada por STP y agregadores SPEI
    return NextResponse.json({
      estado: 'OK',
      idRecibido: payload.id || payload.claveRastreo,
      claveRastreo: result.event.claveRastreo,
      evento: result.event.eventTipo,
      accion: result.actionTaken,
      transaccionId: result.transaction?.id,
      estadoFinalTransaccion: result.transaction?.estado || 'LIQUIDADA',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[SPEI Webhook Error]:', error);
    return NextResponse.json(
      {
        estado: 'ERROR',
        mensaje: error.message || 'Error al procesar el evento del webhook SPEI',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  const events = speiDb.getWebhookEvents();
  const transactions = speiDb.getTransactions();

  return NextResponse.json({
    webhookStatus: 'ACTIVE',
    service: 'Gold Payments Bank - STP / Banxico Event Webhook Handler',
    protocol: 'REST / JSON Webhook (Liquidación & Abonos)',
    totalEventosRecibidos: events.length,
    ultimosEventos: events.slice(0, 10),
    resumenTransacciones: {
      total: transactions.length,
      liquidadas: transactions.filter(t => t.estado === 'LIQUIDADA').length,
      devueltas: transactions.filter(t => t.estado === 'DEVUELTA').length,
      enProceso: transactions.filter(t => t.estado === 'EN_PROCESO' || t.estado === 'REGISTRADA').length,
    },
    timestamp: new Date().toISOString(),
  });
}
