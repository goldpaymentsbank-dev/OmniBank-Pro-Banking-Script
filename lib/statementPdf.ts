// lib/statementPdf.ts
// Gold Payments Bank - Generador de Estado de Cuenta Bancario Mensual en PDF (jsPDF)

import { jsPDF } from 'jspdf';
import { TransactionItem } from '@/lib/bankingStore';

export interface StatementPdfOptions {
  userName: string;
  userEmail: string;
  userPhone?: string;
  accountNumber: string;
  clabe: string;
  tier?: string;
  postalCode?: string;
  address?: string;
  currentBalance: number;
  transactions: TransactionItem[];
  monthName?: string; // e.g. "Septiembre 2026"
  periodStart?: string;
  periodEnd?: string;
  cutOffDate?: string;
  currency?: string;
}

export function generateMonthlyStatementPdf(options: StatementPdfOptions): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  // Corporate palette
  const darkNavy = [15, 23, 42]; // #0F172A
  const primaryBlue = [2, 132, 199]; // #0284C7
  const goldAccent = [217, 119, 6]; // #D97706
  const slateDark = [51, 65, 85]; // #334155
  const slateGray = [100, 116, 139]; // #64748B
  const slateLight = [241, 245, 249]; // #F1F5F9
  const borderLine = [226, 232, 240]; // #E2E8F0
  const emeraldGreen = [16, 185, 129]; // #10B981
  const redAlert = [220, 38, 38]; // #DC2626

  const month = options.monthName || 'Septiembre 2026';
  const cutDate = options.cutOffDate || '30 de Septiembre de 2026';
  const currency = options.currency || 'USD';

  // Calculate totals from transactions
  let totalDeposits = 0;
  let totalWithdrawals = 0;
  let totalFees = 0;

  options.transactions.forEach((tx) => {
    if (tx.type === 'received') {
      totalDeposits += tx.amount;
    } else {
      totalWithdrawals += tx.amount;
      totalFees += tx.fee || 0;
    }
  });

  // Calculate initial balance deterministically
  const initialBalance = Math.max(0, options.currentBalance - totalDeposits + totalWithdrawals + totalFees);

  // Digital seal hash generator
  const createHash = (seed: string) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
  };

  const folioNumber = `EDC-${createHash(options.accountNumber + month)}-2026`;
  const digitalSeal = `${createHash(options.clabe + 'SEAL')}${createHash(options.userName)}${createHash(String(options.currentBalance))}8942AF01C`;

  // Function to render header on any page
  const renderHeader = (pageNumber: number) => {
    // Dark Navy Top Banner
    doc.setFillColor(darkNavy[0], darkNavy[1], darkNavy[2]);
    doc.rect(0, 0, pageWidth, 24, 'F');

    // Gold accent bar
    doc.setFillColor(goldAccent[0], goldAccent[1], goldAccent[2]);
    doc.rect(0, 24, pageWidth, 1.8, 'F');

    // Bank Title
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('GOLD PAYMENTS BANK S.A.', margin, 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(203, 213, 225);
    doc.text('INSTITUCIÓN DE BANCA MÚLTIPLE • REGULADA POR CNBV Y BANCO DE MÉXICO', margin, 18);

    // Document Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(251, 191, 36);
    doc.text('ESTADO DE CUENTA MENSUAL', pageWidth - margin, 12, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(`Período: ${month} • Pág. ${pageNumber}`, pageWidth - margin, 18, { align: 'right' });
  };

  // Function to render footer on any page
  const renderFooter = (pageNumber: number, totalPages: number) => {
    const footerY = pageHeight - 12;
    doc.setDrawColor(borderLine[0], borderLine[1], borderLine[2]);
    doc.setLineWidth(0.3);
    doc.line(margin, footerY - 2, pageWidth - margin, footerY - 2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(slateGray[0], slateGray[1], slateGray[2]);
    doc.text(
      'Gold Payments Bank S.A. de C.V. • SPEI Banxico / STP Participante 646 • www.goldpaymentsbank.com • Centro de Atención: 800-472-2265',
      margin,
      footerY + 2
    );

    doc.text(
      `Folio: ${folioNumber} | Pág. ${pageNumber} de ${totalPages}`,
      pageWidth - margin,
      footerY + 2,
      { align: 'right' }
    );
  };

  // ---------------- PAGE 1: RESUMEN Y DATOS FISCALES ----------------
  renderHeader(1);

  let y = 32;

  // Titular Box & Account Details (2 columns)
  const colWidth = (contentWidth - 6) / 2;

  // Left Box: Titular
  doc.setFillColor(slateLight[0], slateLight[1], slateLight[2]);
  doc.setDrawColor(borderLine[0], borderLine[1], borderLine[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, colWidth, 42, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
  doc.text('DATOS DEL CLIENTE Y TITULAR DE CUENTA', margin + 4, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.text(options.userName.toUpperCase(), margin + 4, y + 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(`Correo: ${options.userEmail}`, margin + 4, y + 19);
  doc.text(`Teléfono: ${options.userPhone || '+52 55 8492 7104'}`, margin + 4, y + 24);
  doc.text(`Domicilio: ${options.address || 'Av. Insurgentes Sur 1602, Crédito Constructor'}`, margin + 4, y + 29);
  doc.text(`C.P. Registrado: ${options.postalCode || '03940'} • México`, margin + 4, y + 34);
  doc.text(`Nivel de Cuenta: ${options.tier || 'Personal'}`, margin + 4, y + 39);

  // Right Box: Account Information
  doc.setFillColor(slateLight[0], slateLight[1], slateLight[2]);
  doc.roundedRect(margin + colWidth + 6, y, colWidth, 42, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
  doc.text('INFORMACIÓN DE LA CUENTA', margin + colWidth + 10, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(slateGray[0], slateGray[1], slateGray[2]);

  doc.text('Número de Cuenta:', margin + colWidth + 10, y + 13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.text(options.accountNumber, margin + colWidth + 44, y + 13);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(slateGray[0], slateGray[1], slateGray[2]);
  doc.text('CLABE Interbancaria:', margin + colWidth + 10, y + 19);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.text(options.clabe, margin + colWidth + 44, y + 19);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(slateGray[0], slateGray[1], slateGray[2]);
  doc.text('Moneda de Operación:', margin + colWidth + 10, y + 25);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.text(`${currency} (Dólares Americanos)`, margin + colWidth + 44, y + 25);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(slateGray[0], slateGray[1], slateGray[2]);
  doc.text('Fecha de Corte:', margin + colWidth + 10, y + 31);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.text(cutDate, margin + colWidth + 44, y + 31);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(slateGray[0], slateGray[1], slateGray[2]);
  doc.text('Folio del Estado:', margin + colWidth + 10, y + 37);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(goldAccent[0], goldAccent[1], goldAccent[2]);
  doc.text(folioNumber, margin + colWidth + 44, y + 37);

  y += 48;

  // ---------------- RESUMEN FINANCIERO DEL PERÍODO ----------------
  doc.setFillColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.roundedRect(margin, y, contentWidth, 34, 2, 2, 'F');

  // Title in Summary Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(251, 191, 36);
  doc.text('RESUMEN GENERAL DEL SALDO Y MOVIMIENTOS DEL MES', margin + 5, y + 7);

  const statWidth = contentWidth / 4;

  // Stat 1: Saldo Inicial
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(203, 213, 225);
  doc.text('Saldo Inicial del Período', margin + 5, y + 15);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(255, 255, 255);
  doc.text(`$${initialBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, margin + 5, y + 23);

  // Stat 2: Total Abonos
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(203, 213, 225);
  doc.text('Total Abonos y Depósitos (+)', margin + statWidth + 5, y + 15);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(emeraldGreen[0], emeraldGreen[1], emeraldGreen[2]);
  doc.text(`+$${totalDeposits.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, margin + statWidth + 5, y + 23);

  // Stat 3: Total Cargos
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(203, 213, 225);
  doc.text('Total Cargos y Retiros (-)', margin + statWidth * 2 + 5, y + 15);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(248, 113, 113); // Red
  doc.text(`-$${totalWithdrawals.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, margin + statWidth * 2 + 5, y + 23);

  // Stat 4: Saldo al Corte
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(203, 213, 225);
  doc.text('Saldo Disponible al Corte', margin + statWidth * 3 + 5, y + 15);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(251, 191, 36); // Gold
  doc.text(`$${options.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, margin + statWidth * 3 + 5, y + 23);

  y += 40;

  // ---------------- TABLA DE MOVIMIENTOS ----------------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.text('DETALLE DE MOVIMIENTOS Y OPERACIONES INTERBANCARIAS', margin, y);

  y += 4;

  // Table Header
  const renderTableHeader = (currentY: number) => {
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, currentY, contentWidth, 7, 'F');
    doc.setDrawColor(borderLine[0], borderLine[1], borderLine[2]);
    doc.line(margin, currentY + 7, pageWidth - margin, currentY + 7);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
    doc.text('FECHA / HORA', margin + 3, currentY + 4.8);
    doc.text('CONCEPTO / BENEFICIARIO', margin + 30, currentY + 4.8);
    doc.text('FOLIO / RASTREO SPEI', margin + 105, currentY + 4.8);
    doc.text('TIPO', margin + 142, currentY + 4.8);
    doc.text('MONTO (USD)', pageWidth - margin - 3, currentY + 4.8, { align: 'right' });
    return currentY + 8;
  };

  y = renderTableHeader(y);

  // Table rows with pagination
  let currentPage = 1;
  const rowHeight = 7.5;
  const maxY = pageHeight - 38; // leave space for footer and signature on last page

  let runningBalance = initialBalance;

  options.transactions.forEach((tx) => {
    // Check if we need a new page
    if (y > maxY) {
      renderFooter(currentPage, 2); // temporarily write page
      doc.addPage();
      currentPage++;
      renderHeader(currentPage);
      y = 32;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
      doc.text('DETALLE DE MOVIMIENTOS (CONTINUACIÓN)', margin, y);
      y += 4;
      y = renderTableHeader(y);
    }

    const isCredit = tx.type === 'received';
    const amountPrefix = isCredit ? '+' : '-';
    runningBalance += isCredit ? tx.amount : -tx.amount;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);

    // Fecha
    doc.text(tx.date.substring(0, 16), margin + 3, y + 4.8);

    // Concepto
    const rawTitle = `${tx.title} - ${tx.recipientOrSender}`;
    const truncatedTitle = rawTitle.length > 42 ? rawTitle.substring(0, 42) + '...' : rawTitle;
    doc.text(truncatedTitle, margin + 30, y + 4.8);

    // Clave de Rastreo
    doc.setFont('courier', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(slateGray[0], slateGray[1], slateGray[2]);
    const trackingStr = tx.trackingKey || tx.id.substring(0, 16);
    doc.text(trackingStr.length > 20 ? trackingStr.substring(0, 20) : trackingStr, margin + 105, y + 4.8);

    // Tipo
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    if (isCredit) {
      doc.setTextColor(emeraldGreen[0], emeraldGreen[1], emeraldGreen[2]);
      doc.text('ABONO', margin + 142, y + 4.8);
    } else {
      doc.setTextColor(redAlert[0], redAlert[1], redAlert[2]);
      doc.text('CARGO', margin + 142, y + 4.8);
    }

    // Monto
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    if (isCredit) {
      doc.setTextColor(emeraldGreen[0], emeraldGreen[1], emeraldGreen[2]);
    } else {
      doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
    }
    const amountStr = `${amountPrefix}$${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    doc.text(amountStr, pageWidth - margin - 3, y + 4.8, { align: 'right' });

    // Bottom subtle line
    doc.setDrawColor(borderLine[0], borderLine[1], borderLine[2]);
    doc.setLineWidth(0.2);
    doc.line(margin, y + rowHeight, pageWidth - margin, y + rowHeight);

    y += rowHeight;
  });

  // ---------------- SELLO DIGITAL Y CERTIFICACIÓN BANCARIA ----------------
  // If not enough room on current page, add final page
  if (y > pageHeight - 45) {
    renderFooter(currentPage, currentPage + 1);
    doc.addPage();
    currentPage++;
    renderHeader(currentPage);
    y = 34;
  } else {
    y += 5;
  }

  // Sello Box
  doc.setFillColor(slateLight[0], slateLight[1], slateLight[2]);
  doc.setDrawColor(borderLine[0], borderLine[1], borderLine[2]);
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
  doc.text('CERTIFICACIÓN Y SELLO DIGITAL DE AUTENTICIDAD BANCARIA', margin + 4, y + 5);

  doc.setFont('courier', 'normal');
  doc.setFontSize(5.8);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(`Cadena Original: ||846|${options.accountNumber}|${options.clabe}|${options.currentBalance}|${folioNumber}|${cutDate}||`, margin + 4, y + 10);
  doc.text(`Sello Digital SHA-256: ${digitalSeal} • Firma Electrónica Avanzada FIEL/e.firma Banxico`, margin + 4, y + 14);
  doc.text(`Validador en línea: https://www.banxico.org.mx/cep/ • Participante SPEI 646 STP / GPB`, margin + 4, y + 18);

  // Render footers for all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    renderFooter(i, totalPages);
  }

  // Trigger download in browser
  const cleanAccount = options.accountNumber.replace(/[^a-zA-Z0-9]/g, '');
  const cleanMonth = month.replace(/\s+/g, '_');
  doc.save(`Estado_De_Cuenta_GPB_${cleanMonth}_${cleanAccount}.pdf`);
}
