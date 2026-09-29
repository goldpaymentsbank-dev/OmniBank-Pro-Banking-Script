import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Gold Payments Bank | Plataforma Bancaria en Modo Producción',
  description: 'Plataforma bancaria en línea moderna en Modo Producción con gestión fiat y cripto, transferencias SPEI Banxico (CLABE), directorio SWIFT/BIC ISO 9362 con cotizador Wise garantizado 96h, autenticación biométrica FIDO2 (FaceID/Huella), integración de Mercado Pago producción y comprobantes PDF descargables.',
  openGraph: {
    title: 'Gold Payments Bank | Plataforma Bancaria en Modo Producción',
    description: 'Plataforma bancaria en línea moderna en Modo Producción con gestión fiat y cripto, transferencias SPEI Banxico (CLABE), directorio SWIFT/BIC ISO 9362 con cotizador Wise garantizado 96h, autenticación biométrica FIDO2 (FaceID/Huella), integración de Mercado Pago producción y comprobantes PDF descargables.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
