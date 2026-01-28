import { BENEFIT_SCHEMES, CESANTIA_VEJEZ_TABLE, DAYS_IN_MONTH, DAYS_IN_YEAR, IMSS_RATES, INFONAVIT_RATE_PCT, ISR_MONTHLY_TABLE, SDI_CAP_MULTIPLIER, SUBSIDY_INCOME_CAP, SUBSIDY_UMA_MULTIPLIER_2026, SUBSIDY_UMA_MULTIPLIER_JAN_2026, BenefitSchemeType } from '../constants';
import type { CalculationResult } from '../types';

interface CalculationParams {
    row: (string | number)[];
    benefitScheme: BenefitSchemeType;
    calculationDate: Date;
    config: {
        uma: number;
        workRisk: number;
        isn: number;
    };
    columnMapping: {
        employeeIdCol: number;
        employeeNameCol: number;
        hireDateCol: number;
        dailySalaryCol: number;
        percepcionColumns: number[];
    };
    headers: string[];
    // optional param for backward calculation, it represents the base salary not other incomes
    sueldoMensualBaseOverride?: number; 
}

const getVacationDaysForSeniority = (years: number): number => {
    if (years < 0) return 0;
    const currentYearOfService = Math.floor(years) + 1;
    if (currentYearOfService <= 5) {
        return 10 + (currentYearOfService * 2);
    }
    const fiveYearBlocks = Math.floor((currentYearOfService - 1) / 5);
    return 20 + (fiveYearBlocks * 2);
};

const getCesantiaVejezRate = (sdi: number, umaValue: number, calculationDate: Date): number => {
    const year = calculationDate.getFullYear();
    const effectiveYear = Math.max(2023, Math.min(year, 2030)).toString();
    const sdiInUma = sdi / umaValue;
    const rateBracket = CESANTIA_VEJEZ_TABLE.find(bracket => sdiInUma >= bracket.minUma && sdiInUma <= bracket.maxUma);
    if (rateBracket && rateBracket.rates[effectiveYear]) {
        return rateBracket.rates[effectiveYear];
    }
    const lastBracket = CESANTIA_VEJEZ_TABLE[CESANTIA_VEJEZ_TABLE.length - 1];
    return lastBracket.rates[effectiveYear] || 0;
};

const performCalculation = ({
    row,
    benefitScheme,
    calculationDate,
    config,
    columnMapping,
    headers,
    sueldoMensualBaseOverride
}: CalculationParams): CalculationResult | null => {
    const { uma, workRisk, isn } = config;
    const { employeeIdCol, employeeNameCol, hireDateCol, dailySalaryCol, percepcionColumns } = columnMapping;

    const employeeId = String(row[employeeIdCol] || `row-${Math.random()}`);
    const employeeName = String(row[employeeNameCol] || 'N/A');
    const hireDateStr = String(row[hireDateCol] || '');
    const originalSalarioDiario = parseFloat(String(row[dailySalaryCol] || '0').replace(/[^0-9.-]+/g, ""));
    const sueldoMensualBaseFromDaily = originalSalarioDiario * DAYS_IN_MONTH;

    const parts = hireDateStr.match(/(\d+)/g);
    let hireDate: Date | null = null;
    if (parts && parts.length === 3) {
        const [p1, p2, p3] = parts.map(Number);
        if (p1 > 0 && p1 <= 31 && p2 > 0 && p2 <= 12 && p3 > 1900) {
            hireDate = new Date(p3, p2 - 1, p1);
        } else if (p1 > 1900 && p2 > 0 && p2 <= 12 && p3 > 0 && p3 <= 31) {
            hireDate = new Date(p1, p2 - 1, p3);
        }
    }
    if (!hireDate || isNaN(hireDate.getTime())) hireDate = new Date(hireDateStr);
    if (!hireDate || isNaN(hireDate.getTime())) return null;
    
    const salaryLikeNames = ['sueldo', 'salario', 'sueldo mensual', 'sueldo base', 'sueldo ordinario', 'vacaciones a tiempo'];

    const percepcionesDetalladasOriginal: { name: string; value: number }[] = [];
    let otherPerceptionsValue = 0;
    let salaryColumnValue = 0;
    
    percepcionColumns.forEach(colIndex => {
        const value = row[colIndex];
        const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]+/g, "")) : Number(value);
        if (!isNaN(numValue) && numValue > 0) {
            const name = headers[colIndex];
            percepcionesDetalladasOriginal.push({ name, value: numValue });
            if (salaryLikeNames.includes(name.toLowerCase())) {
                salaryColumnValue += numValue;
            } else {
                otherPerceptionsValue += numValue;
            }
        }
    });

    const hasSalaryColumn = salaryColumnValue > 0;

    const sueldoMensualBase = sueldoMensualBaseOverride ?? (hasSalaryColumn ? salaryColumnValue : sueldoMensualBaseFromDaily);

    if (isNaN(sueldoMensualBase) || sueldoMensualBase < 0) return null;

    const salarioDiario = sueldoMensualBase / 30;
    
    const totalPercepciones = sueldoMensualBase + otherPerceptionsValue;
    
    let percepcionesDetalladas = percepcionesDetalladasOriginal;
    if (sueldoMensualBaseOverride !== undefined) {
        percepcionesDetalladas = percepcionesDetalladasOriginal.filter(p => !salaryLikeNames.includes(p.name.toLowerCase()));
    }
    
    if(totalPercepciones <= 0 && sueldoMensualBase <= 0) return null;

    const schemeConfig = BENEFIT_SCHEMES[benefitScheme];
    const yearsOfService = (calculationDate.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    const vacationDays = getVacationDaysForSeniority(yearsOfService);
    const aguinaldoDays = schemeConfig.getAguinaldoDays(yearsOfService);
    const primaVacacionalPct = schemeConfig.getPrimaVacacionalPct(yearsOfService);
    const factorIntegracion = 1 + (aguinaldoDays / DAYS_IN_YEAR) + (vacationDays * primaVacacionalPct / DAYS_IN_YEAR);
    
    const nonVariablePerceptionNames = new Set(['seguro gmm', 'seguro de vida', 'seguro vida', 'despensa', 'horas extras', 'pasivo laboral', ...salaryLikeNames]);
    const totalPercepcionesVariables = percepcionesDetalladas.reduce((acc, p) => !nonVariablePerceptionNames.has(p.name.toLowerCase()) ? acc + p.value : acc, 0);
    const variableSdiComponent = totalPercepcionesVariables / DAYS_IN_MONTH;
    const sdiFijo = salarioDiario * factorIntegracion;
    const sdi = sdiFijo + variableSdiComponent;
    const sdiTopado = Math.min(sdi, uma * SDI_CAP_MULTIPLIER);

    const cuotaFija = uma * (IMSS_RATES.EMPLOYER.FIXED_QUOTA_PCT / 100) * DAYS_IN_MONTH;
    const excedente = sdiTopado > (uma * 3) ? (sdiTopado - (uma * 3)) * (IMSS_RATES.EMPLOYER.EXCESS_QUOTA_PCT / 100) * DAYS_IN_MONTH : 0;
    const prestacionesDinero = sdiTopado * (IMSS_RATES.EMPLOYER.CASH_BENEFITS_PCT / 100) * DAYS_IN_MONTH;
    const gastosMedicos = sdiTopado * (IMSS_RATES.EMPLOYER.MEDICAL_PENSIONERS_PCT / 100) * DAYS_IN_MONTH;
    const invalidezVida = sdiTopado * (IMSS_RATES.EMPLOYER.DISABILITY_LIFE_PCT / 100) * DAYS_IN_MONTH;
    const guarderias = sdiTopado * (IMSS_RATES.EMPLOYER.NURSERY_PCT / 100) * DAYS_IN_MONTH;
    const riesgoTrabajo = sdiTopado * (workRisk / 100) * DAYS_IN_MONTH;
    const imssCosto = cuotaFija + excedente + prestacionesDinero + gastosMedicos + invalidezVida + guarderias + riesgoTrabajo;

    const retiroCosto = sdiTopado * (IMSS_RATES.EMPLOYER.RETIREMENT_PCT / 100) * DAYS_IN_MONTH;
    const cesantiaVejezRate = getCesantiaVejezRate(sdi, uma, calculationDate);
    const cesantiaVejezCosto = sdiTopado * (cesantiaVejezRate / 100) * DAYS_IN_MONTH;
    const infonavitCosto = sdiTopado * (INFONAVIT_RATE_PCT / 100) * DAYS_IN_MONTH;
    const aguinaldoMensual = (aguinaldoDays * salarioDiario) / 12;
    const primaVacacionalMensual = ((salarioDiario * vacationDays) / 12) * primaVacacionalPct;
    const isnCosto = (totalPercepciones + aguinaldoMensual + primaVacacionalMensual) * (isn / 100);
    const costoTotal = totalPercepciones + imssCosto + retiroCosto + cesantiaVejezCosto + infonavitCosto + isnCosto + aguinaldoMensual + primaVacacionalMensual;
    const factor = sueldoMensualBase > 0 ? costoTotal / sueldoMensualBase : 0;
    
    const imssObreroExcedente = sdiTopado > (uma * 3) ? (sdiTopado - (uma * 3)) * (IMSS_RATES.EMPLOYEE.EXCESS_QUOTA_PCT / 100) * DAYS_IN_MONTH : 0;
    const imssObreroPrestacionesDinero = sdiTopado * (IMSS_RATES.EMPLOYEE.CASH_BENEFITS_PCT / 100) * DAYS_IN_MONTH;
    const imssObreroGastosMedicos = sdiTopado * (IMSS_RATES.EMPLOYEE.MEDICAL_PENSIONERS_PCT / 100) * DAYS_IN_MONTH;
    const imssObreroInvalidezVida = sdiTopado * (IMSS_RATES.EMPLOYEE.DISABILITY_LIFE_PCT / 100) * DAYS_IN_MONTH;
    const imssObreroCesantiaVejez = sdiTopado * (IMSS_RATES.EMPLOYEE.CESANTIA_VEJEZ_PCT / 100) * DAYS_IN_MONTH;
    const imssObrero = imssObreroExcedente + imssObreroPrestacionesDinero + imssObreroGastosMedicos + imssObreroInvalidezVida + imssObreroCesantiaVejez;
    const imssObreroDetalle = { excedente: imssObreroExcedente, prestacionesDinero: imssObreroPrestacionesDinero, gastosMedicos: imssObreroGastosMedicos, invalidezVida: imssObreroInvalidezVida, cesantiaVejez: imssObreroCesantiaVejez };

    const taxableIncome = totalPercepciones;
    const isrBracket = ISR_MONTHLY_TABLE.find(b => taxableIncome >= b.lowerLimit && taxableIncome <= b.upperLimit);
    let isrBruto = 0;
    if (isrBracket) {
        const excessIncome = taxableIncome - isrBracket.lowerLimit;
        isrBruto = (excessIncome * (isrBracket.percentOverExcess / 100)) + isrBracket.fixedQuota;
    }

    let subsidioEmpleo = 0;
    if (taxableIncome <= SUBSIDY_INCOME_CAP) {
        const monthlyUMA = uma * DAYS_IN_MONTH;
        const isJanuary = calculationDate.getMonth() === 0;
        const subsidyMultiplier = isJanuary ? SUBSIDY_UMA_MULTIPLIER_JAN_2026 : SUBSIDY_UMA_MULTIPLIER_2026;
        subsidioEmpleo = monthlyUMA * subsidyMultiplier;
    }

    const isr = Math.max(0, isrBruto - subsidioEmpleo);
    const salarioNeto = totalPercepciones - isr - imssObrero;

    return { id: employeeId, employeeName, totalPercepciones, sueldoMensualBase, percepcionesDetalladas, salarioDiario, benefitScheme, sdi, imss: imssCosto, retiro: retiroCosto, cesantiaVejez: cesantiaVejezCosto, infonavit: infonavitCosto, aguinaldoMensual, primaVacacionalMensual, isn: isnCosto, costoTotal, factor, salarioNeto, calculationDetails: { sdiTopado, cuotaFija, excedente, prestacionesDinero, gastosMedicos, invalidezVida, guarderias, riesgoTrabajo, cesantiaVejezRate, yearsOfService, vacationDays, aguinaldoDays, primaVacacionalPct, factorIntegracion, sdiFijo, variableSdiComponent, totalPercepcionesVariables, isr, subsidioEmpleo, imssObrero, imssObreroDetalle } };
};

export const calculateForward = (params: Omit<CalculationParams, 'sueldoMensualBaseOverride'>): CalculationResult | null => {
    return performCalculation(params);
};

export const calculateBackward = (
    params: Omit<CalculationParams, 'sueldoMensualBaseOverride'> & { desiredNet: number }
): CalculationResult | null => {
    const { desiredNet, ...baseParams } = params;

    const calculateNetForGrossBase = (grossBase: number): { net: number, totalGross: number } => {
        const result = performCalculation({ ...baseParams, sueldoMensualBaseOverride: grossBase });
        return result ? { net: result.salarioNeto, totalGross: result.totalPercepciones } : { net: 0, totalGross: 0 };
    };
    
    // Initial guess: assume an average 25% tax/deduction rate to get a starting total gross,
    // then subtract other fixed perceptions to get a starting base salary guess.
    const initialResult = performCalculation(baseParams);
    const otherPerceptionsValue = initialResult ? (initialResult.totalPercepciones - initialResult.sueldoMensualBase) : 0;
    const initialGrossGuess = desiredNet / 0.75;
    let sueldoBrutoEstimado = Math.max(0, initialGrossGuess - otherPerceptionsValue); 

    const MAX_ITERATIONS = 35; // Increased iterations for higher precision
    const TOLERANCE = 0.001; // Reduced tolerance for maximum precision

    for (let i = 0; i < MAX_ITERATIONS; i++) {
        const { net: netoCalculado, totalGross: totalBrutoCalculado } = calculateNetForGrossBase(sueldoBrutoEstimado);
        const diferencia = desiredNet - netoCalculado;

        if (Math.abs(diferencia) <= TOLERANCE) {
            break; 
        }
        
        if (netoCalculado > 1) {
            const totalOtrasPercepciones = totalBrutoCalculado - sueldoBrutoEstimado;
            const nuevoTotalBruto = totalBrutoCalculado * (desiredNet / netoCalculado);
            let nuevoSueldoBruto = nuevoTotalBruto - totalOtrasPercepciones;

            if (nuevoSueldoBruto < 0 && diferencia < 0) {
                 // If we need a lower net (diferencia < 0) but the adjustment made the salary negative,
                 // it means the target is likely impossible to reach (below the floor).
                 // In this case, we converge to zero.
                nuevoSueldoBruto = sueldoBrutoEstimado / 2;
            }
            sueldoBrutoEstimado = nuevoSueldoBruto;
        } else {
             sueldoBrutoEstimado += diferencia;
        }

        if (sueldoBrutoEstimado < 0) {
            sueldoBrutoEstimado = 0;
            if (i > 0) break;
        }
    }

    return performCalculation({ ...baseParams, sueldoMensualBaseOverride: sueldoBrutoEstimado });
};