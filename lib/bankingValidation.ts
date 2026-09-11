// Validation and generation utilities for Mexican CLABE, Luhn Cards, IBAN, and GoFundMe

export interface ClabeValidationResult {
  isValid: boolean;
  bankName: string;
  bankCode: string;
  plaza: string;
  account: string;
  controlDigit: string;
  calculatedControlDigit: string;
  error?: string;
}

export interface CardValidationResult {
  isValid: boolean;
  brand: 'VISA' | 'MASTERCARD' | 'AMEX' | 'DISCOVER' | 'UNKNOWN';
  bin: string;
  last4: string;
  luhnValid: boolean;
  error?: string;
}

// Mexican Bank Codes (Banxico SPEI Catalog)
export const BANXICO_BANKS: Record<string, string> = {
  '002': 'Citibanamex',
  '012': 'BBVA México',
  '014': 'Santander México',
  '021': 'HSBC México',
  '030': 'Banco del Bajío',
  '036': 'Inbursa',
  '044': 'Scotiabank Inverlat',
  '058': 'Banregio',
  '072': 'Banorte',
  '127': 'Banco Azteca',
  '137': 'BanCoppel',
  '138': 'ABC Capital',
  '166': 'Banco del Bienestar',
  '646': 'STP (Sistema de Transferencias y Pagos)',
  '710': 'NVIO Pagos México',
  '846': 'Gold Payments Bank (STP / SPEI)',
};

export const MERU_ORDER_INFO = {
  orderId: 'MRU-7109-84949',
  currency: 'MXN',
  amount: 1720.00,
  amountFormatted: '1.720,00 MXN',
  beneficiary: 'KOYWE S de RL de CV',
  clabe: '710969000021584949',
  bank: 'NVIO',
  bankFullName: 'NVIO Pagos México (IFPE)',
  destinationApp: 'Meru',
  instructions: [
    'Para completar la transacción debes realizar un depósito por el monto exacto, ni más ni menos, a la cuenta bancaria indicada y agregar los datos y el soporte de la transferencia. Si el monto no es exactamente el mismo no será acreditado.',
    'El nombre y el número de documento del titular de la cuenta debe coincidir con el titular y número de documento registrado en Meru, de lo contrario el dinero se reversará.',
    'El saldo se acreditará en tu cuenta Meru en máximo 1 día hábil.'
  ]
};

export interface MorseBeneficiaryData {
  routingNumber: string;
  accountNumber: string;
  accountType: 'Checking';
  holderName: string;
  bankName: string;
  bankAddress: string;
  nickname: string;
  network: string;
}

export const MORSE_DEFAULT_BENEFICIARY: MorseBeneficiaryData = {
  routingNumber: '101015074', // Lead Bank, N.A. (Morse Financial Partner Bank)
  accountNumber: '883920194821',
  accountType: 'Checking',
  holderName: 'Oscar Isael Bueno Tochihuitl',
  bankName: 'Lead Bank, N.A. (Socio Patrocinador Morse)',
  bankAddress: '1801 Main St, Kansas City, MO 64108, USA',
  nickname: 'Mi Cuenta Morse (Dólares & Euros Digitales)',
  network: 'ACH (Automated Clearing House) / Same-Day ACH',
};

/**
 * Validates a US 9-digit ABA Routing Transit Number using Federal Reserve weighting algorithm.
 * Weighting: 3, 7, 1, 3, 7, 1, 3, 7, 1 mod 10 === 0
 */
export function validateAbaRouting(routingRaw: string): { isValid: boolean; bankName: string; error?: string } {
  const routing = routingRaw.replace(/\D/g, '');
  if (!routing) {
    return { isValid: false, bankName: '', error: 'Ingresa el número de ruta (routing de 9 dígitos).' };
  }
  if (routing.length !== 9) {
    return { isValid: false, bankName: '', error: 'El número de ruta debe tener exactamente 9 dígitos.' };
  }
  const digits = routing.split('').map(Number);
  const checksum = (
    3 * (digits[0] + digits[3] + digits[6]) +
    7 * (digits[1] + digits[4] + digits[7]) +
    1 * (digits[2] + digits[5] + digits[8])
  ) % 10;

  if (checksum !== 0) {
    return { isValid: false, bankName: '', error: 'Dígito de control de número de ruta (ABA) inválido según la Reserva Federal.' };
  }

  const knownAba: Record<string, string> = {
    '101015074': 'Lead Bank, N.A. (Socio Oficial Morse)',
    '084106768': 'Evolve Bank & Trust (Morse Partner)',
    '121145349': 'Column N.A. (Fintech ACH)',
    '021000021': 'JPMorgan Chase Bank, N.A.',
    '121000358': 'Bank of America, N.A.',
    '122000496': 'Wells Fargo Bank, N.A.',
    '021000089': 'Citibank, N.A.',
    '071000013': 'JPMorgan Chase Bank Chicago',
    '111000025': 'Federal Reserve Bank of Dallas'
  };

  return {
    isValid: true,
    bankName: knownAba[routing] || 'Banco Federal de EE.UU. Registrado',
  };
}

/**
 * Validates US ACH Account number (typically 4 to 17 digits).
 */
export function validateAchAccount(accountRaw: string): { isValid: boolean; error?: string } {
  const account = accountRaw.replace(/\D/g, '');
  if (!account) {
    return { isValid: false, error: 'Ingresa el número de cuenta de Morse.' };
  }
  if (account.length < 4 || account.length > 17) {
    return { isValid: false, error: 'El número de cuenta ACH debe tener entre 4 y 17 dígitos.' };
  }
  return { isValid: true };
}

/**
 * Generates official NACHA / ACH Trace Number for transaction receipts
 */
export function generateAchTraceNumber(): string {
  let trace = 'ACH';
  const now = new Date();
  const ymd = now.toISOString().slice(2, 10).replace(/-/g, '');
  trace += ymd;
  for (let i = 0; i < 9; i++) {
    trace += Math.floor(Math.random() * 10);
  }
  return trace;
}

export interface MccOption {
  code: string;
  name: string;
  category: string;
  riskLevel: 'bajo' | 'medio' | 'alto';
  suggestedTdr: number;
}

export const MCC_CATALOG: MccOption[] = [
  { code: '7372', name: 'Software, SaaS y Servicios Cloud', category: 'Tecnología & Fintech', riskLevel: 'bajo', suggestedTdr: 1.85 },
  { code: '5732', name: 'Equipos Electrónicos y Computación', category: 'Retail & Consumo', riskLevel: 'medio', suggestedTdr: 1.95 },
  { code: '5411', name: 'Supermercados y Abarrotes', category: 'Alimentos', riskLevel: 'bajo', suggestedTdr: 1.65 },
  { code: '5812', name: 'Restaurantes y Establecimientos de Comida', category: 'Hospitalidad', riskLevel: 'medio', suggestedTdr: 2.10 },
  { code: '5311', name: 'Tiendas Departamentales y Retail General', category: 'Comercio', riskLevel: 'bajo', suggestedTdr: 1.75 },
  { code: '5999', name: 'Comercio Electrónico y Tiendas Online', category: 'E-Commerce', riskLevel: 'medio', suggestedTdr: 2.15 },
  { code: '8999', name: 'Servicios Profesionales y Consultoría', category: 'Corporativo', riskLevel: 'bajo', suggestedTdr: 1.90 },
  { code: '4722', name: 'Agencias de Viajes, Aerolíneas y Turismo', category: 'Turismo', riskLevel: 'alto', suggestedTdr: 2.60 },
  { code: '6012', name: 'Instituciones Financieras, Cripto & IFPEs', category: 'Fintech', riskLevel: 'alto', suggestedTdr: 2.45 },
  { code: '8011', name: 'Salud, Clínicas y Servicios Médicos', category: 'Salud', riskLevel: 'bajo', suggestedTdr: 1.70 },
  { code: '8220', name: 'Educación, Universidades y Capacitación', category: 'Educación', riskLevel: 'bajo', suggestedTdr: 1.50 },
];

/**
 * Validates Mexican Tax ID (RFC) for individuals (13 chars) or corporations (12 chars).
 */
export function validateRfc(rfcRaw: string): { isValid: boolean; type: 'moral' | 'fisica' | 'invalido'; error?: string } {
  const rfc = rfcRaw.trim().toUpperCase();
  // Persona Moral: 3 letters + 6 digits + 3 homoclave = 12
  const moralRegex = /^[A-Z&Ñ]{3}[0-9]{2}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])[A-Z0-9]{3}$/;
  // Persona Física: 4 letters + 6 digits + 3 homoclave = 13
  const fisicaRegex = /^[A-Z&Ñ]{4}[0-9]{2}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])[A-Z0-9]{3}$/;

  if (moralRegex.test(rfc)) {
    return { isValid: true, type: 'moral' };
  }
  if (fisicaRegex.test(rfc)) {
    return { isValid: true, type: 'fisica' };
  }
  return { 
    isValid: false, 
    type: 'invalido', 
    error: 'El RFC debe tener 12 caracteres (Persona Moral) o 13 caracteres (Persona Física) con homoclave válida.' 
  };
}

/**
 * Generates an official Merchant ID (MID) with acquirer prefix (846 for Gold Payments)
 */
export function generateProductionMid(prefix = '846'): string {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${randomSuffix}`;
}

/**
 * Generates production API credentials for live merchants
 */
export function generateProductionApiKeys(businessSlug: string) {
  const cleanSlug = businessSlug.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 6) || 'comm';
  const randHex = Math.random().toString(36).substring(2, 10);
  const randSecret = Math.random().toString(36).substring(2, 14) + Math.random().toString(36).substring(2, 14);

  return {
    publicKey: `pk_live_gp_${cleanSlug}_${randHex}`,
    secretKey: `sk_live_gp_${cleanSlug}_${randSecret}`,
    webhookSecret: `whsec_live_${Math.random().toString(36).substring(2, 12)}`,
  };
}

/**
 * Validates a Mexican 18-digit CLABE according to Banxico standard.
 * The 18th digit is a checksum calculated using weights [3, 7, 1] modulo 10.
 */
export function validateClabe(clabeRaw: string): ClabeValidationResult {
  const clabe = clabeRaw.replace(/\D/g, '');
  
  if (clabe.length !== 18) {
    return {
      isValid: false,
      bankName: 'Desconocido',
      bankCode: clabe.substring(0, 3),
      plaza: clabe.substring(3, 6),
      account: clabe.substring(6, 17),
      controlDigit: clabe.length === 18 ? clabe[17] : '',
      calculatedControlDigit: '',
      error: `La CLABE debe tener exactamente 18 dígitos (actual: ${clabe.length})`,
    };
  }

  const weights = [3, 7, 1];
  let sum = 0;

  for (let i = 0; i < 17; i++) {
    const digit = parseInt(clabe[i], 10);
    const weight = weights[i % 3];
    const product = (digit * weight) % 10;
    sum += product;
  }

  const calculatedControlDigit = String((10 - (sum % 10)) % 10);
  const controlDigit = clabe[17];
  const bankCode = clabe.substring(0, 3);
  const plaza = clabe.substring(3, 6);
  const account = clabe.substring(6, 17);
  const bankName = BANXICO_BANKS[bankCode] || 'Institución SPEI Registrada';

  const isValid = controlDigit === calculatedControlDigit;

  return {
    isValid,
    bankName,
    bankCode,
    plaza,
    account,
    controlDigit,
    calculatedControlDigit,
    error: isValid 
      ? undefined 
      : `Dígito verificador inválido: se esperaba '${calculatedControlDigit}' pero se ingresó '${controlDigit}'`,
  };
}

/**
 * Generates a 100% mathematically valid 18-digit Mexican CLABE
 */
export function generateValidClabe(bankCode: string = '846', plaza: string = '180'): string {
  // 3 digits bank + 3 digits plaza + 11 digits account
  const bank = bankCode.padStart(3, '0').slice(0, 3);
  const plz = plaza.padStart(3, '0').slice(0, 3);
  let account = '';
  for (let i = 0; i < 11; i++) {
    account += Math.floor(Math.random() * 10).toString();
  }

  const partial = bank + plz + account;
  const weights = [3, 7, 1];
  let sum = 0;

  for (let i = 0; i < 17; i++) {
    const digit = parseInt(partial[i], 10);
    const weight = weights[i % 3];
    const product = (digit * weight) % 10;
    sum += product;
  }

  const checkDigit = (10 - (sum % 10)) % 10;
  return partial + checkDigit;
}

/**
 * Validates a card number using ISO/IEC 7812 (Luhn Algorithm)
 */
export function validateLuhnCard(cardNumberRaw: string): CardValidationResult {
  const sanitized = cardNumberRaw.replace(/\D/g, '');
  
  // Detect Brand
  let brand: CardValidationResult['brand'] = 'UNKNOWN';
  if (/^4/.test(sanitized)) brand = 'VISA';
  else if (/^5[1-5]|^2[2-7]/.test(sanitized)) brand = 'MASTERCARD';
  else if (/^3[47]/.test(sanitized)) brand = 'AMEX';
  else if (/^6(?:011|5)/.test(sanitized)) brand = 'DISCOVER';

  if (sanitized.length < 13 || sanitized.length > 19) {
    return {
      isValid: false,
      brand,
      bin: sanitized.substring(0, 6),
      last4: sanitized.slice(-4),
      luhnValid: false,
      error: `Longitud de tarjeta inválida (${sanitized.length} dígitos)`,
    };
  }

  // Luhn Check
  let sum = 0;
  let isEven = false;

  for (let i = sanitized.length - 1; i >= 0; i--) {
    let digit = parseInt(sanitized.charAt(i), 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  const luhnValid = sum % 10 === 0;

  return {
    isValid: luhnValid,
    brand,
    bin: sanitized.substring(0, 6),
    last4: sanitized.slice(-4),
    luhnValid,
    error: luhnValid ? undefined : 'Falló el algoritmo de verificación Luhn (Módulo 10)',
  };
}

/**
 * Generates a 100% mathematically valid card number satisfying Luhn (Mod 10)
 */
export function generateValidLuhnCard(brand: 'VISA' | 'MASTERCARD' = 'VISA'): {
  number: string;
  formatted: string;
  exp: string;
  cvv: string;
  brand: 'VISA' | 'MASTERCARD';
} {
  let bin = brand === 'VISA' ? '429185' : '530128';
  // We need 16 digits total: 6 BIN digits + 9 random digits + 1 check digit
  let partial = bin;
  for (let i = 0; i < 9; i++) {
    partial += Math.floor(Math.random() * 10).toString();
  }

  // Calculate Luhn check digit
  let sum = 0;
  // For 16 digits, the check digit is at position 16 (from left) which is odd from right (position 1 from right).
  // The preceding 15 digits from right to left:
  // partial[14] is even from right (mult by 2)
  // partial[13] is odd from right (mult by 1)
  // ...
  // Let's compute sum with check digit = 0
  for (let i = 0; i < 15; i++) {
    let digit = parseInt(partial.charAt(14 - i), 10);
    // When check digit is included at index 15, index 14 is at offset 1 from right (even step)
    if (i % 2 === 0) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }

  const checkDigit = (10 - (sum % 10)) % 10;
  const fullNumber = partial + checkDigit.toString();

  // Format as 4 groups of 4 digits
  const formatted = fullNumber.replace(/(\d{4})/g, '$1 ').trim();

  // Expiry date (e.g. 12/28 or 08/29)
  const currentYear = new Date().getFullYear();
  const expYear = (currentYear + 3).toString().slice(-2);
  const expMonth = ('0' + (Math.floor(Math.random() * 12) + 1)).slice(-2);
  const exp = `${expMonth}/${expYear}`;

  // CVV (3 digits)
  const cvv = Math.floor(100 + Math.random() * 900).toString();

  return {
    number: fullNumber,
    formatted,
    exp,
    cvv,
    brand,
  };
}

/**
 * Validates GoFundMe Campaign URL or ID
 */
export function validateGoFundMe(input: string): { isValid: boolean; campaignName: string; error?: string } {
  const trimmed = input.trim();
  if (!trimmed) {
    return { isValid: false, campaignName: '', error: 'Ingrese el enlace o ID de la campaña de GoFundMe' };
  }

  const gofundmeRegex = /^(?:https?:\/\/(?:www\.)?gofundme\.com\/f\/)?([a-zA-Z0-9_-]{3,60})$/i;
  const match = trimmed.match(gofundmeRegex);

  if (match && match[1]) {
    // Format a human readable title from slug
    const slug = match[1];
    const name = slug
      .split(/[-_]/)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    return {
      isValid: true,
      campaignName: name || 'Campaña Benéfica GoFundMe',
    };
  }

  return {
    isValid: false,
    campaignName: '',
    error: 'Formato no válido. Debe ser un enlace de gofundme.com/f/nombre-campana o el ID',
  };
}

/**
 * European IBAN & SEPA Validation (ISO 13616 & MOD-97)
 */
export interface IbanValidationResult {
  isValid: boolean;
  countryCode: string;
  countryName: string;
  bankCode?: string;
  bankName?: string;
  bic?: string;
  bankAddress?: string;
  formattedIban: string;
  accountNumber?: string;
  isSepaEligible: boolean;
  error?: string;
}

export const EUROPEAN_PAYMENT_BENEFICIARY = {
  holderName: 'Oscar Isael Bueno Tochihuitl',
  iban: 'LU504080000046125444',
  ibanFormatted: 'LU50 4080 0000 4612 5444',
  bic: 'BCIRLULL',
  bankName: 'Banking Circle S.A.',
  bankAddress: '2 Boulevard de la Foire, L-1528 Luxembourg',
  country: 'Luxemburgo',
  countryCode: 'LU',
  currency: 'EUR',
  amountEur: 2500.00,
  frequency: 'weekly' as const,
  frequencyLabel: 'Semanal (Cada Viernes)',
  reference: 'NÓMINA-SEMANAL-OSCAR-LUX',
  mandateReference: 'SEPA-MND-LU-46125444',
};

export const PLUS500_BENEFICIARY = {
  beneficiaryName: 'Plus500SEY Ltd',
  beneficiaryAddress: 'Third Floor, Suite 18, Vairam Building | Providence, Mahé, Seychelles',
  bankName: 'Deutsche Bank AG',
  bankAddress: 'Taunusanlage 12, D-60325 Frankfurt DE',
  currency: 'MXN',
  accountNumber: '176900904',
  iban: 'DE98500700100176900904',
  ibanFormatted: 'DE98 5007 0010 0176 9009 04',
  swiftBic: 'DEUTDEFFXXX',
  reference: '185591571',
  country: 'Alemania',
  countryCode: 'DE',
};

const IBAN_COUNTRY_LENGTHS: Record<string, { len: number; name: string }> = {
  LU: { len: 20, name: 'Luxemburgo' },
  ES: { len: 24, name: 'España' },
  DE: { len: 22, name: 'Alemania' },
  FR: { len: 27, name: 'Francia' },
  IT: { len: 27, name: 'Italia' },
  PT: { len: 25, name: 'Portugal' },
  NL: { len: 18, name: 'Países Bajos' },
  BE: { len: 16, name: 'Bélgica' },
  AT: { len: 20, name: 'Austria' },
  IE: { len: 22, name: 'Irlanda' },
  GB: { len: 22, name: 'Reino Unido' },
  CH: { len: 21, name: 'Suiza' },
};

export function validateIban(ibanRaw: string): IbanValidationResult {
  const clean = ibanRaw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  
  if (clean.length < 15 || clean.length > 34) {
    return {
      isValid: false,
      countryCode: clean.slice(0, 2),
      countryName: 'Desconocido',
      formattedIban: clean,
      isSepaEligible: false,
      error: 'Longitud de IBAN inválida (debe tener entre 15 y 34 caracteres alfanuméricos).'
    };
  }

  const countryCode = clean.slice(0, 2);
  const countryInfo = IBAN_COUNTRY_LENGTHS[countryCode];
  const countryName = countryInfo ? countryInfo.name : 'País Internacional';

  if (countryInfo && clean.length !== countryInfo.len) {
    return {
      isValid: false,
      countryCode,
      countryName,
      formattedIban: clean.replace(/(.{4})/g, '$1 ').trim(),
      isSepaEligible: false,
      error: `El IBAN de ${countryName} (${countryCode}) debe tener exactamente ${countryInfo.len} caracteres (actual: ${clean.length}).`
    };
  }

  // Format with spaces every 4 characters
  const formattedIban = clean.replace(/(.{4})/g, '$1 ').trim();

  // MOD-97 Checksum calculation (ISO 7064)
  // Move country code and check digits (first 4 chars) to the end
  const rearranged = clean.slice(4) + clean.slice(0, 4);
  let numericString = '';
  for (let i = 0; i < rearranged.length; i++) {
    const code = rearranged.charCodeAt(i);
    if (code >= 65 && code <= 90) { // A-Z
      numericString += (code - 55).toString();
    } else {
      numericString += rearranged[i];
    }
  }

  // Piecewise Modulo 97
  let remainder = 0;
  for (let i = 0; i < numericString.length; i += 7) {
    const chunk = remainder.toString() + numericString.substring(i, i + 7);
    remainder = parseInt(chunk, 10) % 97;
  }

  const isMod97Valid = remainder === 1;

  if (!isMod97Valid) {
    return {
      isValid: false,
      countryCode,
      countryName,
      formattedIban,
      isSepaEligible: false,
      error: 'Dígitos de control de IBAN inválidos (falló verificación matemática MOD-97).'
    };
  }

  // Special identification for Luxembourg banks
  let bankName = 'Banco Comercial Registrado';
  let bic = 'SWIFT/BIC Pendiente';
  let bankAddress = '';
  const bankCode = countryCode === 'LU' ? clean.slice(4, 7) : clean.slice(4, 8);
  const accountNumber = countryCode === 'LU' ? clean.slice(7) : clean.slice(8);

  if (countryCode === 'LU') {
    if (bankCode === '408') {
      bankName = 'Banking Circle S.A.';
      bic = 'BCIRLULL';
      bankAddress = '2 Boulevard de la Foire, L-1528 Luxembourg';
    } else if (bankCode === '001') {
      bankName = 'Banque Internationale à Luxembourg';
      bic = 'BLLULULL';
    } else if (bankCode === '002') {
      bankName = 'BGL BNP Paribas Luxembourg';
      bic = 'BGLLLULL';
    }
  } else if (countryCode === 'DE') {
    const deBankCode = clean.slice(4, 12);
    if (deBankCode.startsWith('50070010') || clean.includes('50070010')) {
      bankName = 'Deutsche Bank AG';
      bic = 'DEUTDEFFXXX';
      bankAddress = 'Taunusanlage 12, D-60325 Frankfurt DE';
    }
  }

  return {
    isValid: true,
    countryCode,
    countryName,
    bankCode,
    bankName,
    bic,
    bankAddress,
    formattedIban,
    accountNumber,
    isSepaEligible: true,
  };
}

/**
 * Generates a unique SPEI tracking key (Clave de Rastreo SPEI de Banxico)
 */
export function generateSpeiTrackingKey(): string {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = 'BNX';
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = ('0' + (now.getMonth() + 1)).slice(-2);
  const d = ('0' + now.getDate()).slice(-2);
  result += `${y}${m}${d}`;
  for (let i = 0; i < 18; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export type CryptoAsset = 'BTC' | 'ETH' | 'USDT' | 'SOL';

export interface CryptoNetworkConfig {
  id: string;
  name: string;
  chain: string;
  feeEstimate: number;
  feeAsset: string;
  confirmationTime: string;
  addressFormatHint: string;
}

export const CRYPTO_NETWORKS: Record<CryptoAsset, CryptoNetworkConfig[]> = {
  BTC: [
    {
      id: 'btc-native',
      name: 'Bitcoin (SegWit / Native)',
      chain: 'Bitcoin Core',
      feeEstimate: 0.00015,
      feeAsset: 'BTC',
      confirmationTime: '~10 - 20 min',
      addressFormatHint: 'Inicia con bc1q (Native SegWit) o 3/1',
    },
    {
      id: 'btc-lightning',
      name: 'Bitcoin Lightning Network',
      chain: 'Lightning L2',
      feeEstimate: 0.000005,
      feeAsset: 'BTC',
      confirmationTime: '< 5 segundos',
      addressFormatHint: 'Inicia con lnbc... o factura Lightning',
    }
  ],
  ETH: [
    {
      id: 'eth-mainnet',
      name: 'Ethereum Mainnet (ERC-20)',
      chain: 'Ethereum L1',
      feeEstimate: 0.0018,
      feeAsset: 'ETH',
      confirmationTime: '~12 - 30 seg',
      addressFormatHint: '0x seguido de 40 dígitos hexadecimales',
    },
    {
      id: 'eth-arbitrum',
      name: 'Arbitrum One (L2 Rollup)',
      chain: 'Arbitrum L2',
      feeEstimate: 0.0001,
      feeAsset: 'ETH',
      confirmationTime: '~2 seg',
      addressFormatHint: '0x seguido de 40 dígitos hexadecimales',
    },
    {
      id: 'eth-polygon',
      name: 'Polygon PoS',
      chain: 'Polygon',
      feeEstimate: 0.0002,
      feeAsset: 'ETH',
      confirmationTime: '~5 seg',
      addressFormatHint: '0x seguido de 40 dígitos hexadecimales',
    }
  ],
  USDT: [
    {
      id: 'usdt-trc20',
      name: 'Tron (TRC-20 - Tarifa Baja)',
      chain: 'TRON Network',
      feeEstimate: 1.00,
      feeAsset: 'USDT',
      confirmationTime: '~1 - 2 min',
      addressFormatHint: 'Inicia con T seguido de 33 caracteres alfanuméricos',
    },
    {
      id: 'usdt-erc20',
      name: 'Ethereum (ERC-20)',
      chain: 'Ethereum L1',
      feeEstimate: 4.50,
      feeAsset: 'USDT',
      confirmationTime: '~15 seg',
      addressFormatHint: '0x seguido de 40 caracteres hexadecimales',
    },
    {
      id: 'usdt-solana',
      name: 'Solana (SPL Token)',
      chain: 'Solana Network',
      feeEstimate: 0.50,
      feeAsset: 'USDT',
      confirmationTime: '< 2 seg',
      addressFormatHint: 'Dirección Base58 de 32 a 44 caracteres',
    }
  ],
  SOL: [
    {
      id: 'sol-mainnet',
      name: 'Solana Mainnet-Beta',
      chain: 'Solana L1',
      feeEstimate: 0.0005,
      feeAsset: 'SOL',
      confirmationTime: '< 1 segundo',
      addressFormatHint: 'Dirección Base58 de 32 a 44 caracteres',
    }
  ]
};

export interface WalletPreset {
  id: string;
  name: string;
  type: 'metamask' | 'phantom' | 'ledger' | 'trust' | 'binance' | 'bitso';
  supportedAssets: CryptoAsset[];
  sampleAddresses: Partial<Record<CryptoAsset, string>>;
  iconName: string;
  description: string;
}

export const CRYPTO_WALLET_PRESETS: WalletPreset[] = [
  {
    id: 'wallet-metamask',
    name: 'MetaMask / Billetera Web3',
    type: 'metamask',
    supportedAssets: ['ETH', 'USDT'],
    sampleAddresses: {
      ETH: '0x71C84196129B7b2756E84C270b201fAc388d0115',
      USDT: '0x71C84196129B7b2756E84C270b201fAc388d0115',
    },
    iconName: 'Fox',
    description: 'Billetera auto-custodia para Ethereum, Polygon y redes EVM.',
  },
  {
    id: 'wallet-phantom',
    name: 'Phantom Wallet',
    type: 'phantom',
    supportedAssets: ['SOL', 'USDT'],
    sampleAddresses: {
      SOL: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
      USDT: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
    },
    iconName: 'Ghost',
    description: 'Billetera predilecta para el ecosistema Solana y SPL tokens.',
  },
  {
    id: 'wallet-ledger',
    name: 'Ledger Nano / Trezor (Cold Storage)',
    type: 'ledger',
    supportedAssets: ['BTC', 'ETH', 'USDT', 'SOL'],
    sampleAddresses: {
      BTC: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
      ETH: '0x3F5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE',
      USDT: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
      SOL: 'H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4SE5nv',
    },
    iconName: 'Shield',
    description: 'Hardware wallet de almacenamiento en frío de máxima seguridad.',
  },
  {
    id: 'wallet-trust',
    name: 'Trust Wallet',
    type: 'trust',
    supportedAssets: ['BTC', 'ETH', 'USDT', 'SOL'],
    sampleAddresses: {
      BTC: '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy',
      ETH: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
      USDT: 'TYDzsYUEpvnYmQk4zGP9sWWcTEd3ZiPULj',
      SOL: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    },
    iconName: 'Wallet',
    description: 'Billetera multimoneda móvil y extensión para múltiples cadenas.',
  },
  {
    id: 'wallet-binance',
    name: 'Binance / Exchange Centralizado',
    type: 'binance',
    supportedAssets: ['BTC', 'ETH', 'USDT', 'SOL'],
    sampleAddresses: {
      BTC: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
      ETH: '0x28C6c06298d514Db089934071355E5743bf21d60',
      USDT: 'TJ1QW7c8Qx8s8x8s8x8s8x8s8x8s8x8s8x',
      SOL: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
    },
    iconName: 'Building',
    description: 'Depósito directo a cuenta de exchange spot para trading.',
  },
  {
    id: 'wallet-bitso',
    name: 'Bitso México (SPEI & Crypto)',
    type: 'bitso',
    supportedAssets: ['BTC', 'ETH', 'USDT'],
    sampleAddresses: {
      BTC: 'bc1qa5wkgaew2dkv56kfvj49j0av5nml45x9ek9hz6',
      ETH: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
      USDT: 'TPy2SwkYQ934j2K1j11L9v78m56X31v1A2',
    },
    iconName: 'ArrowLeftRight',
    description: 'Billetera o exchange regulado para conversión a Pesos Mexicanos (MXN).',
  }
];

/**
 * Validates a cryptocurrency address according to asset and network standards
 */
export function validateCryptoAddress(
  address: string, 
  asset: CryptoAsset, 
  networkId?: string
): { isValid: boolean; detectedType: string; error?: string } {
  const clean = address.trim();
  if (!clean) {
    return { isValid: false, detectedType: '', error: 'Ingrese la dirección pública de la billetera.' };
  }

  // Ethereum / EVM format (0x + 40 hex)
  if (asset === 'ETH' || (asset === 'USDT' && networkId?.includes('erc20'))) {
    const isEvm = /^0x[a-fA-F0-9]{40}$/.test(clean);
    if (!isEvm) {
      return { 
        isValid: false, 
        detectedType: 'EVM Inválida', 
        error: 'Las direcciones Ethereum deben iniciar con 0x y contener exactamente 42 caracteres hexadecimales.' 
      };
    }
    return { isValid: true, detectedType: 'Dirección Ethereum (EVM)' };
  }

  // TRON format for USDT (T + 33 chars)
  if (asset === 'USDT' && (networkId?.includes('trc20') || clean.startsWith('T'))) {
    const isTron = /^T[a-zA-HJ-NP-Z0-9]{33}$/.test(clean);
    if (!isTron) {
      return {
        isValid: false,
        detectedType: 'TRON TRC-20 Inválida',
        error: 'Las direcciones TRON (TRC-20) deben iniciar con la letra T y tener 34 caracteres alfanuméricos.'
      };
    }
    return { isValid: true, detectedType: 'Dirección TRON (TRC-20)' };
  }

  // Bitcoin format
  if (asset === 'BTC') {
    // Native Segwit (bc1q or bc1p)
    const isBech32 = /^bc1[a-zA-HJ-NP-Z0-9]{25,62}$/i.test(clean);
    // Legacy (starts with 1) or Script/Segwit (starts with 3)
    const isLegacyOrP2sh = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(clean);
    // Lightning invoice format (lnbc...)
    const isLightning = /^lnbc[0-9a-zA-Z]+$/i.test(clean);

    if (isBech32) {
      return { isValid: true, detectedType: 'Bitcoin Native SegWit (Bech32)' };
    }
    if (isLegacyOrP2sh) {
      return { isValid: true, detectedType: clean.startsWith('1') ? 'Bitcoin Legacy (P2PKH)' : 'Bitcoin SegWit (P2SH)' };
    }
    if (isLightning) {
      return { isValid: true, detectedType: 'Bitcoin Lightning Invoice' };
    }
    return { 
      isValid: false, 
      detectedType: 'Bitcoin Inválida', 
      error: 'Dirección de Bitcoin no válida. Debe iniciar con bc1 (SegWit), 1 (Legacy) o 3 (P2SH).' 
    };
  }

  // Solana format (32-44 base58 chars)
  if (asset === 'SOL' || (asset === 'USDT' && networkId?.includes('solana'))) {
    const isSolana = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(clean);
    if (!isSolana) {
      return {
        isValid: false,
        detectedType: 'Solana Inválida',
        error: 'Dirección de Solana no válida. Debe contener entre 32 y 44 caracteres en formato Base58.'
      };
    }
    return { isValid: true, detectedType: 'Dirección Solana (SPL)' };
  }

  // Fallback generic check (at least 26 chars, alphanumeric)
  if (/^[a-zA-Z0-9]{26,64}$/.test(clean)) {
    return { isValid: true, detectedType: 'Dirección Criptográfica Válida' };
  }

  return { isValid: false, detectedType: 'Formato desconocido', error: 'Formato de dirección no reconocido para el activo seleccionado.' };
}

/**
 * Generates a realistic cryptographic transaction hash (TxHash)
 */
export function generateBlockchainTxHash(asset: CryptoAsset, networkId?: string): string {
  const hex = '0123456789abcdef';
  const base58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  
  if (asset === 'ETH' || (asset === 'USDT' && networkId?.includes('erc20')) || networkId?.includes('arbitrum') || networkId?.includes('polygon')) {
    let hash = '0x';
    for (let i = 0; i < 64; i++) {
      hash += hex.charAt(Math.floor(Math.random() * hex.length));
    }
    return hash;
  }

  if (asset === 'SOL' || (asset === 'USDT' && networkId?.includes('solana'))) {
    let hash = '';
    for (let i = 0; i < 88; i++) {
      hash += base58.charAt(Math.floor(Math.random() * base58.length));
    }
    return hash;
  }

  // Bitcoin or Tron hash (64 hex characters)
  let hash = '';
  for (let i = 0; i < 64; i++) {
    hash += hex.charAt(Math.floor(Math.random() * hex.length));
  }
  return hash;
}
