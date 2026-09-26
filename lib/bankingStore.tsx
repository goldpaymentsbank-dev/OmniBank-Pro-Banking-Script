'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  generateValidLuhnCard, 
  generateValidClabe, 
  generateSpeiTrackingKey,
  generateProductionMid,
  generateProductionApiKeys,
  generateBlockchainTxHash,
  CryptoAsset,
  EUROPEAN_PAYMENT_BENEFICIARY,
  MORSE_DEFAULT_BENEFICIARY,
  MorseBeneficiaryData,
  generateAchTraceNumber,
  PLUS500_BENEFICIARY
} from './bankingValidation';

export interface CryptoTransferDetails {
  asset: CryptoAsset;
  amount: number;
  toAddress: string;
  network: string;
  walletName?: string;
  networkFee: number;
  memo?: string;
}

export interface ScheduledPaymentItem {
  id: string;
  title: string;
  recipientName: string;
  iban: string;
  bic: string;
  bankName: string;
  bankAddress: string;
  amountEur: number;
  amountUsdEquivalent: number;
  currency: 'EUR';
  frequency: 'weekly' | 'monthly' | 'biweekly';
  frequencyLabel: string;
  dayOfWeek: string;
  nextExecutionDate: string;
  status: 'active' | 'paused' | 'cancelled';
  network: 'SEPA_INSTANT' | 'SEPA_CREDIT' | 'SWIFT';
  reference: string;
  createdAt: string;
  totalExecutions: number;
  totalAmountEurPaid: number;
  lastExecutionDate?: string;
  mandateReference: string;
  category: 'sepa' | 'international';
}

export interface CardItem {
  id: string;
  number: string;
  formatted: string;
  exp: string;
  cvv: string;
  brand: 'VISA' | 'MASTERCARD';
  holderName: string;
  isFrozen: boolean;
  onlineEnabled: boolean;
  atmEnabled: boolean;
  pin: string;
  limit: number;
}

export interface MidItem {
  id: string;
  midNumber: string;
  businessName: string;
  legalName: string;
  rfc: string;
  mcc: string;
  mccCategory: string;
  channel: 'e_commerce' | 'pos_terminal' | 'payment_link' | 'recurrent';
  environment: 'production' | 'sandbox';
  status: 'active' | 'pending_verification' | 'paused';
  currency: 'MXN' | 'USD' | 'MULTI';
  settlementClabe: string;
  settlementCycle: 'T+0' | 'T+1' | 'T+2';
  discountRatePct: number;
  fixedFee: number;
  monthlyVolumeLimit: number;
  currentVolume: number;
  transactionsCount: number;
  livePublicKey: string;
  liveSecretKey: string;
  webhookUrl?: string;
  terminalId?: string;
  pciComplianceDate: string;
  createdAt: string;
}

export interface TransactionItem {
  id: string;
  type: 'received' | 'sent';
  category: 'spei' | 'internal' | 'gofundme' | 'card' | 'crypto' | 'deposit' | 'loan' | 'international' | 'morse' | 'ach';
  title: string;
  recipientOrSender: string;
  date: string;
  timestamp: number;
  amount: number;
  fee: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed';
  trackingKey?: string;
  clabe?: string;
  cardLast4?: string;
  reference?: string;
  iban?: string;
  bic?: string;
  bankName?: string;
  destinationCurrency?: string;
  destinationAmount?: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'success' | 'alert' | 'info';
}

export interface LoanItem {
  id: string;
  amount: number;
  durationMonths: number;
  apr: number;
  monthlyPayment: number;
  purpose: string;
  status: 'approved' | 'in_review' | 'rejected';
  appliedDate: string;
}

export interface UserAccountItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  accountNumber: string;
  clabe: string;
  balance: number;
  status: 'active' | 'blocked' | 'in_verification';
  role: 'user' | 'admin';
  tier: 'Personal' | 'Premier' | 'Empresarial';
  createdAt: string;
  totalTransfers: number;
}

export interface TransferSecurityConfig {
  requireCot: boolean;
  requireImf: boolean;
  requireSwift: boolean;
  cotCode: string;
  imfCode: string;
  swiftCode: string;
  requireAdminApproval: boolean;
  minAmountForApproval: number;
}

export interface EmailNotificationLog {
  id: string;
  to: string;
  recipientName: string;
  subject: string;
  preview: string;
  bodyHtml: string;
  sentAt: string;
  type: 'deposit' | 'debit' | 'transfer_sent' | 'transfer_received' | 'transfer_pending' | 'transfer_approved' | 'transfer_rejected' | 'account_blocked' | 'account_unblocked' | 'security';
  amount?: number;
  trackingKey?: string;
  reference?: string;
  status: 'delivered' | 'sent';
}

interface BankingContextType {
  balance: number;
  userClabe: string;
  userAccount: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  isAccountBlocked: boolean;
  users: UserAccountItem[];
  activeUserId: string;
  securityConfig: TransferSecurityConfig;
  emailLogs: EmailNotificationLog[];
  adminCreditAccount: (userId: string, amount: number, concept: string) => { success: boolean; tx?: TransactionItem; error?: string };
  adminDebitAccount: (userId: string, amount: number, concept: string) => { success: boolean; tx?: TransactionItem; error?: string };
  adminToggleAccountBlock: (userId: string) => { success: boolean; newStatus: 'active' | 'blocked' };
  adminApproveTransfer: (txId: string) => { success: boolean; tx?: TransactionItem; error?: string };
  adminRejectTransfer: (txId: string, reason: string) => { success: boolean; tx?: TransactionItem; error?: string };
  updateSecurityConfig: (config: Partial<TransferSecurityConfig>) => void;
  registerNewUser: (data: { name: string; email: string; phone?: string; initialDeposit?: number; tier?: 'Personal' | 'Premier' | 'Empresarial' }) => UserAccountItem;
  switchUser: (userId: string) => void;
  triggerManualEmailNotification: (log: Omit<EmailNotificationLog, 'id' | 'sentAt' | 'status'>) => void;
  cryptoBtc: number;
  cryptoEth: number;
  cryptoUsdt: number;
  cryptoSol: number;
  btcPrice: number;
  cryptoPrices: Record<CryptoAsset, number>;
  cards: CardItem[];
  transactions: TransactionItem[];
  notifications: NotificationItem[];
  loans: LoanItem[];
  mids: MidItem[];
  morseBeneficiary: MorseBeneficiaryData;
  activeOtp: string;
  generateNewOtp: () => string;
  verifyOtp: (input: string) => boolean;
  sendTransfer: (details: {
    type: 'internal' | 'spei' | 'gofundme' | 'international' | 'card' | 'morse' | 'ach';
    recipient: string;
    amount: number;
    fee: number;
    title: string;
    clabe?: string;
    cardLast4?: string;
  }) => { success: boolean; trackingKey: string; error?: string };
  sendCryptoTransfer: (details: CryptoTransferDetails) => { success: boolean; txHash: string; trackingKey: string; error?: string };
  depositFunds: (amount: number, method: string) => void;
  tradeCrypto: (type: 'buy' | 'sell', usdAmount: number) => { success: boolean; error?: string };
  addCard: (brand: 'VISA' | 'MASTERCARD', limit?: number) => CardItem;
  toggleCardFreeze: (cardId: string) => void;
  toggleCardOnline: (cardId: string) => void;
  toggleCardAtm: (cardId: string) => void;
  updateCardPin: (cardId: string, newPin: string) => void;
  applyForLoan: (amount: number, durationMonths: number, purpose: string) => LoanItem;
  registerMid: (data: {
    businessName: string;
    legalName: string;
    rfc: string;
    mcc: string;
    mccCategory: string;
    channel: 'e_commerce' | 'pos_terminal' | 'payment_link' | 'recurrent';
    currency: 'MXN' | 'USD' | 'MULTI';
    settlementClabe: string;
    settlementCycle: 'T+0' | 'T+1' | 'T+2';
    discountRatePct: number;
    fixedFee: number;
    monthlyVolumeLimit: number;
    webhookUrl?: string;
    terminalId?: string;
  }) => MidItem;
  toggleMidStatus: (midId: string) => void;
  simulateMidCharge: (midId: string, amount: number, concept: string) => { success: boolean; txId: string; netAmount: number };
  markNotificationsAsRead: () => void;
  regenerateClabe: () => string;
  scheduledPayments: ScheduledPaymentItem[];
  eurToUsdRate: number;
  executeScheduledPayment: (id: string) => { success: boolean; trackingKey: string; error?: string };
  toggleScheduledPaymentStatus: (id: string) => void;
  addScheduledPayment: (item: Omit<ScheduledPaymentItem, 'id' | 'createdAt' | 'totalExecutions' | 'totalAmountEurPaid'>) => ScheduledPaymentItem;
  updateMorseBeneficiary: (data: Partial<MorseBeneficiaryData>) => void;
  usdToMxnRate: number;
  executePlus500Payment: (params: {
    amountMxn?: number;
    amountUsd?: number;
  }) => {
    success: boolean;
    trackingKey: string;
    tx?: TransactionItem;
    error?: string;
  };
  executeMercadoPagoWithdrawal: (params: {
    amountMxn?: number;
    amountUsd?: number;
    clabe?: string;
    recipientName?: string;
    concept?: string;
    rfc?: string;
  }) => Promise<{
    success: boolean;
    trackingKey: string;
    mpPaymentId?: string;
    tx?: TransactionItem;
    error?: string;
    mode?: string;
  }>;
  sendMorseAchTransfer: (params: {
    amountUsd: number;
    memo?: string;
    destinationRegion: 'europe' | 'international';
  }) => {
    success: boolean;
    trackingKey: string;
    error?: string;
    creditedAmount: number;
    creditedCurrency: string;
  };
}

const BankingContext = createContext<BankingContextType | undefined>(undefined);

// Deterministic 100% valid Banxico SPEI CLABE (Bank 846, Plaza 180, Acc 49201928401 -> Checksum 7)
const INITIAL_CLABE = '846180492019284017';

// Initial Certified Recurring Payment (Standing Order SEPA) for Oscar Isael Bueno Tochihuitl
export const INITIAL_SCHEDULED_PAYMENTS: ScheduledPaymentItem[] = [
  {
    id: 'sched-sepa-01',
    title: 'Pago Semanal Europa (SEPA) - 2,500.00 EUR',
    recipientName: EUROPEAN_PAYMENT_BENEFICIARY.holderName,
    iban: EUROPEAN_PAYMENT_BENEFICIARY.iban,
    bic: EUROPEAN_PAYMENT_BENEFICIARY.bic,
    bankName: EUROPEAN_PAYMENT_BENEFICIARY.bankName,
    bankAddress: EUROPEAN_PAYMENT_BENEFICIARY.bankAddress,
    amountEur: 2500.00,
    amountUsdEquivalent: 2712.50, // 2,500 EUR * 1.085
    currency: 'EUR',
    frequency: 'weekly',
    frequencyLabel: 'Semanal (Cada Viernes)',
    dayOfWeek: 'Viernes',
    nextExecutionDate: 'Viernes, 18 de Septiembre 2026 (10:00 AM CET)',
    status: 'active',
    network: 'SEPA_INSTANT',
    reference: EUROPEAN_PAYMENT_BENEFICIARY.reference,
    createdAt: '11 Sep, 2026',
    totalExecutions: 1,
    totalAmountEurPaid: 2500.00,
    lastExecutionDate: 'Hoy, 10:30 AM (Liquidado SEPA)',
    mandateReference: EUROPEAN_PAYMENT_BENEFICIARY.mandateReference,
    category: 'sepa',
  }
];

// Initial Certified Production MIDs (Adquirencia & Procesamiento en Modo Producción)
const INITIAL_MIDS: MidItem[] = [
  {
    id: 'mid-prod-01',
    midNumber: '8467109',
    businessName: 'Koywe Payments LatAm',
    legalName: 'KOYWE S DE RL DE CV',
    rfc: 'KOY210904NV0',
    mcc: '7372',
    mccCategory: 'Software, SaaS y Servicios Cloud',
    channel: 'e_commerce',
    environment: 'production',
    status: 'active',
    currency: 'MXN',
    settlementClabe: '710969000021584949',
    settlementCycle: 'T+1',
    discountRatePct: 1.85,
    fixedFee: 2.50,
    monthlyVolumeLimit: 2500000,
    currentVolume: 342150.00,
    transactionsCount: 284,
    livePublicKey: 'pk_live_gp_koywe_98f4a1',
    liveSecretKey: 'sk_live_gp_koywe_842a9b31d4e7f910',
    webhookUrl: 'https://api.koywe.com/v1/webhooks/gp_live',
    terminalId: 'TID-KYW-01',
    pciComplianceDate: '2026-08-15',
    createdAt: '10 Jul, 2026',
  },
  {
    id: 'mid-prod-02',
    midNumber: '8461942',
    businessName: 'Gold Retail México',
    legalName: 'COMERCIALIZADORA GOLD MX SA DE CV',
    rfc: 'CGM190822KL9',
    mcc: '5732',
    mccCategory: 'Equipos Electrónicos y Computación',
    channel: 'pos_terminal',
    environment: 'production',
    status: 'active',
    currency: 'MXN',
    settlementClabe: INITIAL_CLABE,
    settlementCycle: 'T+0',
    discountRatePct: 1.95,
    fixedFee: 2.00,
    monthlyVolumeLimit: 1200000,
    currentVolume: 128450.00,
    transactionsCount: 142,
    livePublicKey: 'pk_live_gp_goldmx_41b892',
    liveSecretKey: 'sk_live_gp_goldmx_99e120f3a882bb01',
    webhookUrl: 'https://store.goldpayments.mx/api/checkout',
    terminalId: 'TPV-MX-084',
    pciComplianceDate: '2026-08-20',
    createdAt: '01 Ago, 2026',
  },
];

// Deterministic 100% ISO/IEC 7812 Luhn compliant cards
const INITIAL_CARDS: CardItem[] = [
  {
    id: 'card-1',
    number: '4291851234567895',
    formatted: '4291 8512 3456 7895',
    exp: '08/29',
    cvv: '842',
    brand: 'VISA',
    holderName: 'JOHN DOE',
    isFrozen: false,
    onlineEnabled: true,
    atmEnabled: true,
    pin: '4921',
    limit: 5000,
  },
  {
    id: 'card-2',
    number: '5301289012345678',
    formatted: '5301 2890 1234 5678',
    exp: '11/28',
    cvv: '109',
    brand: 'MASTERCARD',
    holderName: 'JOHN DOE',
    isFrozen: false,
    onlineEnabled: true,
    atmEnabled: false,
    pin: '1084',
    limit: 2500,
  },
];

export const INITIAL_USERS: UserAccountItem[] = [
  {
    id: 'usr-01',
    name: 'Carlos Mendoza',
    email: 'goldpaymentsbank@gmail.com',
    phone: '+52 221 227 5075',
    accountNumber: 'GP-8492-9102',
    clabe: INITIAL_CLABE,
    balance: 21540.50,
    status: 'active',
    role: 'user',
    tier: 'Premier',
    createdAt: '10 Ene, 2026',
    totalTransfers: 14,
  },
  {
    id: 'usr-02',
    name: 'Elena Rostova Valdés',
    email: 'elena.rostova@globalcapital.com',
    phone: '+52 554 912 3044',
    accountNumber: 'GP-7192-3841',
    clabe: '846180492019284025',
    balance: 124800.50,
    status: 'active',
    role: 'user',
    tier: 'Empresarial',
    createdAt: '22 Feb, 2026',
    totalTransfers: 28,
  },
  {
    id: 'usr-03',
    name: 'Alejandro Silva Monroy',
    email: 'a.silva@inversiones-mx.org',
    phone: '+52 331 829 4410',
    accountNumber: 'GP-3920-1194',
    clabe: '846180492019284033',
    balance: 14200.00,
    status: 'blocked',
    role: 'user',
    tier: 'Personal',
    createdAt: '05 Mar, 2026',
    totalTransfers: 6,
  },
  {
    id: 'usr-04',
    name: 'Inversiones Delta S.A. de C.V.',
    email: 'tesoreria@deltacapital.mx',
    phone: '+52 818 902 1155',
    accountNumber: 'GP-5510-9923',
    clabe: '846180492019284041',
    balance: 389400.00,
    status: 'active',
    role: 'user',
    tier: 'Empresarial',
    createdAt: '18 Abr, 2026',
    totalTransfers: 62,
  },
];

export const DEFAULT_SECURITY_CONFIG: TransferSecurityConfig = {
  requireCot: true,
  requireImf: true,
  requireSwift: false,
  cotCode: 'COT-8942',
  imfCode: 'IMF-5501',
  swiftCode: 'SWIFT-GP88',
  requireAdminApproval: true,
  minAmountForApproval: 5000,
};

export const INITIAL_EMAIL_LOGS: EmailNotificationLog[] = [
  {
    id: 'email-01',
    to: 'goldpaymentsbank@gmail.com',
    recipientName: 'Carlos Mendoza',
    subject: 'Comprobante Oficial: Acreditación SPEI Aprobada',
    preview: 'Se han acreditado $4,250.00 USD en su cuenta terminación 9102.',
    bodyHtml: `<div style="font-family:sans-serif;color:#1e293b;padding:20px;border-radius:12px;background:#f8fafc;border:1px solid #e2e8f0;">
      <h2 style="color:#059669;margin-bottom:12px;">Comprobante Digital de Acreditación</h2>
      <p>Estimado(a) <strong>Carlos Mendoza</strong>,</p>
      <p>Le notificamos que se ha procesado exitosamente la acreditación de fondos en su cuenta de <strong>Banco Gold Payments</strong>.</p>
      <table style="width:100%;margin:16px 0;border-collapse:collapse;font-size:14px;">
        <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:8px 0;color:#64748b;">Monto acreditado:</td><td style="padding:8px 0;text-align:right;font-weight:bold;color:#059669;">+$4,250.00 USD</td></tr>
        <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:8px 0;color:#64748b;">Cuenta destino:</td><td style="padding:8px 0;text-align:right;font-weight:bold;">GP-8492-9102</td></tr>
        <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:8px 0;color:#64748b;">Clave de Rastreo SPEI:</td><td style="padding:8px 0;text-align:right;font-family:monospace;">SPEI846180948291048291</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;">Estado:</td><td style="padding:8px 0;text-align:right;color:#059669;font-weight:bold;">Liquidado & Disponible</td></tr>
      </table>
      <p style="font-size:12px;color:#94a3b8;margin-top:20px;">Banco Gold Payments | Sistema Central Automatizado de Notificaciones Bancarias.</p>
    </div>`,
    sentAt: 'Hoy, 09:00 AM',
    type: 'deposit',
    amount: 4250,
    trackingKey: 'SPEI846180948291048291',
    status: 'delivered',
  },
  {
    id: 'email-02',
    to: 'goldpaymentsbank@gmail.com',
    recipientName: 'Carlos Mendoza',
    subject: 'Notificación de Débito: Envío de Transferencia',
    preview: 'Transferencia enviada por $150.00 USD a Donación GoFundMe.',
    bodyHtml: `<div style="font-family:sans-serif;color:#1e293b;padding:20px;border-radius:12px;background:#f8fafc;border:1px solid #e2e8f0;">
      <h2 style="color:#0284c7;margin-bottom:12px;">Notificación de Débito Bancario</h2>
      <p>Estimado(a) <strong>Carlos Mendoza</strong>,</p>
      <p>Se ha procesado un débito en su cuenta por concepto de transferencia saliente autorizada.</p>
      <table style="width:100%;margin:16px 0;border-collapse:collapse;font-size:14px;">
        <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:8px 0;color:#64748b;">Monto enviado:</td><td style="padding:8px 0;text-align:right;font-weight:bold;color:#dc2626;">-$150.00 USD</td></tr>
        <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:8px 0;color:#64748b;">Destinatario:</td><td style="padding:8px 0;text-align:right;">GoFundMe Apoyo Médico</td></tr>
        <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:8px 0;color:#64748b;">Folio de Operación:</td><td style="padding:8px 0;text-align:right;font-family:monospace;">SPEI846180948291048292</td></tr>
      </table>
      <p style="font-size:12px;color:#94a3b8;">Banco Gold Payments | Servicio al Cliente 24/7</p>
    </div>`,
    sentAt: 'Ayer, 14:30 PM',
    type: 'transfer_sent',
    amount: 150,
    trackingKey: 'SPEI846180948291048292',
    status: 'delivered',
  },
];

export function BankingProvider({ children }: { children: React.ReactNode }) {
  // Initialize state with mathematically valid values
  const [balance, setBalance] = useState<number>(21540.50);
  const [userClabe, setUserClabe] = useState<string>(INITIAL_CLABE);
  const [userAccount] = useState<string>('GP-8492-9102');
  const [userName, setUserName] = useState<string>('Carlos Mendoza');
  const [userEmail, setUserEmail] = useState<string>('goldpaymentsbank@gmail.com');
  const [userPhone, setUserPhone] = useState<string>('+52 221 227 5075');
  const [cryptoBtc, setCryptoBtc] = useState<number>(0.125);
  const [cryptoEth, setCryptoEth] = useState<number>(1.85);
  const [cryptoUsdt, setCryptoUsdt] = useState<number>(1500.00);
  const [cryptoSol, setCryptoSol] = useState<number>(18.5);
  const [btcPrice] = useState<number>(64540);
  const [cryptoPrices] = useState<Record<CryptoAsset, number>>({
    BTC: 64540,
    ETH: 3450,
    USDT: 1.00,
    SOL: 145.20,
  });
  const [activeOtp, setActiveOtp] = useState<string>('749215');

  // Gestor / Admin State & Configuration
  const [users, setUsers] = useState<UserAccountItem[]>(INITIAL_USERS);
  const [activeUserId, setActiveUserId] = useState<string>('usr-01');
  const [securityConfig, setSecurityConfig] = useState<TransferSecurityConfig>(DEFAULT_SECURITY_CONFIG);
  const [emailLogs, setEmailLogs] = useState<EmailNotificationLog[]>(INITIAL_EMAIL_LOGS);

  const currentUser = users.find(u => u.id === activeUserId);
  const isAccountBlocked = currentUser?.status === 'blocked';

  // Generate valid initial cards with 100% Luhn compliant numbers
  const [cards, setCards] = useState<CardItem[]>(INITIAL_CARDS);
  const [scheduledPayments, setScheduledPayments] = useState<ScheduledPaymentItem[]>(INITIAL_SCHEDULED_PAYMENTS);
  const [eurToUsdRate] = useState<number>(1.085);
  const [usdToMxnRate] = useState<number>(20.25);
  const [morseBeneficiary, setMorseBeneficiary] = useState<MorseBeneficiaryData>(MORSE_DEFAULT_BENEFICIARY);

  const [transactions, setTransactions] = useState<TransactionItem[]>([
    {
      id: 'tx-pending-01',
      type: 'sent',
      category: 'international',
      title: 'Transferencia Wire Internacional (Pendiente de Aprobación Gestor)',
      recipientOrSender: 'Banco Santander España (ES91 2100 0418 4502 0005 1332)',
      date: 'Hoy, 08:15 AM',
      timestamp: 1725450000000,
      amount: 8500.00,
      fee: 25.00,
      currency: 'USD',
      status: 'pending',
      trackingKey: 'WIRE-PEND-84920194',
      iban: 'ES91 2100 0418 4502 0005 1332',
      bic: 'BSCHESMMXXX',
      reference: 'Factura Adquisición Bienes de Capital #9914',
    },
    {
      id: 'tx-pending-02',
      type: 'sent',
      category: 'spei',
      title: 'Transferencia SPEI Corporativa (Pendiente de Aprobación Gestor)',
      recipientOrSender: 'BBVA México (CLABE: ••••4829)',
      date: 'Hoy, 07:45 AM',
      timestamp: 1725448200000,
      amount: 12000.00,
      fee: 10.00,
      currency: 'USD',
      status: 'pending',
      trackingKey: 'SPEI-PEND-71092834',
      clabe: '012180015482910482',
      reference: 'Liquidación Anticipada de Proveedor Corporativo',
    },
    {
      id: 'tx-morse-01',
      type: 'sent',
      category: 'morse',
      title: 'Transferencia ACH a Morse (Dólares Digitales)',
      recipientOrSender: 'Morse Financial (Oscar Isael Bueno Tochihuitl)',
      date: 'Ayer, 16:15 PM',
      timestamp: 1725370500000,
      amount: 500.00,
      fee: 0,
      currency: 'USD',
      status: 'completed',
      trackingKey: 'ACH2609101015074883',
      clabe: 'ACH Routing: 101015074 | Acc: ••••4821 (Checking)',
    },
    {
      id: 'tx-sepa-01',
      type: 'sent',
      category: 'international',
      title: 'Pago Semanal SEPA Instant (2,500.00 EUR)',
      recipientOrSender: 'Oscar Isael Bueno Tochihuitl (LU504080000046125444)',
      date: 'Hoy, 10:30 AM',
      timestamp: 1725453600000,
      amount: 2712.50,
      fee: 0,
      currency: 'USD',
      status: 'completed',
      trackingKey: 'SEPA-LU-BCIR-846180492019',
    },
    {
      id: 'tx-1',
      type: 'received',
      category: 'deposit',
      title: 'Depósito Nómina Internacional',
      recipientOrSender: 'Global Payroll LLC',
      date: 'Hoy, 09:00 AM',
      timestamp: 1725450000000,
      amount: 4250.00,
      fee: 0,
      currency: 'USD',
      status: 'completed',
      trackingKey: 'SPEI846180948291048291',
    },
    {
      id: 'tx-2',
      type: 'sent',
      category: 'gofundme',
      title: 'Donación GoFundMe - Apoyo Comunitario',
      recipientOrSender: 'gofundme.com/f/apoyo-medico',
      date: 'Ayer, 14:30 PM',
      timestamp: 1725363600000,
      amount: 150.00,
      fee: 3.00,
      currency: 'USD',
      status: 'completed',
      trackingKey: 'SPEI846180948291048292',
      cardLast4: '0020',
    },
    {
      id: 'tx-3',
      type: 'sent',
      category: 'crypto',
      title: 'Compra de Bitcoin (BTC)',
      recipientOrSender: 'Gold Crypto Custody',
      date: '02 Ago, 11:20 AM',
      timestamp: 1725277200000,
      amount: 1200.00,
      fee: 12.00,
      currency: 'USD',
      status: 'completed',
      trackingKey: 'SPEI846180948291048293',
    },
    {
      id: 'tx-4',
      type: 'received',
      category: 'spei',
      title: 'Transferencia Interbancaria SPEI',
      recipientOrSender: 'BBVA Bancomer (7219)',
      date: '01 Ago, 16:45 PM',
      timestamp: 1725190800000,
      amount: 350.00,
      fee: 0,
      currency: 'USD',
      status: 'completed',
      trackingKey: 'SPEI846180948291048294',
    },
  ]);

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-sepa-active',
      title: 'Pago Semanal SEPA Registrado: 2,500.00 EUR',
      message: 'Orden periódica activa para Oscar Isael Bueno Tochihuitl en Banking Circle S.A. (LU504080000046125444). Próximo cargo: Viernes.',
      time: 'Hoy, 10:30 AM',
      read: false,
      type: 'info',
    },
    {
      id: 'notif-1',
      title: 'Transferencia SPEI completada',
      message: 'Tu transferencia interbancaria por $350.00 USD fue acreditada con éxito.',
      time: 'Hace 2 horas',
      read: false,
      type: 'success',
    },
    {
      id: 'notif-2',
      title: 'Código 2FA / OTP generado',
      message: 'Código de autorización disponible para transferencias de alta seguridad.',
      time: 'Hace 5 horas',
      read: false,
      type: 'info',
    },
    {
      id: 'notif-3',
      title: 'Tarjeta Virtual Activa',
      message: 'Tu tarjeta VISA terminación ' + cards[0]?.number.slice(-4) + ' está habilitada con validación Luhn.',
      time: 'Ayer',
      read: true,
      type: 'info',
    },
  ]);

  const [loans, setLoans] = useState<LoanItem[]>([
    {
      id: 'loan-1',
      amount: 5000,
      durationMonths: 12,
      apr: 5.2,
      monthlyPayment: 438.33,
      purpose: 'Expansión de negocio comercial',
      status: 'approved',
      appliedDate: '15 Jul, 2026',
    },
  ]);

  const [mids, setMids] = useState<MidItem[]>(INITIAL_MIDS);

  // Generates a 6-digit OTP
  const generateNewOtp = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setActiveOtp(code);
    // Add notification
    const newNotif: NotificationItem = {
      id: 'otp-' + Date.now(),
      title: 'Código de Seguridad OTP',
      message: `Tu código de verificación para autorizar la operación es: ${code}`,
      time: 'Ahora',
      read: false,
      type: 'alert',
    };
    setNotifications(prev => [newNotif, ...prev]);
    return code;
  };

  const verifyOtp = (input: string) => {
    const sanitized = input.replace(/\D/g, '');
    return sanitized === activeOtp;
  };

  const triggerManualEmailNotification = (data: Omit<EmailNotificationLog, 'id' | 'sentAt' | 'status'>) => {
    const now = new Date();
    const timeStr = 'Hoy, ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newLog: EmailNotificationLog = {
      ...data,
      id: 'email-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      sentAt: timeStr,
      status: 'delivered',
    };
    setEmailLogs(prev => [newLog, ...prev]);
  };

  // Process a transfer with real balance deduction, COT/IMF rules, approval gate and auto email
  const sendTransfer = (details: {
    type: 'internal' | 'spei' | 'gofundme' | 'international' | 'card' | 'morse' | 'ach';
    recipient: string;
    amount: number;
    fee: number;
    title: string;
    clabe?: string;
    cardLast4?: string;
  }) => {
    if (isAccountBlocked) {
      return { 
        success: false, 
        trackingKey: '', 
        error: 'Tu cuenta bancaria ha sido bloqueada/congelada por el departamento de administración y cumplimiento. No se pueden procesar débitos ni transferencias.' 
      };
    }

    const totalRequired = details.amount + details.fee;
    if (totalRequired > balance) {
      return { success: false, trackingKey: '', error: 'Saldo insuficiente en tu cuenta para cubrir la transferencia y comisión.' };
    }

    const trackingKey = generateSpeiTrackingKey();
    const now = new Date();
    const dateFormatted = 'Hoy, ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Deduct funds
    setBalance(prev => prev - totalRequired);
    setUsers(prev => prev.map(u => {
      if (u.id === activeUserId) {
        return { ...u, balance: Math.max(0, u.balance - totalRequired), totalTransfers: u.totalTransfers + 1 };
      }
      return u;
    }));

    const requiresApproval = securityConfig.requireAdminApproval && details.amount >= securityConfig.minAmountForApproval;
    const txStatus = requiresApproval ? 'pending' : 'completed';

    const newTx: TransactionItem = {
      id: 'tx-' + Date.now(),
      type: 'sent',
      category: details.type,
      title: requiresApproval ? `${details.title} (En Revisión por Gestor)` : details.title,
      recipientOrSender: details.recipient,
      date: dateFormatted,
      timestamp: Date.now(),
      amount: details.amount,
      fee: details.fee,
      currency: 'USD',
      status: txStatus,
      trackingKey,
      clabe: details.clabe,
      cardLast4: details.cardLast4,
    };

    setTransactions(prev => [newTx, ...prev]);

    // Push in-app notification
    const newNotif: NotificationItem = {
      id: 'notif-' + Date.now(),
      title: requiresApproval ? 'Transferencia Enviada a Aprobación' : 'Transferencia Autorizada',
      message: requiresApproval 
        ? `Has enviado $${details.amount.toFixed(2)} USD a ${details.recipient}. Debido al monto, se encuentra en espera de aprobación por el Gestor. Folio: ${trackingKey}`
        : `Has enviado $${details.amount.toFixed(2)} USD a ${details.recipient}. Folio: ${trackingKey}`,
      time: 'Ahora',
      read: false,
      type: requiresApproval ? 'alert' : 'success',
    };
    setNotifications(prev => [newNotif, ...prev]);

    // Automatic email dispatch
    triggerManualEmailNotification({
      to: userEmail,
      recipientName: userName,
      subject: requiresApproval 
        ? `Aviso: Transferencia en Revisión por el Gestor ($${details.amount.toFixed(2)} USD)`
        : `Comprobante de Envío: Transferencia Aprobada ($${details.amount.toFixed(2)} USD)`,
      preview: `Folio: ${trackingKey} para ${details.recipient}.`,
      bodyHtml: `<div style="font-family:sans-serif;color:#1e293b;padding:24px;border-radius:12px;background:#f8fafc;border:1px solid #e2e8f0;">
        <h2 style="color:${requiresApproval ? '#f59e0b' : '#0284c7'};margin-bottom:8px;">${requiresApproval ? 'Transferencia en Proceso de Autorización' : 'Comprobante de Débito Bancario'}</h2>
        <p>Estimado(a) <strong>${userName}</strong>,</p>
        <p>${requiresApproval 
          ? 'Su transferencia ha sido enviada al sistema central y está en cola de revisión y aprobación por el Gestor del Sistema.' 
          : 'Le confirmamos que su transferencia ha sido transmitida y debitada exitosamente de su saldo disponible.'}
        </p>
        <table style="width:100%;margin:16px 0;border-collapse:collapse;font-size:14px;">
          <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:8px 0;color:#64748b;">Monto enviado:</td><td style="padding:8px 0;text-align:right;font-weight:bold;color:#dc2626;">-$${details.amount.toFixed(2)} USD</td></tr>
          <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:8px 0;color:#64748b;">Comisión:</td><td style="padding:8px 0;text-align:right;">$${details.fee.toFixed(2)} USD</td></tr>
          <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:8px 0;color:#64748b;">Destinatario:</td><td style="padding:8px 0;text-align:right;">${details.recipient}</td></tr>
          <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:8px 0;color:#64748b;">Folio SPEI / Rastreo:</td><td style="padding:8px 0;text-align:right;font-family:monospace;">${trackingKey}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Estado:</td><td style="padding:8px 0;text-align:right;font-weight:bold;color:${requiresApproval ? '#f59e0b' : '#059669'};">${requiresApproval ? 'Pendiente de Aprobación por Gestor' : 'Liquidada y Enviada'}</td></tr>
        </table>
        <p style="font-size:12px;color:#94a3b8;margin-top:16px;">Banco Gold Payments | Notificación Automática Generada al Cliente.</p>
      </div>`,
      type: requiresApproval ? 'transfer_pending' : 'transfer_sent',
      amount: details.amount,
      trackingKey,
    });

    return { success: true, trackingKey };
  };

  const depositFunds = (amount: number, method: string) => {
    setBalance(prev => prev + amount);
    setUsers(prev => prev.map(u => {
      if (u.id === activeUserId) {
        return { ...u, balance: u.balance + amount };
      }
      return u;
    }));

    const trackingKey = generateSpeiTrackingKey();
    const now = new Date();
    const dateFormatted = 'Hoy, ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newTx: TransactionItem = {
      id: 'tx-' + Date.now(),
      type: 'received',
      category: 'deposit',
      title: `Depósito via ${method}`,
      recipientOrSender: `Acreditación ${method}`,
      date: dateFormatted,
      timestamp: Date.now(),
      amount,
      fee: 0,
      currency: 'USD',
      status: 'completed',
      trackingKey,
    };

    setTransactions(prev => [newTx, ...prev]);

    setNotifications(prev => [
      {
        id: 'notif-' + Date.now(),
        title: 'Depósito Acreditado',
        message: `Se acreditaron $${amount.toFixed(2)} USD a tu balance general.`,
        time: 'Ahora',
        read: false,
        type: 'success',
      },
      ...prev,
    ]);

    triggerManualEmailNotification({
      to: userEmail,
      recipientName: userName,
      subject: `Notificación Oficial: Acreditación de Depósito ($${amount.toFixed(2)} USD)`,
      preview: `Se han acreditado $${amount.toFixed(2)} USD vía ${method}.`,
      bodyHtml: `<div style="font-family:sans-serif;color:#1e293b;padding:24px;border-radius:12px;background:#f8fafc;border:1px solid #e2e8f0;">
        <h2 style="color:#059669;margin-bottom:8px;">Acreditación Confirmada</h2>
        <p>Estimado(a) <strong>${userName}</strong>,</p>
        <p>Se ha recibido y validado un depósito bancario a su favor.</p>
        <table style="width:100%;margin:16px 0;border-collapse:collapse;font-size:14px;">
          <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:8px 0;color:#64748b;">Monto Acreditado:</td><td style="padding:8px 0;text-align:right;font-weight:bold;color:#059669;">+$${amount.toFixed(2)} USD</td></tr>
          <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:8px 0;color:#64748b;">Método de Depósito:</td><td style="padding:8px 0;text-align:right;">${method}</td></tr>
          <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:8px 0;color:#64748b;">Folio de Operación:</td><td style="padding:8px 0;text-align:right;font-family:monospace;">${trackingKey}</td></tr>
        </table>
        <p style="font-size:12px;color:#94a3b8;margin-top:16px;">Banco Gold Payments | Notificaciones en Tiempo Real.</p>
      </div>`,
      type: 'deposit',
      amount,
      trackingKey,
    });
  };

  const adminCreditAccount = (userId: string, amount: number, concept: string) => {
    const target = users.find(u => u.id === userId);
    if (!target) return { success: false, error: 'Usuario no encontrado' };

    const trackingKey = generateSpeiTrackingKey();
    const now = new Date();
    const dateFormatted = 'Hoy, ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return { ...u, balance: u.balance + amount };
      }
      return u;
    }));

    if (userId === activeUserId) {
      setBalance(prev => prev + amount);
    }

    const newTx: TransactionItem = {
      id: 'tx-adm-cr-' + Date.now(),
      type: 'received',
      category: 'deposit',
      title: `Depósito Gestor: ${concept || 'Crédito Administrativo'}`,
      recipientOrSender: 'Gestor Bancario Central (Admin)',
      date: dateFormatted,
      timestamp: Date.now(),
      amount,
      fee: 0,
      currency: 'USD',
      status: 'completed',
      trackingKey,
      reference: concept,
    };

    setTransactions(prev => [newTx, ...prev]);

    setNotifications(prev => [
      {
        id: 'notif-' + Date.now(),
        title: 'Depósito Acreditado por Administración',
        message: `Se acreditaron $${amount.toFixed(2)} USD a ${target.name}. Concepto: ${concept || 'Acreditación administrativa'}.`,
        time: 'Ahora',
        read: false,
        type: 'success',
      },
      ...prev
    ]);

    triggerManualEmailNotification({
      to: target.email,
      recipientName: target.name,
      subject: `Acreditación Bancaria Exitosa: +$${amount.toFixed(2)} USD`,
      preview: `Se han depositado $${amount.toFixed(2)} USD en su cuenta ${target.accountNumber}.`,
      bodyHtml: `<div style="font-family:sans-serif;color:#1e293b;padding:24px;border-radius:12px;background:#f8fafc;border:1px solid #e2e8f0;">
        <h2 style="color:#059669;margin-bottom:8px;">Acreditación de Fondos Confirmada</h2>
        <p>Estimado(a) <strong>${target.name}</strong>,</p>
        <p>Le informamos que el departamento de operaciones y administración ha acreditado un depósito en su cuenta bancaria.</p>
        <table style="width:100%;margin:16px 0;border-collapse:collapse;font-size:14px;">
          <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:8px 0;color:#64748b;">Monto acreditado:</td><td style="padding:8px 0;text-align:right;font-weight:bold;color:#059669;">+$${amount.toFixed(2)} USD</td></tr>
          <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:8px 0;color:#64748b;">Concepto:</td><td style="padding:8px 0;text-align:right;">${concept || 'Depósito en Ventanilla / Gestor'}</td></tr>
          <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:8px 0;color:#64748b;">Cuenta:</td><td style="padding:8px 0;text-align:right;">${target.accountNumber}</td></tr>
          <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:8px 0;color:#64748b;">Folio de Operación:</td><td style="padding:8px 0;text-align:right;font-family:monospace;">${trackingKey}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Nuevo Saldo:</td><td style="padding:8px 0;text-align:right;font-weight:bold;">$${(target.balance + amount).toFixed(2)} USD</td></tr>
        </table>
        <p style="font-size:12px;color:#94a3b8;margin-top:16px;">Banco Gold Payments | Notificación Automática Generada por el Sistema Gestor.</p>
      </div>`,
      type: 'deposit',
      amount,
      trackingKey,
      reference: concept,
    });

    return { success: true, tx: newTx };
  };

  const adminDebitAccount = (userId: string, amount: number, concept: string) => {
    const target = users.find(u => u.id === userId);
    if (!target) return { success: false, error: 'Usuario no encontrado' };
    if (target.balance < amount) return { success: false, error: `Saldo insuficiente. Saldo actual: $${target.balance.toFixed(2)} USD` };

    const trackingKey = generateSpeiTrackingKey();
    const now = new Date();
    const dateFormatted = 'Hoy, ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return { ...u, balance: u.balance - amount };
      }
      return u;
    }));

    if (userId === activeUserId) {
      setBalance(prev => prev - amount);
    }

    const newTx: TransactionItem = {
      id: 'tx-adm-db-' + Date.now(),
      type: 'sent',
      category: 'internal',
      title: `Débito Administrativo: ${concept || 'Ajuste de Saldo'}`,
      recipientOrSender: 'Gestor Bancario Central (Admin)',
      date: dateFormatted,
      timestamp: Date.now(),
      amount,
      fee: 0,
      currency: 'USD',
      status: 'completed',
      trackingKey,
      reference: concept,
    };

    setTransactions(prev => [newTx, ...prev]);

    setNotifications(prev => [
      {
        id: 'notif-' + Date.now(),
        title: 'Débito Procesado por Administración',
        message: `Se aplicó un débito de -$${amount.toFixed(2)} USD a ${target.name}. Motivo: ${concept || 'Ajuste administrativo'}.`,
        time: 'Ahora',
        read: false,
        type: 'alert',
      },
      ...prev
    ]);

    triggerManualEmailNotification({
      to: target.email,
      recipientName: target.name,
      subject: `Notificación de Débito Bancario: -$${amount.toFixed(2)} USD`,
      preview: `Se ha procesado un débito de $${amount.toFixed(2)} USD en su cuenta ${target.accountNumber}.`,
      bodyHtml: `<div style="font-family:sans-serif;color:#1e293b;padding:24px;border-radius:12px;background:#f8fafc;border:1px solid #e2e8f0;">
        <h2 style="color:#dc2626;margin-bottom:8px;">Notificación Oficial de Débito</h2>
        <p>Estimado(a) <strong>${target.name}</strong>,</p>
        <p>Se ha aplicado un débito administrativo en su cuenta bancaria de conformidad con las políticas operativas del banco.</p>
        <table style="width:100%;margin:16px 0;border-collapse:collapse;font-size:14px;">
          <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:8px 0;color:#64748b;">Monto debitado:</td><td style="padding:8px 0;text-align:right;font-weight:bold;color:#dc2626;">-$${amount.toFixed(2)} USD</td></tr>
          <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:8px 0;color:#64748b;">Concepto / Causa:</td><td style="padding:8px 0;text-align:right;">${concept || 'Débito por orden administrativa'}</td></tr>
          <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:8px 0;color:#64748b;">Folio de Débito:</td><td style="padding:8px 0;text-align:right;font-family:monospace;">${trackingKey}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Saldo Remanente:</td><td style="padding:8px 0;text-align:right;font-weight:bold;">$${(target.balance - amount).toFixed(2)} USD</td></tr>
        </table>
        <p style="font-size:12px;color:#94a3b8;margin-top:16px;">Banco Gold Payments | Dirección de Seguridad y Cumplimiento Normativo.</p>
      </div>`,
      type: 'debit',
      amount,
      trackingKey,
      reference: concept,
    });

    return { success: true, tx: newTx };
  };

  const adminToggleAccountBlock = (userId: string) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) {
      return { success: false, newStatus: 'active' as const };
    }

    const nextStatus: 'active' | 'blocked' = targetUser.status === 'blocked' ? 'active' : 'blocked';
    const isBlocked = nextStatus === 'blocked';

    setUsers(prev => prev.map(u => (u.id === userId ? { ...u, status: nextStatus } : u)));

    setNotifications(prev => [
      {
        id: 'notif-' + Date.now(),
        title: isBlocked ? 'Cuenta Bancaria Bloqueada' : 'Cuenta Bancaria Desbloqueada',
        message: isBlocked 
          ? `La cuenta de ${targetUser.name} ha sido bloqueada/congelada por el Gestor.` 
          : `La cuenta de ${targetUser.name} ha sido reactivada exitosamente.`,
        time: 'Ahora',
        read: false,
        type: isBlocked ? 'alert' : 'success',
      },
      ...prev
    ]);

    triggerManualEmailNotification({
      to: targetUser.email,
      recipientName: targetUser.name,
      subject: isBlocked ? 'Aviso Importante: Cuenta Bancaria Suspendida/Bloqueada' : 'Notificación Oficial: Cuenta Bancaria Reactivada',
      preview: isBlocked 
        ? `Su cuenta ${targetUser.accountNumber} ha sido temporalmente restringida para transferencias.` 
        : `Su cuenta ${targetUser.accountNumber} se encuentra plenamente operativa.`,
      bodyHtml: `<div style="font-family:sans-serif;color:#1e293b;padding:24px;border-radius:12px;background:#f8fafc;border:1px solid #e2e8f0;">
        <h2 style="color:${isBlocked ? '#dc2626' : '#059669'};margin-bottom:8px;">${isBlocked ? 'Estado de Cuenta: Bloqueada' : 'Estado de Cuenta: Activa y Desbloqueada'}</h2>
        <p>Estimado(a) <strong>${targetUser.name}</strong>,</p>
        <p>${isBlocked 
          ? 'Le comunicamos que por motivos de seguridad y revisión de cumplimiento normativo, su cuenta ha sido congelada. Las transferencias salientes y débitos permanecerán suspendidos.' 
          : 'Le comunicamos que su cuenta bancaria ha sido desbloqueada satisfactoriamente. Todas las operaciones de depósito, retiro y transferencias se encuentran habilitadas.'}
        </p>
        <p style="font-size:12px;color:#94a3b8;margin-top:16px;">Banco Gold Payments | Departamento de Seguridad y Cumplimiento.</p>
      </div>`,
      type: isBlocked ? 'account_blocked' : 'account_unblocked',
    });

    return { success: true, newStatus: nextStatus };
  };

  const adminApproveTransfer = (txId: string) => {
    const existingTx = transactions.find(t => t.id === txId);
    if (!existingTx) {
      return { success: false, error: 'Transferencia no encontrada' };
    }

    const approvedTx: TransactionItem = { ...existingTx, status: 'completed' };
    setTransactions(prev => prev.map(tx => (tx.id === txId ? approvedTx : tx)));

    setNotifications(prev => [
      {
        id: 'notif-' + Date.now(),
        title: 'Transferencia Aprobada por Gestor',
        message: `La transferencia a ${approvedTx.recipientOrSender} por $${approvedTx.amount.toFixed(2)} USD fue aprobada y liquidada.`,
        time: 'Ahora',
        read: false,
        type: 'success',
      },
      ...prev
    ]);

    triggerManualEmailNotification({
      to: userEmail,
      recipientName: userName,
      subject: `Transferencia Aprobada y Liquidada: $${approvedTx.amount.toFixed(2)} USD`,
      preview: `Su transferencia con folio ${approvedTx.trackingKey || approvedTx.id} ha sido aprobada por el Gestor.`,
      bodyHtml: `<div style="font-family:sans-serif;color:#1e293b;padding:24px;border-radius:12px;background:#f8fafc;border:1px solid #e2e8f0;">
        <h2 style="color:#059669;margin-bottom:8px;">Transferencia Bancaria Liquidada con Éxito</h2>
        <p>Estimado(a) <strong>${userName}</strong>,</p>
        <p>Nos complace informarle que la transferencia previamente retenida en revisión ha sido <strong>APROBADA Y LIBERADA</strong> por el Gestor del Sistema.</p>
        <table style="width:100%;margin:16px 0;border-collapse:collapse;font-size:14px;">
          <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:8px 0;color:#64748b;">Monto enviado:</td><td style="padding:8px 0;text-align:right;font-weight:bold;color:#059669;">$${approvedTx.amount.toFixed(2)} USD</td></tr>
          <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:8px 0;color:#64748b;">Destinatario:</td><td style="padding:8px 0;text-align:right;">${approvedTx.recipientOrSender}</td></tr>
          <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:8px 0;color:#64748b;">Folio de Rastreo:</td><td style="padding:8px 0;text-align:right;font-family:monospace;">${approvedTx.trackingKey || approvedTx.id}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Estado Final:</td><td style="padding:8px 0;text-align:right;color:#059669;font-weight:bold;">Aprobada / Liquidada</td></tr>
        </table>
        <p style="font-size:12px;color:#94a3b8;margin-top:16px;">Banco Gold Payments | Notificación Oficial de Liquidación de Pagos.</p>
      </div>`,
      type: 'transfer_approved',
      amount: approvedTx.amount,
      trackingKey: approvedTx.trackingKey,
    });

    return { success: true, tx: approvedTx };
  };

  const adminRejectTransfer = (txId: string, reason: string) => {
    const existingTx = transactions.find(t => t.id === txId);
    if (!existingTx) {
      return { success: false, error: 'Transferencia no encontrada' };
    }

    const rejectedTx: TransactionItem = { ...existingTx, status: 'failed' };
    setTransactions(prev => prev.map(tx => (tx.id === txId ? rejectedTx : tx)));

    // Refund funds back to the user
    const refundAmount = rejectedTx.amount + rejectedTx.fee;
    setBalance(prev => prev + refundAmount);
    setUsers(prev => prev.map(u => {
      if (u.id === activeUserId) {
        return { ...u, balance: u.balance + refundAmount };
      }
      return u;
    }));

    setNotifications(prev => [
      {
        id: 'notif-' + Date.now(),
        title: 'Transferencia Rechazada por Gestor',
        message: `La transferencia de $${rejectedTx.amount.toFixed(2)} USD fue rechazada. Motivo: ${reason || 'Rechazo administrativo'}. Fondos reembolsados.`,
        time: 'Ahora',
        read: false,
        type: 'alert',
      },
      ...prev
    ]);

    triggerManualEmailNotification({
      to: userEmail,
      recipientName: userName,
      subject: `Notificación: Transferencia Rechazada & Reembolso Aplicado`,
      preview: `La transferencia a ${rejectedTx.recipientOrSender} fue cancelada. Sus fondos fueron reintegrados.`,
      bodyHtml: `<div style="font-family:sans-serif;color:#1e293b;padding:24px;border-radius:12px;background:#f8fafc;border:1px solid #e2e8f0;">
        <h2 style="color:#dc2626;margin-bottom:8px;">Aviso de Transferencia No Autorizada</h2>
        <p>Estimado(a) <strong>${userName}</strong>,</p>
        <p>Le notificamos que el Gestor ha rechazado la transferencia bancaria solicitada.</p>
        <p><strong>Motivo del rechazo:</strong> ${reason || 'Falta de validación de códigos de transferencia o inconsistencia en cuenta destino.'}</p>
        <table style="width:100%;margin:16px 0;border-collapse:collapse;font-size:14px;">
          <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:8px 0;color:#64748b;">Monto devuelto:</td><td style="padding:8px 0;text-align:right;font-weight:bold;color:#059669;">+$${refundAmount.toFixed(2)} USD</td></tr>
          <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:8px 0;color:#64748b;">Folio:</td><td style="padding:8px 0;text-align:right;font-family:monospace;">${rejectedTx.trackingKey || rejectedTx.id}</td></tr>
        </table>
        <p style="font-size:12px;color:#94a3b8;margin-top:16px;">Los fondos han sido reintegrados a su saldo disponible. Banco Gold Payments.</p>
      </div>`,
      type: 'transfer_rejected',
      amount: rejectedTx.amount,
      trackingKey: rejectedTx.trackingKey,
    });

    return { success: true, tx: rejectedTx };
  };

  const updateSecurityConfig = (config: Partial<TransferSecurityConfig>) => {
    setSecurityConfig(prev => ({ ...prev, ...config }));
    setNotifications(prev => [
      {
        id: 'notif-sec-' + Date.now(),
        title: 'Políticas de Seguridad Actualizadas',
        message: 'Se actualizaron los requerimientos de códigos de transferencia (IMF, COT, SWIFT).',
        time: 'Ahora',
        read: false,
        type: 'info',
      },
      ...prev
    ]);
  };

  const registerNewUser = (data: {
    name: string;
    email: string;
    phone?: string;
    initialDeposit?: number;
    tier?: 'Personal' | 'Premier' | 'Empresarial';
  }) => {
    const newClabe = generateValidClabe();
    const newAccNum = 'GP-' + Math.floor(1000 + Math.random() * 9000) + '-' + Math.floor(1000 + Math.random() * 9000);
    const deposit = data.initialDeposit || 0;

    const newUser: UserAccountItem = {
      id: 'usr-' + Date.now(),
      name: data.name,
      email: data.email,
      phone: data.phone || '+52 55 ' + Math.floor(10000000 + Math.random() * 90000000),
      accountNumber: newAccNum,
      clabe: newClabe,
      balance: deposit,
      status: 'active',
      role: 'user',
      tier: data.tier || 'Personal',
      createdAt: 'Hoy',
      totalTransfers: deposit > 0 ? 1 : 0,
    };

    setUsers(prev => [newUser, ...prev]);

    setNotifications(prev => [
      {
        id: 'notif-' + Date.now(),
        title: 'Nueva Cuenta Bancaria Registrada',
        message: `Se ha dado de alta exitosamente la cuenta de ${data.name} (${newAccNum}).`,
        time: 'Ahora',
        read: false,
        type: 'success',
      },
      ...prev
    ]);

    triggerManualEmailNotification({
      to: data.email,
      recipientName: data.name,
      subject: `Bienvenido a Banco Gold Payments - Apertura de Cuenta`,
      preview: `Su cuenta ${newAccNum} ha sido abierta con saldo inicial de $${deposit.toFixed(2)} USD.`,
      bodyHtml: `<div style="font-family:sans-serif;color:#1e293b;padding:24px;border-radius:12px;background:#f8fafc;border:1px solid #e2e8f0;">
        <h2 style="color:#0284c7;margin-bottom:8px;">Bienvenido a Banco Gold Payments</h2>
        <p>Estimado(a) <strong>${data.name}</strong>,</p>
        <p>Su registro ha sido completado y su cuenta de banca en línea está activa.</p>
        <table style="width:100%;margin:16px 0;border-collapse:collapse;font-size:14px;">
          <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:8px 0;color:#64748b;">Número de Cuenta:</td><td style="padding:8px 0;text-align:right;font-weight:bold;">${newAccNum}</td></tr>
          <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:8px 0;color:#64748b;">CLABE Interbancaria:</td><td style="padding:8px 0;text-align:right;font-family:monospace;">${newClabe}</td></tr>
          <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:8px 0;color:#64748b;">Saldo Inicial:</td><td style="padding:8px 0;text-align:right;font-weight:bold;color:#059669;">$${deposit.toFixed(2)} USD</td></tr>
        </table>
        <p style="font-size:12px;color:#94a3b8;margin-top:16px;">Banco Gold Payments | Plataforma Integral de Servicios Financieros.</p>
      </div>`,
      type: 'deposit',
      amount: deposit,
    });

    return newUser;
  };

  const switchUser = (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (!target) return;
    setActiveUserId(userId);
    setBalance(target.balance);
    setUserName(target.name);
    setUserEmail(target.email);
    setUserPhone(target.phone);
    setUserClabe(target.clabe);
    setNotifications(prev => [
      {
        id: 'notif-sw-' + Date.now(),
        title: 'Sesión Cambiada',
        message: `Ahora estás operando como ${target.name} (${target.accountNumber}).`,
        time: 'Ahora',
        read: false,
        type: 'info',
      },
      ...prev
    ]);
  };

  const tradeCrypto = (type: 'buy' | 'sell', usdAmount: number) => {
    const btcAmount = usdAmount / btcPrice;
    if (type === 'buy') {
      if (usdAmount > balance) {
        return { success: false, error: 'Saldo USD insuficiente para comprar BTC.' };
      }
      setBalance(prev => prev - usdAmount);
      setCryptoBtc(prev => prev + btcAmount);
    } else {
      if (btcAmount > cryptoBtc) {
        return { success: false, error: 'Saldo de Bitcoin insuficiente para realizar la venta.' };
      }
      setCryptoBtc(prev => prev - btcAmount);
      setBalance(prev => prev + usdAmount);
    }

    const trackingKey = generateSpeiTrackingKey();
    const now = new Date();
    const dateFormatted = 'Hoy, ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newTx: TransactionItem = {
      id: 'tx-' + Date.now(),
      type: type === 'buy' ? 'sent' : 'received',
      category: 'crypto',
      title: type === 'buy' ? `Compra de ${btcAmount.toFixed(5)} BTC` : `Venta de ${btcAmount.toFixed(5)} BTC`,
      recipientOrSender: 'Mercado Cripto Gold Payments',
      date: dateFormatted,
      timestamp: Date.now(),
      amount: usdAmount,
      fee: 0,
      currency: 'USD',
      status: 'completed',
      trackingKey,
    };

    setTransactions(prev => [newTx, ...prev]);

    return { success: true };
  };

  const sendCryptoTransfer = (details: CryptoTransferDetails) => {
    const { asset, amount, toAddress, network, walletName, networkFee, memo } = details;
    const currentBalance = 
      asset === 'BTC' ? cryptoBtc :
      asset === 'ETH' ? cryptoEth :
      asset === 'USDT' ? cryptoUsdt :
      cryptoSol;

    const totalRequired = amount + (asset === 'USDT' ? networkFee : networkFee);
    if (totalRequired > currentBalance) {
      return { 
        success: false, 
        txHash: '', 
        trackingKey: '', 
        error: `Saldo insuficiente en tu billetera de ${asset}. Saldo disponible: ${currentBalance.toFixed(4)} ${asset} (Requerido: ${totalRequired.toFixed(4)} ${asset}).` 
      };
    }

    // Deduct from appropriate asset balance
    if (asset === 'BTC') setCryptoBtc(prev => Math.max(0, +(prev - totalRequired).toFixed(8)));
    else if (asset === 'ETH') setCryptoEth(prev => Math.max(0, +(prev - totalRequired).toFixed(8)));
    else if (asset === 'USDT') setCryptoUsdt(prev => Math.max(0, +(prev - totalRequired).toFixed(2)));
    else if (asset === 'SOL') setCryptoSol(prev => Math.max(0, +(prev - totalRequired).toFixed(6)));

    const txHash = generateBlockchainTxHash(asset, network);
    const trackingKey = txHash;
    const now = new Date();
    const dateFormatted = 'Hoy, ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const usdPrice = cryptoPrices[asset] || 1;
    const amountInUsd = amount * usdPrice;
    const feeInUsd = networkFee * usdPrice;

    const destLabel = walletName 
      ? `${walletName} (${toAddress.slice(0, 6)}...${toAddress.slice(-4)})`
      : `${toAddress.slice(0, 8)}...${toAddress.slice(-6)}`;

    const newTx: TransactionItem = {
      id: 'tx-crypto-' + Date.now(),
      type: 'sent',
      category: 'crypto',
      title: `Envío ${amount} ${asset} a Billetera`,
      recipientOrSender: destLabel,
      date: dateFormatted,
      timestamp: Date.now(),
      amount: amountInUsd,
      fee: feeInUsd,
      currency: 'USD',
      status: 'completed',
      trackingKey,
    };

    setTransactions(prev => [newTx, ...prev]);

    // Push notification
    const newNotif: NotificationItem = {
      id: 'notif-crypto-' + Date.now(),
      title: `Transferencia Blockchain ${asset} Enviada`,
      message: `Has enviado ${amount} ${asset} (~$${amountInUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD) a ${walletName || 'billetera externa'}. TxHash: ${txHash.slice(0, 16)}...`,
      time: 'Ahora',
      read: false,
      type: 'success',
    };
    setNotifications(prev => [newNotif, ...prev]);

    return { success: true, txHash, trackingKey };
  };

  const addCard = (brand: 'VISA' | 'MASTERCARD', limit: number = 3000) => {
    const generated = generateValidLuhnCard(brand);
    const newCard: CardItem = {
      id: 'card-' + Date.now(),
      number: generated.number,
      formatted: generated.formatted,
      exp: generated.exp,
      cvv: generated.cvv,
      brand,
      holderName: userName.toUpperCase(),
      isFrozen: false,
      onlineEnabled: true,
      atmEnabled: true,
      pin: Math.floor(1000 + Math.random() * 9000).toString(),
      limit,
    };

    setCards(prev => [...prev, newCard]);

    setNotifications(prev => [
      {
        id: 'notif-' + Date.now(),
        title: 'Nueva Tarjeta Emitida',
        message: `Se ha emitido tu tarjeta virtual ${brand} terminación ${newCard.number.slice(-4)} con validación matemática Luhn.`,
        time: 'Ahora',
        read: false,
        type: 'success',
      },
      ...prev,
    ]);

    return newCard;
  };

  const toggleCardFreeze = (cardId: string) => {
    setCards(prev =>
      prev.map(c => (c.id === cardId ? { ...c, isFrozen: !c.isFrozen } : c))
    );
  };

  const toggleCardOnline = (cardId: string) => {
    setCards(prev =>
      prev.map(c => (c.id === cardId ? { ...c, onlineEnabled: !c.onlineEnabled } : c))
    );
  };

  const toggleCardAtm = (cardId: string) => {
    setCards(prev =>
      prev.map(c => (c.id === cardId ? { ...c, atmEnabled: !c.atmEnabled } : c))
    );
  };

  const updateCardPin = (cardId: string, newPin: string) => {
    setCards(prev =>
      prev.map(c => (c.id === cardId ? { ...c, pin: newPin } : c))
    );
  };

  const applyForLoan = (amount: number, durationMonths: number, purpose: string) => {
    const apr = durationMonths <= 6 ? 4.5 : durationMonths <= 12 ? 5.2 : 6.0;
    const monthlyPayment = (amount * (1 + apr / 100)) / durationMonths;
    const newLoan: LoanItem = {
      id: 'loan-' + Date.now(),
      amount,
      durationMonths,
      apr,
      monthlyPayment,
      purpose,
      status: 'in_review',
      appliedDate: 'Hoy',
    };
    setLoans(prev => [newLoan, ...prev]);
    return newLoan;
  };

  const markNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const regenerateClabe = () => {
    const newClabe = generateValidClabe('846', '180');
    setUserClabe(newClabe);
    return newClabe;
  };

  const registerMid = (data: {
    businessName: string;
    legalName: string;
    rfc: string;
    mcc: string;
    mccCategory: string;
    channel: 'e_commerce' | 'pos_terminal' | 'payment_link' | 'recurrent';
    currency: 'MXN' | 'USD' | 'MULTI';
    settlementClabe: string;
    settlementCycle: 'T+0' | 'T+1' | 'T+2';
    discountRatePct: number;
    fixedFee: number;
    monthlyVolumeLimit: number;
    webhookUrl?: string;
    terminalId?: string;
  }): MidItem => {
    const newMidNumber = generateProductionMid('846');
    const apiKeys = generateProductionApiKeys(data.businessName);
    const newMid: MidItem = {
      id: 'mid-prod-' + Date.now(),
      midNumber: newMidNumber,
      businessName: data.businessName,
      legalName: data.legalName.toUpperCase(),
      rfc: data.rfc.toUpperCase(),
      mcc: data.mcc,
      mccCategory: data.mccCategory,
      channel: data.channel,
      environment: 'production',
      status: 'active',
      currency: data.currency,
      settlementClabe: data.settlementClabe,
      settlementCycle: data.settlementCycle,
      discountRatePct: data.discountRatePct,
      fixedFee: data.fixedFee,
      monthlyVolumeLimit: data.monthlyVolumeLimit,
      currentVolume: 0,
      transactionsCount: 0,
      livePublicKey: apiKeys.publicKey,
      liveSecretKey: apiKeys.secretKey,
      webhookUrl: data.webhookUrl || '',
      terminalId: data.terminalId || `TID-${newMidNumber.slice(-3)}`,
      pciComplianceDate: new Date().toISOString().split('T')[0],
      createdAt: 'Hoy',
    };

    setMids(prev => [newMid, ...prev]);

    // Add notification
    const newNotif: NotificationItem = {
      id: 'notif-mid-' + Date.now(),
      title: 'MID en Producción Registrado',
      message: `Comercio ${newMid.businessName} afiliado con éxito con MID ${newMid.midNumber} en Modo Producción Live.`,
      time: 'Ahora',
      read: false,
      type: 'success',
    };
    setNotifications(prev => [newNotif, ...prev]);

    return newMid;
  };

  const toggleMidStatus = (midId: string) => {
    setMids(prev =>
      prev.map(m => {
        if (m.id === midId) {
          const nextStatus = m.status === 'active' ? 'paused' : 'active';
          return { ...m, status: nextStatus };
        }
        return m;
      })
    );
  };

  const simulateMidCharge = (midId: string, amount: number, concept: string) => {
    const targetMid = mids.find(m => m.id === midId);
    if (!targetMid) return { success: false, txId: '', netAmount: 0 };

    const discountFee = (amount * (targetMid.discountRatePct / 100)) + targetMid.fixedFee;
    const netAmount = Math.max(0, amount - discountFee);
    const trackingKey = generateSpeiTrackingKey();
    const txId = 'tx-mid-' + Date.now();

    // Update mid volume
    setMids(prev =>
      prev.map(m => {
        if (m.id === midId) {
          return {
            ...m,
            currentVolume: m.currentVolume + amount,
            transactionsCount: m.transactionsCount + 1,
          };
        }
        return m;
      })
    );

    // If settlement clabe belongs to user, credit user balance
    setBalance(prev => prev + netAmount);

    const newTx: TransactionItem = {
      id: txId,
      type: 'received',
      category: 'spei',
      title: `Venta MID ${targetMid.midNumber} - ${concept || targetMid.businessName}`,
      recipientOrSender: targetMid.businessName,
      date: 'Hoy, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      amount: netAmount,
      fee: discountFee,
      currency: targetMid.currency === 'MULTI' ? 'MXN' : targetMid.currency,
      status: 'completed',
      trackingKey,
      clabe: targetMid.settlementClabe,
    };
    setTransactions(prev => [newTx, ...prev]);

    const newNotif: NotificationItem = {
      id: 'notif-charge-' + Date.now(),
      title: `Cobro Aprobado MID ${targetMid.midNumber}`,
      message: `Procesamiento de $${amount.toFixed(2)} ${targetMid.currency} acreditado (Neto: $${netAmount.toFixed(2)}).`,
      time: 'Ahora',
      read: false,
      type: 'success',
    };
    setNotifications(prev => [newNotif, ...prev]);

    return { success: true, txId, netAmount };
  };

  const executeScheduledPayment = (id: string) => {
    const target = scheduledPayments.find(p => p.id === id);
    if (!target) return { success: false, trackingKey: '', error: 'Pago programado no encontrado.' };

    if (balance < target.amountUsdEquivalent) {
      return { 
        success: false, 
        trackingKey: '', 
        error: `Saldo insuficiente para liquidar 2,500 EUR ($${target.amountUsdEquivalent.toFixed(2)} USD). Saldo disponible: $${balance.toFixed(2)} USD.` 
      };
    }

    const trackingKey = 'SEPA-LU-' + Date.now().toString().slice(-8);

    // Deduct balance
    setBalance(prev => prev - target.amountUsdEquivalent);

    // Update scheduled payment stats
    setScheduledPayments(prev =>
      prev.map(p => {
        if (p.id === id) {
          return {
            ...p,
            totalExecutions: p.totalExecutions + 1,
            totalAmountEurPaid: p.totalAmountEurPaid + p.amountEur,
            lastExecutionDate: 'Hoy, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' (Liquidado SEPA)',
          };
        }
        return p;
      })
    );

    // Add completed transaction
    const newTx: TransactionItem = {
      id: 'tx-sepa-' + Date.now(),
      type: 'sent',
      category: 'international',
      title: `Pago Semanal SEPA Instant (${target.amountEur.toLocaleString('de-DE', { minimumFractionDigits: 2 })} EUR)`,
      recipientOrSender: `${target.recipientName} (${target.iban})`,
      date: 'Hoy, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      amount: target.amountUsdEquivalent,
      fee: 0,
      currency: 'USD',
      status: 'completed',
      trackingKey,
    };
    setTransactions(prev => [newTx, ...prev]);

    // Add notification
    const newNotif: NotificationItem = {
      id: 'notif-sepa-' + Date.now(),
      title: `Pago Semanal de ${target.amountEur.toLocaleString('de-DE')} EUR Liquidado`,
      message: `Se enviaron exitosamente 2,500.00 EUR a ${target.recipientName} en ${target.bankName} (${target.bankAddress}). Clave de rastreo: ${trackingKey}`,
      time: 'Ahora',
      read: false,
      type: 'success',
    };
    setNotifications(prev => [newNotif, ...prev]);

    return { success: true, trackingKey };
  };

  const toggleScheduledPaymentStatus = (id: string) => {
    setScheduledPayments(prev =>
      prev.map(p => {
        if (p.id === id) {
          const nextStatus = p.status === 'active' ? 'paused' : 'active';
          return { ...p, status: nextStatus };
        }
        return p;
      })
    );
  };

  const addScheduledPayment = (item: Omit<ScheduledPaymentItem, 'id' | 'createdAt' | 'totalExecutions' | 'totalAmountEurPaid'>) => {
    const newItem: ScheduledPaymentItem = {
      ...item,
      id: 'sched-' + Date.now(),
      createdAt: 'Hoy, ' + new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
      totalExecutions: 0,
      totalAmountEurPaid: 0,
    };
    setScheduledPayments(prev => [newItem, ...prev]);
    return newItem;
  };

  const updateMorseBeneficiary = (data: Partial<MorseBeneficiaryData>) => {
    setMorseBeneficiary(prev => ({ ...prev, ...data }));
    setNotifications(prev => [
      {
        id: 'notif-' + Date.now(),
        title: 'Beneficiario Morse Actualizado',
        message: 'Los datos de tu cuenta Morse (Routing / Checking) fueron guardados exitosamente como beneficiario externo.',
        time: 'Ahora',
        read: false,
        type: 'success',
      },
      ...prev,
    ]);
  };

  const sendMorseAchTransfer = (params: {
    amountUsd: number;
    memo?: string;
    destinationRegion: 'europe' | 'international';
  }) => {
    if (params.amountUsd <= 0) {
      return { success: false, trackingKey: '', error: 'El monto a transferir debe ser mayor a $0.00 USD.', creditedAmount: 0, creditedCurrency: 'USD' };
    }
    if (params.amountUsd > balance) {
      return { success: false, trackingKey: '', error: `Saldo insuficiente ($${balance.toFixed(2)} USD disponible, intentas enviar $${params.amountUsd.toFixed(2)} USD).`, creditedAmount: 0, creditedCurrency: 'USD' };
    }

    const isEurope = params.destinationRegion === 'europe';
    const creditedAmount = isEurope ? +(params.amountUsd / eurToUsdRate).toFixed(2) : params.amountUsd;
    const creditedCurrency = isEurope ? 'EUR' : 'USD';

    const trackingKey = generateAchTraceNumber();
    const now = new Date();
    const dateFormatted = 'Hoy, ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setBalance(prev => prev - params.amountUsd);

    const newTx: TransactionItem = {
      id: 'tx-ach-' + Date.now(),
      type: 'sent',
      category: 'morse',
      title: isEurope
        ? `Transferencia ACH a Morse (${creditedAmount.toFixed(2)} € Euros Digitales)`
        : `Transferencia ACH a Morse (${params.amountUsd.toFixed(2)} $ Dólares Digitales)`,
      recipientOrSender: `Morse (${morseBeneficiary.holderName} - Routing: ${morseBeneficiary.routingNumber})`,
      date: dateFormatted,
      timestamp: Date.now(),
      amount: params.amountUsd,
      fee: 0,
      currency: 'USD',
      status: 'completed',
      trackingKey,
      clabe: `ACH Routing: ${morseBeneficiary.routingNumber} | Acc: ••••${morseBeneficiary.accountNumber.slice(-4)} (${morseBeneficiary.accountType})`,
    };

    setTransactions(prev => [newTx, ...prev]);

    const notifMessage = isEurope
      ? `Transferencia ACH enviada exitosamente a tu cuenta Morse (${morseBeneficiary.bankName}). Se convertirán $${params.amountUsd.toFixed(2)} USD en aprox. €${creditedAmount.toFixed(2)} EUR en euros digitales. Folio: ${trackingKey}`
      : `Transferencia ACH enviada exitosamente a tu cuenta Morse (${morseBeneficiary.bankName}) por $${params.amountUsd.toFixed(2)} USD en dólares digitales. Folio: ${trackingKey}`;

    setNotifications(prev => [
      {
        id: 'notif-ach-' + Date.now(),
        title: 'Transferencia ACH a Morse Enviada',
        message: notifMessage,
        time: 'Ahora',
        read: false,
        type: 'success',
      },
      ...prev,
    ]);

    return {
      success: true,
      trackingKey,
      creditedAmount,
      creditedCurrency,
    };
  };

  const executePlus500Payment = (params: {
    amountMxn?: number;
    amountUsd?: number;
  }) => {
    let finalAmountMxn = params.amountMxn || 0;
    let finalAmountUsd = params.amountUsd || 0;

    if (finalAmountMxn > 0 && finalAmountUsd === 0) {
      finalAmountUsd = Number((finalAmountMxn / usdToMxnRate).toFixed(2));
    } else if (finalAmountUsd > 0 && finalAmountMxn === 0) {
      finalAmountMxn = Number((finalAmountUsd * usdToMxnRate).toFixed(2));
    }

    if (finalAmountUsd <= 0) {
      return { success: false, trackingKey: '', error: 'El importe del pago debe ser mayor a cero.' };
    }

    if (finalAmountUsd > balance) {
      return { 
        success: false, 
        trackingKey: '', 
        error: `Saldo insuficiente ($${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD disponible). Se requieren $${finalAmountUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD.` 
      };
    }

    const trackingKey = 'SWIFT-DE-' + Date.now().toString().slice(-9);
    const now = new Date();
    const dateFormatted = 'Hoy, ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setBalance(prev => prev - finalAmountUsd);

    const newTx: TransactionItem = {
      id: 'tx-plus500-' + Date.now(),
      type: 'sent',
      category: 'international',
      title: `Pago Internacional Plus500SEY Ltd (${finalAmountMxn.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN)`,
      recipientOrSender: 'Plus500SEY Ltd (Deutsche Bank AG)',
      date: dateFormatted,
      timestamp: Date.now(),
      amount: finalAmountUsd,
      fee: 0,
      currency: 'USD',
      status: 'completed',
      trackingKey,
      clabe: `IBAN: ${PLUS500_BENEFICIARY.iban} | BIC: ${PLUS500_BENEFICIARY.swiftBic} | Ref: ${PLUS500_BENEFICIARY.reference}`,
      reference: PLUS500_BENEFICIARY.reference,
      iban: PLUS500_BENEFICIARY.iban,
      bic: PLUS500_BENEFICIARY.swiftBic,
      bankName: PLUS500_BENEFICIARY.bankName,
      destinationCurrency: 'MXN',
      destinationAmount: finalAmountMxn,
    };

    setTransactions(prev => [newTx, ...prev]);

    setNotifications(prev => [
      {
        id: 'notif-plus500-' + Date.now(),
        title: 'Pago a Plus500SEY Ltd Liquidado',
        message: `Se transfirieron exitosamente $${finalAmountMxn.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN ($${finalAmountUsd.toFixed(2)} USD) a Deutsche Bank AG. Referencia obligatoria: ${PLUS500_BENEFICIARY.reference}. Folio SWIFT: ${trackingKey}`,
        time: 'Ahora',
        read: false,
        type: 'success',
      },
      ...prev,
    ]);

    return {
      success: true,
      trackingKey,
      tx: newTx,
    };
  };

  const executeMercadoPagoWithdrawal = async (params: {
    amountMxn?: number;
    amountUsd?: number;
    clabe?: string;
    recipientName?: string;
    concept?: string;
    rfc?: string;
  }) => {
    let finalAmountMxn = params.amountMxn || 0;
    let finalAmountUsd = params.amountUsd || 0;

    if (finalAmountMxn > 0 && finalAmountUsd === 0) {
      finalAmountUsd = Number((finalAmountMxn / usdToMxnRate).toFixed(2));
    } else if (finalAmountUsd > 0 && finalAmountMxn === 0) {
      finalAmountMxn = Number((finalAmountUsd * usdToMxnRate).toFixed(2));
    }

    if (finalAmountUsd <= 0) {
      return { success: false, trackingKey: '', error: 'El monto a retirar debe ser mayor a cero.' };
    }

    if (finalAmountUsd > balance) {
      return {
        success: false,
        trackingKey: '',
        error: `Saldo insuficiente ($${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD disponible). Se requieren $${finalAmountUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD ($${finalAmountMxn.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN).`,
      };
    }

    const targetClabe = params.clabe || userClabe;

    try {
      const res = await fetch('/api/mercadopago/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountMxn: finalAmountMxn,
          amountUsd: finalAmountUsd,
          clabe: targetClabe,
          recipientName: params.recipientName || userName,
          concept: params.concept || `Retiro SPEI a CLABE ${targetClabe}`,
          rfc: params.rfc || 'XAXX010101000',
          email: userEmail,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        return {
          success: false,
          trackingKey: '',
          error: data.error || data.message || 'Error al procesar el retiro en Mercado Pago.',
        };
      }

      // Deduct balance upon successful withdrawal
      setBalance(prev => +(prev - finalAmountUsd).toFixed(2));

      const now = new Date();
      const dateFormatted = 'Hoy, ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const bankLabel = data.bankName || 'Banco Nacional SPEI';

      const newTx: TransactionItem = {
        id: 'tx-mp-' + Date.now(),
        type: 'sent',
        category: 'spei',
        title: `Retiro SPEI a CLABE - Mercado Pago (${finalAmountMxn.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN)`,
        recipientOrSender: `${params.recipientName || userName} (${bankLabel} - ••••${targetClabe.slice(-4)})`,
        date: dateFormatted,
        timestamp: Date.now(),
        amount: finalAmountUsd,
        fee: 0,
        currency: 'USD',
        status: 'completed',
        trackingKey: data.trackingKey,
        clabe: targetClabe,
        bankName: bankLabel,
        reference: data.mercadoPagoPaymentId || data.authorizationCode,
        destinationCurrency: 'MXN',
        destinationAmount: finalAmountMxn,
      };

      setTransactions(prev => [newTx, ...prev]);

      setNotifications(prev => [
        {
          id: 'notif-mp-withdraw-' + Date.now(),
          title: 'Retiro Mercado Pago Liquidado',
          message: `Se enviaron exitosamente $${finalAmountMxn.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN a la cuenta CLABE ${targetClabe} (${bankLabel}) mediante tu cuenta Mercado Pago. Folio: ${data.trackingKey}`,
          time: 'Ahora',
          read: false,
          type: 'success',
        },
        ...prev,
      ]);

      return {
        success: true,
        trackingKey: data.trackingKey,
        mpPaymentId: data.mercadoPagoPaymentId,
        mode: data.mode,
        tx: newTx,
      };
    } catch (fetchErr: any) {
      return {
        success: false,
        trackingKey: '',
        error: fetchErr.message || 'Error de red al conectar con el servicio de Mercado Pago.',
      };
    }
  };

  return (
    <BankingContext.Provider
      value={{
        balance,
        userClabe,
        userAccount,
        userName,
        userEmail,
        userPhone,
        cryptoBtc,
        cryptoEth,
        cryptoUsdt,
        cryptoSol,
        btcPrice,
        cryptoPrices,
        cards,
        transactions,
        notifications,
        loans,
        mids,
        morseBeneficiary,
        activeOtp,
        generateNewOtp,
        verifyOtp,
        sendTransfer,
        sendCryptoTransfer,
        depositFunds,
        tradeCrypto,
        addCard,
        toggleCardFreeze,
        toggleCardOnline,
        toggleCardAtm,
        updateCardPin,
        applyForLoan,
        registerMid,
        toggleMidStatus,
        simulateMidCharge,
        markNotificationsAsRead,
        regenerateClabe,
        scheduledPayments,
        eurToUsdRate,
        executeScheduledPayment,
        toggleScheduledPaymentStatus,
        addScheduledPayment,
        updateMorseBeneficiary,
        sendMorseAchTransfer,
        usdToMxnRate,
        executePlus500Payment,
        executeMercadoPagoWithdrawal,
        isAccountBlocked,
        users,
        activeUserId,
        securityConfig,
        emailLogs,
        adminCreditAccount,
        adminDebitAccount,
        adminToggleAccountBlock,
        adminApproveTransfer,
        adminRejectTransfer,
        updateSecurityConfig,
        registerNewUser,
        switchUser,
        triggerManualEmailNotification,
      }}
    >
      {children}
    </BankingContext.Provider>
  );
}

export function useBanking() {
  const context = useContext(BankingContext);
  if (!context) {
    throw new Error('useBanking must be used within a BankingProvider');
  }
  return context;
}
