import type { BenefitSchemeType } from './constants';

// FIX: Removed a circular import of 'ParsedData' which was causing a conflict with the local declaration.
export interface ParsedData {
    headers: string[];
    rows: (string | number)[][];
}

export interface CalculationResult {
    id: string;
    employeeName: string;
    totalPercepciones: number;
    sueldoMensualBase: number;
    percepcionesDetalladas: { name: string; value: number }[];
    salarioDiario: number;
    benefitScheme: BenefitSchemeType;
    sdi: number;
    imss: number; // Cuotas IMSS (sin RCV)
    retiro: number; // RCV - Retiro
    cesantiaVejez: number; // RCV - Cesantía y Vejez
    infonavit: number; // Aportación INFONAVIT
    aguinaldoMensual: number;
    primaVacacionalMensual: number;
    isn: number;
    costoTotal: number;
    factor: number;
    salarioNeto: number;
    calculationDetails: {
        sdiTopado: number;
        cuotaFija: number;
        excedente: number;
        prestacionesDinero: number;
        gastosMedicos: number;
        invalidezVida: number;
        guarderias: number;
        riesgoTrabajo: number;
        cesantiaVejezRate: number;
        yearsOfService: number;
        vacationDays: number;
        aguinaldoDays: number;
        primaVacacionalPct: number;
        factorIntegracion: number;
        sdiFijo: number;
        variableSdiComponent: number;
        totalPercepcionesVariables: number;
        isr: number;
        subsidioEmpleo: number;
        imssObrero: number;
        imssObreroDetalle: {
            excedente: number;
            prestacionesDinero: number;
            gastosMedicos: number;
            invalidezVida: number;
            cesantiaVejez: number;
        };
    };
}