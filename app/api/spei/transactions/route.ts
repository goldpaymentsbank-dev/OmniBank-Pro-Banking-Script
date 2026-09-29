// app/api/spei/transactions/route.ts
// Gold Payments Bank - Consulta y Registro de Transacciones SPEI en Base de Datos

import { NextRequest, NextResponse } from 'next/server';
import { speiDb } from '@/lib/speiDatabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const claveRastreo = searchParams.get('claveRastreo');

  if (claveRastreo) {
    const tx = speiDb.getTransactionByClaveRastreo(claveRastreo);
    if (!tx) {
      return NextResponse.json({ error: 'Transacción no encontrada' }, { status: 404 });
    }
    return NextResponse.json({ transaction: tx });
  }

  const transactions = speiDb.getTransactions();
  const webhookEvents = speiDb.getWebhookEvents();

  return NextResponse.json({
    total: transactions.length,
    transactions,
    recentWebhookEvents: webhookEvents.slice(0, 10),
    timestamp: new Date().toISOString(),
  });
}
