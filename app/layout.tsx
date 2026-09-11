import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Gold Payments Bank',
  description: 'Modern online banking platform featuring fiat and crypto management, Mexican CLABE SPEI transfers, merchant MIDs in production mode, Luhn verified cards, and detailed printable transaction receipts.',
  openGraph: {
    title: 'Gold Payments Bank',
    description: 'Modern online banking platform featuring fiat and crypto management, Mexican CLABE SPEI transfers, merchant MIDs in production mode, Luhn verified cards, and detailed printable transaction receipts.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
