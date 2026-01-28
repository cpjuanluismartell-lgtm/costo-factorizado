
// FIX: Removed a circular import of DEFAULT_UMA from the same file, which caused a declaration conflict.
export const DEFAULT_UMA = 117.31; // Valor UMA a partir del 1 de Febrero 2026
export const DEFAULT_WORK_RISK = 7.58875;
export const DEFAULT_ISN = 4.0;

export type BenefitSchemeType = 'ley' | 'antes1991' | 'gerentes';

export const BENEFIT_SCHEMES: { [key in BenefitSchemeType]: { name: string; getAguinaldoDays: (years: number) => number; getPrimaVacacionalPct: (years: number) => number; } } = {
  ley: {
    name: 'Ley',
    getAguinaldoDays: () => 15,
    getPrimaVacacionalPct: () => 0.25,
  },
  antes1991: {
    name: 'Antes de 1991',
    getAguinaldoDays: (years: number) => {
      const y = Math.floor(years);
      if (y < 1) return 0;
      if (y === 1) return 16;
      if (y <= 3) return 21;
      if (y === 4) return 26;
      return 31;
    },
    getPrimaVacacionalPct: (years: number) => {
      const y = Math.floor(years);
      if (y < 1) return 0;
      if (y <= 4) return 0.30;
      return 0.35;
    },
  },
  gerentes: {
    name: 'Gerentes',
    getAguinaldoDays: (years: number) => {
      const y = Math.floor(years);
      if (y < 1) return 0;
      if (y <= 3) return 22;
      if (y === 4) return 27;
      return 32;
    },
    getPrimaVacacionalPct: (years: number) => {
      const y = Math.floor(years);
      if (y < 1) return 0;
      if (y <= 4) return 0.35;
      return 0.40;
    },
  },
};


export const SDI_CAP_MULTIPLIER = 25;
export const DAYS_IN_MONTH = 30.4;
export const DAYS_IN_YEAR = 365;

export const IMSS_RATES = {
    EMPLOYER: {
        FIXED_QUOTA_PCT: 20.40, // Sobre 1 UMA
        EXCESS_QUOTA_PCT: 1.10, // Sobre diferencia de (SBC - 3 UMA)
        CASH_BENEFITS_PCT: 0.70,
        MEDICAL_PENSIONERS_PCT: 1.05,
        DISABILITY_LIFE_PCT: 1.75,
        RETIREMENT_PCT: 2.00,
        NURSERY_PCT: 1.00,
    },
    EMPLOYEE: {
        EXCESS_QUOTA_PCT: 0.40, // Sobre diferencia de (SBC - 3 UMA)
        CASH_BENEFITS_PCT: 0.25,
        MEDICAL_PENSIONERS_PCT: 0.375,
        DISABILITY_LIFE_PCT: 0.625,
        CESANTIA_VEJEZ_PCT: 1.125,
    }
};

export const ISR_MONTHLY_TABLE = [
    { lowerLimit: 0.01, upperLimit: 844.59, fixedQuota: 0.00, percentOverExcess: 1.92 },
    { lowerLimit: 844.60, upperLimit: 7168.51, fixedQuota: 16.22, percentOverExcess: 6.40 },
    { lowerLimit: 7168.52, upperLimit: 12598.02, fixedQuota: 420.95, percentOverExcess: 10.88 },
    { lowerLimit: 12598.03, upperLimit: 14644.64, fixedQuota: 1011.68, percentOverExcess: 16.00 },
    { lowerLimit: 14644.65, upperLimit: 17533.64, fixedQuota: 1339.14, percentOverExcess: 17.92 },
    { lowerLimit: 17533.65, upperLimit: 35362.83, fixedQuota: 1856.84, percentOverExcess: 21.36 },
    { lowerLimit: 35362.84, upperLimit: 55736.68, fixedQuota: 5665.16, percentOverExcess: 23.52 },
    { lowerLimit: 55736.69, upperLimit: 106410.50, fixedQuota: 10457.09, percentOverExcess: 30.00 },
    { lowerLimit: 106410.51, upperLimit: 141880.66, fixedQuota: 25659.23, percentOverExcess: 32.00 },
    { lowerLimit: 141880.67, upperLimit: 425641.99, fixedQuota: 37009.69, percentOverExcess: 34.00 },
    { lowerLimit: 425642.00, upperLimit: Infinity, fixedQuota: 133488.54, percentOverExcess: 35.00 },
];

// Regla de Subsidio al Empleo para 2026
export const SUBSIDY_INCOME_CAP = 11492.66;
export const SUBSIDY_UMA_MULTIPLIER_2026 = 0.1502; // 15.02%
export const SUBSIDY_UMA_MULTIPLIER_JAN_2026 = 0.1559; // 15.59% para Enero

export const CESANTIA_VEJEZ_TABLE = [
    { range: '1.0 SM', minUma: 0, maxUma: 1.00, rates: { '2023': 3.15, '2024': 3.15, '2025': 3.15, '2026': 3.15, '2027': 3.15, '2028': 3.15, '2029': 3.15, '2030': 3.15 } },
    { range: '1.01 SM a 1.50 UMA', minUma: 1.01, maxUma: 1.50, rates: { '2023': 3.28, '2024': 3.41, '2025': 3.54, '2026': 3.67, '2027': 3.80, '2028': 3.93, '2029': 4.07, '2030': 4.20 } },
    { range: '1.51 a 2.00 UMA', minUma: 1.51, maxUma: 2.00, rates: { '2023': 3.58, '2024': 4.00, '2025': 4.43, '2026': 4.85, '2027': 5.28, '2028': 5.70, '2029': 6.13, '2030': 6.55 } },
    { range: '2.01 a 2.50 UMA', minUma: 2.01, maxUma: 2.50, rates: { '2023': 3.75, '2024': 4.35, '2025': 4.95, '2026': 5.56, '2027': 6.16, '2028': 6.76, '2029': 7.36, '2030': 7.96 } },
    { range: '2.51 a 3.00 UMA', minUma: 2.51, maxUma: 3.00, rates: { '2023': 3.87, '2024': 4.59, '2025': 5.31, '2026': 6.03, '2027': 6.75, '2028': 7.46, '2029': 8.18, '2030': 8.90 } },
    { range: '3.01 a 3.50 UMA', minUma: 3.01, maxUma: 3.50, rates: { '2023': 3.95, '2024': 4.76, '2025': 5.56, '2026': 6.36, '2027': 7.16, '2028': 7.97, '2029': 8.77, '2030': 9.57 } },
    { range: '3.51 a 4.00 UMA', minUma: 3.51, maxUma: 4.00, rates: { '2023': 4.02, '2024': 4.88, '2025': 5.75, '2026': 6.61, '2027': 7.48, '2028': 8.35, '2029': 9.21, '2030': 10.08 } },
    { range: '4.01 UMA en adelante', minUma: 4.01, maxUma: Infinity, rates: { '2023': 4.24, '2024': 5.33, '2025': 6.42, '2026': 7.51, '2027': 8.60, '2028': 9.69, '2029': 10.78, '2030': 11.88 } },
];


export const INFONAVIT_RATE_PCT = 5.0;