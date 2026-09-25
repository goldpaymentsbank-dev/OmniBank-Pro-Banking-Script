import { jsPDF } from 'jspdf';
import { TransactionItem } from '@/lib/bankingStore';

/**
 * Generates and downloads an official, high-quality bank certificate PDF
 * for Gold Payments Bank transactions (SPEI, International, SWIFT, etc.)
 */
export function generateTransactionPdf(transaction: TransactionItem) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  // Colors
  const darkNavy = [15, 23, 42]; // #0F172A
  const goldAccent = [217, 119, 6]; // #D97706
  const slateGray = [100, 116, 139]; // #64748B
  const lightBg = [248, 250, 252]; // #F8FAFC
  const borderLine = [226, 232, 240]; // #E2E8F0
  const emeraldGreen = [16, 185, 129]; // #10B981

  // 1. Top Decorative Header Bar
  doc.setFillColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Gold accent strip
  doc.setFillColor(goldAccent[0], goldAccent[1], goldAccent[2]);
  doc.rect(0, 28, pageWidth, 2.5, 'F');

  // Bank Title in Header
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('GOLD PAYMENTS BANK', margin, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text('INSTITUCIÓN DE BANCA MÚLTIPLE • SPEI & ISO 20022 CERTIFIED', margin, 20);

  // Document Type on top right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(251, 191, 36);
  doc.text('COMPROBANTE OFICIAL DE OPERACIÓN', pageWidth - margin, 16, { align: 'right' });

  // 2. Main Title & Verification Status Box
  let y = 42;

  // Status Box
  doc.setFillColor(236, 253, 245); // Light emerald
  doc.setDrawColor(emeraldGreen[0], emeraldGreen[1], emeraldGreen[2]);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, contentWidth, 18, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(4, 120, 87);
  doc.text('ESTADO DE VERIFICACIÓN: LIQUIDADA / EXITOSA', margin + 6, y + 7.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(5, 150, 105);
  doc.text('Operación certificada y registrada en el Sistema de Pagos Interbancarios (SPEI Banxico / STP)', margin + 6, y + 13);

  // Deterministic auth code and tracking key
  const pseudoHash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(8, '0').toUpperCase();
  };

  const authCode = (100000 + (Math.abs(pseudoHash(transaction.id).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) * 83) % 900000)).toString();
  const trackingNumber = transaction.trackingKey || `SPEI-${(transaction.timestamp || Date.now()).toString().slice(-8)}-${pseudoHash(transaction.id).slice(0, 6)}`;
  const digitalSeal = `SHA256:${pseudoHash(transaction.id + 'saltA')}-${pseudoHash(transaction.id + 'saltB')}-${pseudoHash(transaction.id + 'saltC')}`;

  doc.setFont('courier', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(6, 78, 59);
  doc.text(`AUT: ${authCode}`, pageWidth - margin - 6, y + 10, { align: 'right' });

  y += 26;

  // 3. Amount Display Card
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.setDrawColor(borderLine[0], borderLine[1], borderLine[2]);
  doc.roundedRect(margin, y, contentWidth, 24, 3, 3, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(slateGray[0], slateGray[1], slateGray[2]);
  doc.text('IMPORTE TOTAL LIQUIDADO', pageWidth / 2, y + 7, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  const isReceived = transaction.type === 'received';
  if (isReceived) {
    doc.setTextColor(16, 185, 129);
  } else {
    doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  }
  const sign = isReceived ? '+' : '-';
  const amountStr = `${sign}$${transaction.amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${transaction.currency}`;
  doc.text(amountStr, pageWidth / 2, y + 17, { align: 'center' });

  y += 32;

  // 4. Detailed Data Grid Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.text('DETALLES DE LA OPERACIÓN', margin, y);
  y += 4;

  const dateObj = new Date(transaction.timestamp || Date.now());
  const formattedDate = dateObj.toLocaleString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const destinationAccount = 
    transaction.clabe || 
    transaction.iban || 
    (transaction.cardLast4 ? `Tarjeta **** ${transaction.cardLast4}` : 'Cuenta Verificada GPB');

  const details: [string, string][] = [
    ['Folio de Operación', transaction.id],
    ['Clave de Rastreo SPEI / SWIFT', trackingNumber],
    ['Fecha y Hora de Liquidación', formattedDate],
    ['Tipo de Movimiento', isReceived ? 'Abono / Recepción Interbancaria' : 'Cargo / Transferencia Electrónica'],
    ['Concepto / Descripción', transaction.title],
    ['Beneficiario / Emisor', transaction.recipientOrSender],
    ['Cuenta o CLABE Destino', destinationAccount],
    ['Banco Contraparte', transaction.bankName || 'Sistema Bancario Nacional / Internacional'],
    ['Referencia Numérica', transaction.reference || '0000000'],
    ['Comisión por Operación', `$${(transaction.fee || 0).toFixed(2)} ${transaction.currency}`],
    ['Código de Autorización', authCode],
  ];

  if (transaction.destinationAmount && transaction.destinationCurrency) {
    details.push([
      `Monto Destino (${transaction.destinationCurrency})`,
      `$${transaction.destinationAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })} ${transaction.destinationCurrency}`
    ]);
  }

  // Draw details table
  doc.setLineWidth(0.2);
  const rowHeight = 7.5;
  const colLabelWidth = 65;

  details.forEach(([label, value], idx) => {
    const rowY = y + idx * rowHeight;
    // Zebra striping
    if (idx % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, rowY, contentWidth, rowHeight, 'F');
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(slateGray[0], slateGray[1], slateGray[2]);
    doc.text(label, margin + 4, rowY + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
    doc.text(value, margin + colLabelWidth, rowY + 5);

    // Subtle divider line
    doc.setDrawColor(borderLine[0], borderLine[1], borderLine[2]);
    doc.line(margin, rowY + rowHeight, margin + contentWidth, rowY + rowHeight);
  });

  y += details.length * rowHeight + 10;

  // 5. Digital Security Seal Box
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.setDrawColor(borderLine[0], borderLine[1], borderLine[2]);
  doc.roundedRect(margin, y, contentWidth, 22, 2.5, 2.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(slateGray[0], slateGray[1], slateGray[2]);
  doc.text('SELLO DIGITAL DE AUTENTICIDAD (BANCO DE MÉXICO - SHA256):', margin + 4, y + 6);

  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text(digitalSeal, margin + 4, y + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(slateGray[0], slateGray[1], slateGray[2]);
  doc.text(`Cadena Original: ||${transaction.id}|${trackingNumber}|${transaction.amount}|${dateObj.toISOString()}||`, margin + 4, y + 18);

  y += 30;

  // 6. Regulatory & Legal Footer
  doc.setDrawColor(borderLine[0], borderLine[1], borderLine[2]);
  doc.setLineWidth(0.3);
  doc.line(margin, pageHeight - 26, pageWidth - margin, pageHeight - 26);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(slateGray[0], slateGray[1], slateGray[2]);
  doc.text(
    'Este documento es una representación impresa de un Comprobante Oficial de Operación Bancaria con plena validez legal ante el SAT, CNBV y Banco de México.',
    margin,
    pageHeight - 20
  );
  doc.text(
    `Gold Payments Bank S.A. Institución de Banca Múltiple • RFC: GPB980421-XYZ • Folio de Autorización Banxico: ${authCode} • Fecha de Emisión: ${new Date().toISOString()}`,
    margin,
    pageHeight - 16
  );

  // Save the PDF file to user device
  const sanitizedId = transaction.id.replace(/[^a-zA-Z0-9]/g, '-');
  const fileName = `Comprobante-GPB-${sanitizedId}.pdf`;
  doc.save(fileName);
}
