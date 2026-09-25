import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Mercado Pago Webhook Notification Receiver
 * Official Documentation Reference:
 * https://www.mercadopago.com.mx/developers/es/docs/your-integrations/notifications/webhooks
 */

// Simple in-memory idempotency cache for duplicate notification handling
// In production, use Redis or database table with unique constraint on (event_id, action)
const processedEvents = new Map<string, { timestamp: number; status: string }>();

// Clean up events older than 24 hours to prevent memory leaks
setInterval(() => {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  for (const [key, value] of processedEvents.entries()) {
    if (value.timestamp < cutoff) {
      processedEvents.delete(key);
    }
  }
}, 60 * 60 * 1000);

interface WebhookPayload {
  id?: number | string;
  live_mode?: boolean;
  type?: string;
  date_created?: string;
  application_id?: number | string;
  user_id?: number | string;
  version?: number;
  api_version?: string;
  action?: string;
  data?: {
    id?: string;
  };
}

/**
 * Validates the HMAC-SHA256 signature provided in the `x-signature` header.
 * Official template: "id:[data.id_or_url_id];request-id:[x-request-id];ts:[ts];"
 */
function verifyMercadoPagoSignature(
  xSignature: string | null,
  xRequestId: string | null,
  dataId: string,
  secretKey: string
): { isValid: boolean; reason?: string } {
  if (!xSignature || !xRequestId) {
    return { isValid: false, reason: 'Missing x-signature or x-request-id header' };
  }

  // Parse ts and v1 from format: ts=1704067200,v1=5d41402abc4b2a76b9719d911017c592...
  const parts = xSignature.split(',');
  let ts = '';
  let v1Hash = '';

  for (const part of parts) {
    const [key, value] = part.trim().split('=');
    if (key === 'ts') ts = value;
    if (key === 'v1') v1Hash = value;
  }

  if (!ts || !v1Hash) {
    return { isValid: false, reason: 'Malformed x-signature header structure' };
  }

  // Check timestamp drift to prevent replay attacks (allow up to 5 minutes tolerance)
  const currentUnixSec = Math.floor(Date.now() / 1000);
  const eventUnixSec = parseInt(ts, 10);
  if (isNaN(eventUnixSec) || Math.abs(currentUnixSec - eventUnixSec) > 300) {
    return { isValid: false, reason: `Timestamp tolerance exceeded (drift: ${currentUnixSec - eventUnixSec}s)` };
  }

  // Build manifest according to official Mercado Pago docs:
  // "id:[data.id];request-id:[x-request-id];ts:[ts];"
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

  const calculatedHash = crypto
    .createHmac('sha256', secretKey)
    .update(manifest)
    .digest('hex');

  const calculatedBuffer = Buffer.from(calculatedHash, 'utf-8');
  const receivedBuffer = Buffer.from(v1Hash, 'utf-8');

  if (calculatedBuffer.length !== receivedBuffer.length) {
    return { isValid: false, reason: 'Signature buffer length mismatch' };
  }

  const isMatch = crypto.timingSafeEqual(calculatedBuffer, receivedBuffer);
  return { isValid: isMatch, reason: isMatch ? undefined : 'HMAC-SHA256 signature verification failed' };
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const searchParams = req.nextUrl.searchParams;

  try {
    // 1. Read headers
    const xSignature = req.headers.get('x-signature');
    const xRequestId = req.headers.get('x-request-id');

    // 2. Parse payload body safely
    let body: WebhookPayload = {};
    try {
      body = await req.json();
    } catch {
      // Mercado Pago query notifications may have empty or non-JSON bodies
      body = {};
    }

    // Explicitly log the full payload for processing validation
    console.log('[MercadoPago Webhook] Received POST Request:');
    console.log('[MercadoPago Webhook] Headers:', {
      'x-signature': xSignature,
      'x-request-id': xRequestId,
      'content-type': req.headers.get('content-type'),
    });
    console.log('[MercadoPago Webhook] Payload for Processing Validation:\n', JSON.stringify(body, null, 2));

    // 3. Extract target resource ID and topic
    // Resource ID can arrive in body.data.id or via query string ?data.id=... or ?id=...
    const dataId = 
      body.data?.id || 
      searchParams.get('data.id') || 
      searchParams.get('id') || 
      (body.id ? String(body.id) : '');

    const topic = 
      body.type || 
      searchParams.get('type') || 
      searchParams.get('topic') || 
      'payment';

    const action = body.action || (topic === 'payment' ? 'payment.updated' : topic);
    const eventId = String(body.id || `${topic}-${dataId}`);

    console.log(`[MercadoPago Webhook] Extracted Event Metadata:`, {
      eventId,
      dataId,
      action,
      topic,
      liveMode: body.live_mode ?? false,
      requestId: xRequestId,
    });

    // 4. Verify Signature using MERCADOPAGO_WEBHOOK_SECRET
    const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    if (webhookSecret) {
      const verification = verifyMercadoPagoSignature(xSignature, xRequestId, dataId, webhookSecret);
      if (!verification.isValid) {
        console.warn(`[MercadoPago Webhook] Signature verification FAILED:`, verification.reason);
        return NextResponse.json(
          { error: 'Unauthorized', message: verification.reason },
          { status: 401 }
        );
      }
      console.log('[MercadoPago Webhook] Signature verified successfully with MERCADOPAGO_WEBHOOK_SECRET.');
    } else {
      console.warn('[MercadoPago Webhook] WARNING: MERCADOPAGO_WEBHOOK_SECRET environment variable is not defined. Skipping cryptographic signature validation in development.');
    }

    // 5. Idempotency Check
    const idempotencyKey = `${eventId}:${action}`;
    if (processedEvents.has(idempotencyKey)) {
      console.log(`[MercadoPago Webhook] Event ${idempotencyKey} already processed. Returning HTTP 200.`);
      return NextResponse.json({ status: 'ignored_duplicate', eventId }, { status: 200 });
    }

    // 6. Process Payment Event asynchronously / accurately
    if (topic === 'payment' && dataId) {
      const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

      if (accessToken) {
        try {
          // Official Mercado Pago API endpoint to fetch verified payment state
          // Never fulfill orders based solely on webhook payload
          const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            cache: 'no-store',
          });

          if (mpResponse.ok) {
            const paymentDetails = await mpResponse.json();
            console.log(`[MercadoPago Webhook] Verified Payment ${dataId} Status: ${paymentDetails.status} (${paymentDetails.status_detail})`, {
              amount: paymentDetails.transaction_amount,
              currency: paymentDetails.currency_id,
              payerEmail: paymentDetails.payer?.email,
              externalReference: paymentDetails.external_reference,
            });

            // Mark as processed in idempotency cache
            processedEvents.set(idempotencyKey, {
              timestamp: Date.now(),
              status: paymentDetails.status,
            });
          } else {
            console.error(`[MercadoPago Webhook] Failed to fetch payment ${dataId}: HTTP ${mpResponse.status}`);
          }
        } catch (fetchErr) {
          console.error(`[MercadoPago Webhook] Error querying Mercado Pago API for payment ${dataId}:`, fetchErr);
        }
      } else {
        console.log(`[MercadoPago Webhook] MERCADOPAGO_ACCESS_TOKEN not set. Acknowledged event ${dataId} without remote fetch.`);
        processedEvents.set(idempotencyKey, {
          timestamp: Date.now(),
          status: 'acknowledged_without_fetch',
        });
      }
    }

    const elapsed = Date.now() - startTime;
    console.log(`[MercadoPago Webhook] Processed in ${elapsed}ms. Returning 200 OK.`);

    // 7. MUST return HTTP 200 / 201 immediately to prevent retries
    return NextResponse.json(
      { 
        status: 'received', 
        timestamp: new Date().toISOString(),
        processingTimeMs: elapsed 
      }, 
      { status: 200 }
    );

  } catch (error) {
    console.error('[MercadoPago Webhook] Unhandled exception:', error);
    // Return 500 only if you want Mercado Pago to retry the delivery
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * Handle GET requests (healthcheck or query string notifications in older setups)
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const topic = searchParams.get('topic') || searchParams.get('type');
  const dataId = searchParams.get('data.id') || searchParams.get('id');

  if (topic && dataId) {
    console.log(`[MercadoPago Webhook] Received GET IPN notification for topic: ${topic}, id: ${dataId}`);
    return NextResponse.json({ status: 'received_ipn', topic, id: dataId }, { status: 200 });
  }

  return NextResponse.json(
    { 
      status: 'active',
      service: 'Mercado Pago Webhook Receiver',
      supportedTopics: ['payment', 'merchant_order'],
      guide: 'Send POST requests with x-signature and x-request-id headers.'
    },
    { status: 200 }
  );
}
