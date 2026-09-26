export interface SwiftBankRecord {
  swiftCode: string;
  bankName: string;
  country: string;
  countryCode: string;
  flag: string;
  city: string;
  branch: string;
  address: string;
  isHeadquarters: boolean;
  participantType: 'DIRECT' | 'CONNECTED';
}

export const SWIFT_DATABASE: SwiftBankRecord[] = [
  // España
  {
    swiftCode: 'BSCHESMMXXX',
    bankName: 'Banco Santander S.A.',
    country: 'España',
    countryCode: 'ES',
    flag: '🇪🇸',
    city: 'Madrid',
    branch: 'Oficina Central (XXX)',
    address: 'Paseo de Pereda 9-12, Santander / Boadilla del Monte, Madrid',
    isHeadquarters: true,
    participantType: 'DIRECT',
  },
  {
    swiftCode: 'BBVAESMMXXX',
    bankName: 'Banco Bilbao Vizcaya Argentaria (BBVA)',
    country: 'España',
    countryCode: 'ES',
    flag: '🇪🇸',
    city: 'Madrid',
    branch: 'Sede Central La Vela',
    address: 'Calle Azul 4, 28050 Madrid',
    isHeadquarters: true,
    participantType: 'DIRECT',
  },
  {
    swiftCode: 'CAIXESBBXXX',
    bankName: 'CaixaBank S.A.',
    country: 'España',
    countryCode: 'ES',
    flag: '🇪🇸',
    city: 'Valencia',
    branch: 'Sede Central Operativa',
    address: 'Calle Pintor Sorolla 2-4, 46002 Valencia',
    isHeadquarters: true,
    participantType: 'DIRECT',
  },
  {
    swiftCode: 'SABDESMMXXX',
    bankName: 'Banco Sabadell S.A.',
    country: 'España',
    countryCode: 'ES',
    flag: '🇪🇸',
    city: 'Alicante',
    branch: 'Oficina Corporativa Central',
    address: 'Avenida Óscar Esplá 37, 03007 Alicante',
    isHeadquarters: true,
    participantType: 'DIRECT',
  },
  {
    swiftCode: 'INGDESMMXXX',
    bankName: 'ING Bank N.V. Sucursal en España',
    country: 'España',
    countryCode: 'ES',
    flag: '🇪🇸',
    city: 'Madrid',
    branch: 'Sede España',
    address: 'Calle Vía de los Poblados 1F, 28033 Madrid',
    isHeadquarters: false,
    participantType: 'DIRECT',
  },

  // México
  {
    swiftCode: 'BNMXMXMMXXX',
    bankName: 'Citibanamex (Banco Nacional de México)',
    country: 'México',
    countryCode: 'MX',
    flag: '🇲🇽',
    city: 'Ciudad de México',
    branch: 'Oficina Central SPEI/SWIFT',
    address: 'Actuario Roberto Medellín 800, Santa Fe, 01210 CDMX',
    isHeadquarters: true,
    participantType: 'DIRECT',
  },
  {
    swiftCode: 'BBVAMXMMXXX',
    bankName: 'BBVA México S.A.',
    country: 'México',
    countryCode: 'MX',
    flag: '🇲🇽',
    city: 'Ciudad de México',
    branch: 'Torre BBVA Reforma Central',
    address: 'Avenida Paseo de la Reforma 510, Juárez, Cuauhtémoc, 06600 CDMX',
    isHeadquarters: true,
    participantType: 'DIRECT',
  },
  {
    swiftCode: 'BMSXMXMMXXX',
    bankName: 'Banco Santander México S.A.',
    country: 'México',
    countryCode: 'MX',
    flag: '🇲🇽',
    city: 'Ciudad de México',
    branch: 'Sede Corporativa Santa Fe',
    address: 'Prolongación Paseo de la Reforma 500, Lomas de Santa Fe, 01219 CDMX',
    isHeadquarters: true,
    participantType: 'DIRECT',
  },
  {
    swiftCode: 'BANXMXMMXXX',
    bankName: 'Banco de México (Banxico Central Bank)',
    country: 'México',
    countryCode: 'MX',
    flag: '🇲🇽',
    city: 'Ciudad de México',
    branch: 'Sistema de Pagos SPEI / Banxico',
    address: '5 de Mayo No. 2, Centro Histórico, 06059 CDMX',
    isHeadquarters: true,
    participantType: 'DIRECT',
  },
  {
    swiftCode: 'STPMMXMMXXX',
    bankName: 'Sistema de Transferencias y Pagos STP S.A. de C.V.',
    country: 'México',
    countryCode: 'MX',
    flag: '🇲🇽',
    city: 'Ciudad de México',
    branch: 'Cámara de Compensación SPEI',
    address: 'Insurgentes Sur 1602, Crédito Constructor, 03940 CDMX',
    isHeadquarters: true,
    participantType: 'DIRECT',
  },
  {
    swiftCode: 'HBMXMXMMXXX',
    bankName: 'HSBC México S.A.',
    country: 'México',
    countryCode: 'MX',
    flag: '🇲🇽',
    city: 'Ciudad de México',
    branch: 'Torre HSBC Reforma',
    address: 'Paseo de la Reforma 347, Cuauhtémoc, 06500 CDMX',
    isHeadquarters: true,
    participantType: 'DIRECT',
  },
  {
    swiftCode: 'GPBKMXMMXXX',
    bankName: 'Gold Payments Bank (Internacional)',
    country: 'México',
    countryCode: 'MX',
    flag: '🇲🇽',
    city: 'Ciudad de México',
    branch: 'Oficina Central de Compensaciones Globales',
    address: 'Paseo de la Reforma 483, Cuauhtémoc, 06500 CDMX',
    isHeadquarters: true,
    participantType: 'DIRECT',
  },

  // Estados Unidos
  {
    swiftCode: 'CHASUS33XXX',
    bankName: 'JPMorgan Chase Bank, N.A.',
    country: 'Estados Unidos',
    countryCode: 'US',
    flag: '🇺🇸',
    city: 'New York',
    branch: 'Global Headquarters NY',
    address: '383 Madison Avenue, New York, NY 10179',
    isHeadquarters: true,
    participantType: 'DIRECT',
  },
  {
    swiftCode: 'BOFAUS3NXXX',
    bankName: 'Bank of America, N.A.',
    country: 'Estados Unidos',
    countryCode: 'US',
    flag: '🇺🇸',
    city: 'Charlotte',
    branch: 'Corporate Headquarters',
    address: '100 North Tryon Street, Charlotte, NC 28255',
    isHeadquarters: true,
    participantType: 'DIRECT',
  },
  {
    swiftCode: 'CITIUS33XXX',
    bankName: 'Citibank, N.A.',
    country: 'Estados Unidos',
    countryCode: 'US',
    flag: '🇺🇸',
    city: 'New York',
    branch: 'Global Treasury Center',
    address: '388 Greenwich Street, New York, NY 10013',
    isHeadquarters: true,
    participantType: 'DIRECT',
  },
  {
    swiftCode: 'WFBIUS6SXXX',
    bankName: 'Wells Fargo Bank, N.A.',
    country: 'Estados Unidos',
    countryCode: 'US',
    flag: '🇺🇸',
    city: 'San Francisco',
    branch: 'Corporate Headquarters',
    address: '420 Montgomery Street, San Francisco, CA 94104',
    isHeadquarters: true,
    participantType: 'DIRECT',
  },
  {
    swiftCode: 'WISEUS33XXX',
    bankName: 'Wise Payments Ltd (US Branch)',
    country: 'Estados Unidos',
    countryCode: 'US',
    flag: '🇺🇸',
    city: 'New York',
    branch: 'Wise International Multi-Currency Clearing',
    address: '19 W 24th St, New York, NY 10010',
    isHeadquarters: false,
    participantType: 'DIRECT',
  },

  // Reino Unido
  {
    swiftCode: 'BARCGB22XXX',
    bankName: 'Barclays Bank PLC',
    country: 'Reino Unido',
    countryCode: 'GB',
    flag: '🇬🇧',
    city: 'Londres',
    branch: 'Headquarters Churchill Place',
    address: '1 Churchill Place, Canary Wharf, London E14 5HP',
    isHeadquarters: true,
    participantType: 'DIRECT',
  },
  {
    swiftCode: 'HBUKGB41XXX',
    bankName: 'HSBC UK Bank plc',
    country: 'Reino Unido',
    countryCode: 'GB',
    flag: '🇬🇧',
    city: 'Birmingham',
    branch: 'HSBC UK Head Office',
    address: '1 Centenary Square, Birmingham B1 1HQ',
    isHeadquarters: true,
    participantType: 'DIRECT',
  },
  {
    swiftCode: 'WISEGB2LXXX',
    bankName: 'Wise Payments Ltd (Global Headquarters)',
    country: 'Reino Unido',
    countryCode: 'GB',
    flag: '🇬🇧',
    city: 'Londres',
    branch: 'Wise Europe & International Central Office',
    address: 'Tea Building, 56 Shoreditch High St, London E1 6JJ',
    isHeadquarters: true,
    participantType: 'DIRECT',
  },

  // Alemania
  {
    swiftCode: 'DEUTDEDDFXX',
    bankName: 'Deutsche Bank AG',
    country: 'Alemania',
    countryCode: 'DE',
    flag: '🇩🇪',
    city: 'Frankfurt am Main',
    branch: 'Taunusanlage Global HQ',
    address: 'Taunusanlage 12, 60325 Frankfurt am Main',
    isHeadquarters: true,
    participantType: 'DIRECT',
  },
  {
    swiftCode: 'COMMDEDFXXX',
    bankName: 'Commerzbank AG',
    country: 'Alemania',
    countryCode: 'DE',
    flag: '🇩🇪',
    city: 'Frankfurt am Main',
    branch: 'Commerzbank Tower Central',
    address: 'Kaiserplatz, 60311 Frankfurt am Main',
    isHeadquarters: true,
    participantType: 'DIRECT',
  },

  // Francia
  {
    swiftCode: 'BNPAFRPPXXX',
    bankName: 'BNP Paribas S.A.',
    country: 'Francia',
    countryCode: 'FR',
    flag: '🇫🇷',
    city: 'París',
    branch: 'Siège Social Central',
    address: '16 Boulevard des Italiens, 75009 Paris',
    isHeadquarters: true,
    participantType: 'DIRECT',
  },
  {
    swiftCode: 'SOGEFRPPXXX',
    bankName: 'Société Générale S.A.',
    country: 'Francia',
    countryCode: 'FR',
    flag: '🇫🇷',
    city: 'París',
    branch: 'Tours Société Générale',
    address: '29 Boulevard Haussmann, 75009 Paris',
    isHeadquarters: true,
    participantType: 'DIRECT',
  },

  // Suiza
  {
    swiftCode: 'UBSWCHZHXXX',
    bankName: 'UBS Group AG (incl. Credit Suisse)',
    country: 'Suiza',
    countryCode: 'CH',
    flag: '🇨🇭',
    city: 'Zúrich',
    branch: 'Bahnhofstrasse Central HQ',
    address: 'Bahnhofstrasse 45, 8001 Zürich',
    isHeadquarters: true,
    participantType: 'DIRECT',
  },

  // Canadá
  {
    swiftCode: 'ROYCCAT2XXX',
    bankName: 'Royal Bank of Canada (RBC)',
    country: 'Canadá',
    countryCode: 'CA',
    flag: '🇨🇦',
    city: 'Toronto',
    branch: 'Royal Bank Plaza Headquarters',
    address: '200 Bay Street, Toronto, ON M5J 2J5',
    isHeadquarters: true,
    participantType: 'DIRECT',
  }
];

export interface SwiftDecomposition {
  cleanCode: string;
  isValidLength: boolean;
  isValidFormat: boolean;
  bankCode: string; // 4 letters
  countryCode: string; // 2 letters
  locationCode: string; // 2 alphanumeric
  branchCode: string; // 3 alphanumeric (or empty / XXX)
  matchedBank?: SwiftBankRecord;
  errors: string[];
}

export function parseAndValidateSwiftCode(rawCode: string): SwiftDecomposition {
  // Strip spaces, hyphens, slashes
  const cleanCode = rawCode.toUpperCase().replace(/[\s\-_/.]/g, '');
  const errors: string[] = [];

  const isValidLength = cleanCode.length === 8 || cleanCode.length === 11;
  if (!isValidLength) {
    errors.push('El código Swift/BIC debe tener exactamente 8 u 11 caracteres alfanuméricos.');
  }

  const bankCode = cleanCode.slice(0, 4);
  const countryCode = cleanCode.slice(4, 6);
  const locationCode = cleanCode.slice(6, 8);
  const branchCode = cleanCode.length === 11 ? cleanCode.slice(8, 11) : 'XXX';

  if (bankCode && !/^[A-Z]{4}$/.test(bankCode)) {
    errors.push('Los primeros 4 caracteres (Código de Banco) deben ser letras A-Z.');
  }

  if (countryCode && !/^[A-Z]{2}$/.test(countryCode)) {
    errors.push('Los caracteres 5 y 6 (Código de País) deben ser 2 letras de país A-Z (ISO 3166-1).');
  }

  if (locationCode && !/^[A-Z0-9]{2}$/.test(locationCode)) {
    errors.push('Los caracteres 7 y 8 (Código de Ubicación) deben ser 2 letras o dígitos 0-9 / A-Z.');
  }

  if (cleanCode.length === 11 && !/^[A-Z0-9]{3}$/.test(branchCode)) {
    errors.push('Los últimos 3 caracteres (Código de Sucursal) deben ser 3 dígitos o letras (ej. XXX para sede central).');
  }

  const isValidFormat = isValidLength && errors.length === 0;

  // Search in database
  const normalizedFull = cleanCode.length === 8 ? `${cleanCode}XXX` : cleanCode;
  const matchedBank = SWIFT_DATABASE.find(
    b => b.swiftCode === normalizedFull || b.swiftCode.slice(0, 8) === cleanCode.slice(0, 8)
  );

  return {
    cleanCode,
    isValidLength,
    isValidFormat,
    bankCode,
    countryCode,
    locationCode,
    branchCode,
    matchedBank,
    errors,
  };
}
