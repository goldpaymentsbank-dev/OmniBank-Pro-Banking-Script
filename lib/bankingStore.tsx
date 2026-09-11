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

interface BankingContextType {
  balance: number;
  userClabe: string;
  userAccount: string;
  userName: string;
  userEmail: string;
  userPhone: string;
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

export function BankingProvider({ children }: { children: React.ReactNode }) {
  // Initialize state with mathematically valid values
  const [balance, setBalance] = useState<number>(21540.50);
  const [userClabe, setUserClabe] = useState<string>(INITIAL_CLABE);
  const [userAccount] = useState<string>('GP-8492-9102');
  const [userName, setUserName] = useState<string>('John Doe');
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

  // Generate valid initial cards with 100% Luhn compliant numbers
  const [cards, setCards] = useState<CardItem[]>(INITIAL_CARDS);
  const [scheduledPayments, setScheduledPayments] = useState<ScheduledPaymentItem[]>(INITIAL_SCHEDULED_PAYMENTS);
  const [eurToUsdRate] = useState<number>(1.085);
  const [usdToMxnRate] = useState<number>(20.25);
  const [morseBeneficiary, setMorseBeneficiary] = useState<MorseBeneficiaryData>(MORSE_DEFAULT_BENEFICIARY);

  const [transactions, setTransactions] = useState<TransactionItem[]>([
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

  // Process a transfer with real balance deduction and transaction record
  const sendTransfer = (details: {
    type: 'internal' | 'spei' | 'gofundme' | 'international' | 'card' | 'morse' | 'ach';
    recipient: string;
    amount: number;
    fee: number;
    title: string;
    clabe?: string;
    cardLast4?: string;
  }) => {
    const totalRequired = details.amount + details.fee;
    if (totalRequired > balance) {
      return { success: false, trackingKey: '', error: 'Saldo insuficiente en tu cuenta para cubrir la transferencia y comisión.' };
    }

    const trackingKey = generateSpeiTrackingKey();
    const now = new Date();
    const dateFormatted = 'Hoy, ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setBalance(prev => prev - totalRequired);

    const newTx: TransactionItem = {
      id: 'tx-' + Date.now(),
      type: 'sent',
      category: details.type,
      title: details.title,
      recipientOrSender: details.recipient,
      date: dateFormatted,
      timestamp: Date.now(),
      amount: details.amount,
      fee: details.fee,
      currency: 'USD',
      status: 'completed',
      trackingKey,
      clabe: details.clabe,
      cardLast4: details.cardLast4,
    };

    setTransactions(prev => [newTx, ...prev]);

    // Push notification
    const newNotif: NotificationItem = {
      id: 'notif-' + Date.now(),
      title: 'Transferencia Autorizada',
      message: `Has enviado $${details.amount.toFixed(2)} USD a ${details.recipient}. Folio: ${trackingKey}`,
      time: 'Ahora',
      read: false,
      type: 'success',
    };
    setNotifications(prev => [newNotif, ...prev]);

    return { success: true, trackingKey };
  };

  const depositFunds = (amount: number, method: string) => {
    setBalance(prev => prev + amount);
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
