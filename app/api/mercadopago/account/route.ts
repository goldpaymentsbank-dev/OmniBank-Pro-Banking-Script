import { NextResponse } from 'next/server';

/**
 * Mercado Pago Account Status & Verification Endpoint
 * Checks if MERCADOPAGO_ACCESS_TOKEN is configured and queries
 * https://api.mercadopago.com/users/me to verify real account connectivity.
 */
export async function GET() {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();

  if (!accessToken) {
    return NextResponse.json({
      configured: false,
      status: 'not_configured',
      message: 'MERCADOPAGO_ACCESS_TOKEN no configurado en variables de entorno.',
      account: null,
      environment: 'none',
    });
  }

  const isProduction = accessToken.startsWith('APP_USR-');
  const isSandbox = accessToken.startsWith('TEST-');

  try {
    const userRes = await fetch('https://api.mercadopago.com/users/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'GoldPaymentsBank/1.0 (NextJS-Integration)',
      },
      next: { revalidate: 0 },
    });

    const userData = await userRes.json().catch(() => ({}));

    if (!userRes.ok) {
      console.warn('[MercadoPago Account] Failed to authenticate user:', userData);
      return NextResponse.json({
        configured: true,
        status: 'auth_error',
        httpStatus: userRes.status,
        message: userData.message || `Error HTTP ${userRes.status} al autenticar con Mercado Pago.`,
        cause: userData.cause || null,
        environment: isProduction ? 'production' : isSandbox ? 'sandbox' : 'custom',
        account: null,
      });
    }

    // Attempt to query user balance if available
    let balanceData = null;
    if (userData.id) {
      try {
        const balRes = await fetch(`https://api.mercadopago.com/users/${userData.id}/mercadopago_account/balance`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        if (balRes.ok) {
          balanceData = await balRes.json();
        }
      } catch (err) {
        console.log('[MercadoPago Account] Balance fetch omitted:', err);
      }
    }

    return NextResponse.json({
      configured: true,
      status: 'connected',
      environment: isProduction ? 'production' : isSandbox ? 'sandbox' : 'custom',
      account: {
        id: userData.id,
        nickname: userData.nickname || 'Cuenta Mercado Pago',
        email: userData.email,
        firstName: userData.first_name || '',
        lastName: userData.last_name || '',
        countryId: userData.country_id || 'MX',
        siteId: userData.site_id || 'MLM',
      },
      balance: balanceData,
    });
  } catch (error: any) {
    console.error('[MercadoPago Account] Unhandled exception:', error);
    return NextResponse.json({
      configured: true,
      status: 'connection_error',
      message: error?.message || 'Error de conexión al consultar la API de Mercado Pago.',
      account: null,
      environment: isProduction ? 'production' : isSandbox ? 'sandbox' : 'custom',
    }, { status: 500 });
  }
}
