import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import type { CalculationResult } from '../types';
import { Tooltip } from './Tooltip';
import { DAYS_IN_YEAR, DAYS_IN_MONTH, IMSS_RATES, INFONAVIT_RATE_PCT, BenefitSchemeType, BENEFIT_SCHEMES, SDI_CAP_MULTIPLIER } from '../constants';
import { ArrowDownIcon, ArrowUpIcon } from './icons';


interface ResultsTableProps {
    results: CalculationResult[];
    uma: number;
    workRisk: number;
    isn: number;
    layout: 'vertical' | 'horizontal';
    percepcionHeaders: string[];
    onSchemeChange: (employeeId: string, newScheme: BenefitSchemeType) => void;
    desiredNetSalaries: Map<string, number | null>;
    onDesiredNetChange: (employeeId: string, newDesiredNet: number | null) => void;
}

const InteractiveCell: React.FC<{ tooltipContent: React.ReactNode, value: string | number, className?: string, position?: 'top' | 'bottom' }> = ({ tooltipContent, value, className, position = 'bottom' }) => {
    return (
        <Tooltip content={tooltipContent} position={position}>
            <span className={`cursor-help border-b border-dotted border-slate-400 ${className}`}>
                {value}
            </span>
        </Tooltip>
    );
};

export const ResultsTable: React.FC<ResultsTableProps> = ({ results, uma, workRisk, isn, layout, percepcionHeaders, onSchemeChange, desiredNetSalaries, onDesiredNetChange }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [scrollState, setScrollState] = useState<'bottom' | 'top' | 'none'>('none');

    const handleScroll = useCallback(() => {
        const element = scrollContainerRef.current;
        if (!element) return;

        const isScrollable = element.scrollHeight > element.clientHeight;
        if (!isScrollable) {
            setScrollState('none');
            return;
        }

        const isAtBottom = Math.abs(element.scrollHeight - element.scrollTop - element.clientHeight) < 1;

        if (isAtBottom) {
            setScrollState('top');
        } else {
            setScrollState('bottom');
        }
    }, []);

    useEffect(() => {
        const element = scrollContainerRef.current;
        if (element) {
            handleScroll(); // Initial check
            element.addEventListener('scroll', handleScroll);
            return () => element.removeEventListener('scroll', handleScroll);
        }
    }, [results, handleScroll]);

    const handleScrollButtonClick = () => {
        const element = scrollContainerRef.current;
        if (!element) return;

        if (scrollState === 'bottom') {
            element.scrollTo({ top: element.scrollHeight, behavior: 'smooth' });
        } else if (scrollState === 'top') {
            element.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
        }).format(value);
    };

    const formatFactor = (value: number) => {
        return value.toFixed(4);
    };

    const totals = useMemo(() => {
        if (results.length === 0) return null;

        const initialTotals = {
            totalPercepciones: 0,
            sueldoMensualBase: 0,
            percepcionesDetalladas: new Map<string, number>(),
            imss: 0,
            retiro: 0,
            cesantiaVejez: 0,
            infonavit: 0,
            aguinaldoMensual: 0,
            primaVacacionalMensual: 0,
            isn: 0,
            costoTotal: 0,
            salarioNeto: 0,
            desiredNet: 0,
            details: {
                cuotaFija: 0,
                excedente: 0,
                prestacionesDinero: 0,
                gastosMedicos: 0,
                invalidezVida: 0,
                guarderias: 0,
                riesgoTrabajo: 0,
            }
        };

        const finalTotals = results.reduce((acc, res) => {
            acc.totalPercepciones += res.totalPercepciones;
            acc.sueldoMensualBase += res.sueldoMensualBase;
            acc.imss += res.imss;
            acc.retiro += res.retiro;
            acc.cesantiaVejez += res.cesantiaVejez;
            acc.infonavit += res.infonavit;
            acc.aguinaldoMensual += res.aguinaldoMensual;
            acc.primaVacacionalMensual += res.primaVacacionalMensual;
            acc.isn += res.isn;
            acc.costoTotal += res.costoTotal;
            acc.salarioNeto += res.salarioNeto;
            acc.desiredNet += desiredNetSalaries.get(res.id) ?? res.salarioNeto;


            res.percepcionesDetalladas.forEach(p => {
                acc.percepcionesDetalladas.set(p.name, (acc.percepcionesDetalladas.get(p.name) || 0) + p.value);
            });

            const d = res.calculationDetails;
            acc.details.cuotaFija += d.cuotaFija;
            acc.details.excedente += d.excedente;
            acc.details.prestacionesDinero += d.prestacionesDinero;
            acc.details.gastosMedicos += d.gastosMedicos;
            acc.details.invalidezVida += d.invalidezVida;
            acc.details.guarderias += d.guarderias;
            acc.details.riesgoTrabajo += d.riesgoTrabajo;

            return acc;
        }, initialTotals);
        
        const totalFactor = finalTotals.sueldoMensualBase > 0 ? finalTotals.costoTotal / finalTotals.sueldoMensualBase : 0;

        return { ...finalTotals, totalFactor };
    }, [results, desiredNetSalaries]);
    
    const staticHeaders = [
        "Código",
        "Empleado",
        "Prestaciones",
        "Percepciones Mensuales",
        "Salario Diario",
        "SDI",
        "IMSS Patronal",
        "Retiro Pat.",
        "C y V Pat.",
        "INFONAVIT Pat.",
        "Aguinaldo Mensual",
        "Prima Vac. Mensual",
        "Costo ISN Mensual",
        "Costo Total Empresa",
        "Factor de Costo",
        "Salario Neto",
        "Neto Deseado"
    ];
    
    const horizontalHeaders = [
        "Código",
        "Empleado",
        "Prestaciones",
        "Sueldo Mensual Base",
        ...percepcionHeaders,
        "Total Percepciones",
        "Salario Diario",
        "SDI",
        "IMSS Patronal",
        "Retiro Pat.",
        "C y V Pat.",
        "INFONAVIT Pat.",
        "Aguinaldo Mensual",
        "Prima Vac. Mensual",
        "Costo ISN Mensual",
        "Costo Total Empresa",
        "Factor de Costo",
        "Salario Neto",
        "Neto Deseado"
    ];

    const headers = layout === 'vertical' ? staticHeaders : horizontalHeaders;

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 relative">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Resultados del Cálculo</h2>
            <div ref={scrollContainerRef} className="overflow-auto max-h-[75vh]">
                <table className="min-w-full divide-y divide-slate-200 border-separate border-spacing-0">
                    <thead>
                        <tr>
                            {headers.map((header, index) => {
                                let classes = "px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider sticky top-0 bg-slate-100 border-b border-slate-200";
                                if (index === 0) { // Código
                                    classes += " left-0 z-30 w-28 border-r border-slate-200";
                                } else if (index === 1) { // Empleado
                                    classes += " left-[7rem] z-30 w-64 border-r border-slate-200";
                                } else if (index === 2) { // Prestaciones
                                    classes += " left-[23rem] z-30 w-40 border-r border-slate-200";
                                } else {
                                    classes += " z-10";
                                }
                                return <th key={header} scope="col" className={classes}>{header}</th>;
                            })}
                        </tr>
                    </thead>
                    <tbody className="bg-white">
                        {results.map((res, index) => {
                            const isLastFewRows = index >= results.length - 3;
                            const tooltipPosition = isLastFewRows ? 'top' : 'bottom';
                            const details = res.calculationDetails;
                            
                            const sdiTooltip = (
                                <div className="text-left text-xs space-y-1">
                                    <h4 className="font-bold">Cálculo del SDI</h4>
                                    
                                    <div className="border-t border-slate-600 my-1 pt-1">
                                        <p>SDI Fijo: <span className="float-right font-bold">{formatCurrency(details.sdiFijo)}</span></p>
                                        <p className="font-mono text-slate-400 text-[10px]">{`${formatCurrency(res.salarioDiario)} × ${details.factorIntegracion.toFixed(4)}`}</p>
                                    </div>
                        
                                    <div className="pt-1">
                                        <p>SDI Variable: <span className="float-right font-bold">{formatCurrency(details.variableSdiComponent)}</span></p>
                                        <p className="font-mono text-slate-400 text-[10px]">{`${formatCurrency(details.totalPercepcionesVariables)} / ${DAYS_IN_MONTH}`}</p>
                                    </div>
                                    
                                    <div className="border-t border-slate-600 my-1 pt-1">
                                         <p className="font-bold">Total SDI: <span className="float-right">{formatCurrency(res.sdi)}</span></p>
                                    </div>

                                    <div className="border-t border-slate-600 my-1 pt-1 text-sky-300">
                                        <p>Límite ({SDI_CAP_MULTIPLIER} UMA): <span className="float-right font-bold">{formatCurrency(uma * SDI_CAP_MULTIPLIER)}</span></p>
                                        <p className="font-bold">SDI p/ Cálculo: <span className="float-right">{formatCurrency(details.sdiTopado)}</span></p>
                                    </div>
                                    
                                    <div className="border-t border-slate-600 my-1 pt-2">
                                        <h5 className="font-semibold">Factor de Integración (Parte Fija):</h5>
                                        <p>Antigüedad: {details.yearsOfService.toFixed(2)} años</p>
                                        <p>Días de Vacaciones: {details.vacationDays}</p>
                                        <p>Aguinaldo: {details.aguinaldoDays} días</p>
                                        <p>Prima Vacacional: {details.primaVacacionalPct * 100}%</p>
                                        <p className="font-mono mt-1 pt-1 border-t border-slate-700">{`1 + (${details.aguinaldoDays}/${DAYS_IN_YEAR}) + ((${details.vacationDays} × ${details.primaVacacionalPct}) / ${DAYS_IN_YEAR})`}</p>
                                    </div>
                                </div>
                            );

                            const imssTooltip = (
                                <div className="grid grid-cols-2 gap-x-4 text-xs">
                                    <div className="col-span-2">
                                        <h4 className="font-bold">IMSS Patronal</h4>
                                        <p className="text-slate-400">Base SDI: {formatCurrency(res.sdi)}, Topado a: {formatCurrency(details.sdiTopado)}.</p>
                                        <div className="border-t border-slate-600 my-1"></div>
                                    </div>
                                    
                                    <div>
                                        <p>Cuota Fija:</p>
                                        <p className="font-mono text-slate-400 text-[10px]">{`(${formatCurrency(uma)} x ${IMSS_RATES.EMPLOYER.FIXED_QUOTA_PCT}%) x ${DAYS_IN_MONTH}`}</p>
                                    </div>
                                    <div className="font-bold text-right">{formatCurrency(details.cuotaFija)}</div>

                                    <div>
                                        <p>Excedente:</p>
                                        <p className="font-mono text-slate-400 text-[10px]">{`(SDI Topado - 3 UMA) x ${IMSS_RATES.EMPLOYER.EXCESS_QUOTA_PCT}% x ${DAYS_IN_MONTH}`}</p>
                                    </div>
                                    <div className="font-bold text-right">{formatCurrency(details.excedente)}</div>

                                    <div>
                                        <p>Prest. Dinero:</p>
                                        <p className="font-mono text-slate-400 text-[10px]">{`(SDI Topado x ${IMSS_RATES.EMPLOYER.CASH_BENEFITS_PCT}%) x ${DAYS_IN_MONTH}`}</p>
                                    </div>
                                    <div className="font-bold text-right">{formatCurrency(details.prestacionesDinero)}</div>

                                    <div>
                                        <p>Gastos Médicos:</p>
                                        <p className="font-mono text-slate-400 text-[10px]">{`(SDI Topado x ${IMSS_RATES.EMPLOYER.MEDICAL_PENSIONERS_PCT}%) x ${DAYS_IN_MONTH}`}</p>
                                    </div>
                                    <div className="font-bold text-right">{formatCurrency(details.gastosMedicos)}</div>

                                    <div>
                                        <p>Invalidez y Vida:</p>
                                        <p className="font-mono text-slate-400 text-[10px]">{`(SDI Topado x ${IMSS_RATES.EMPLOYER.DISABILITY_LIFE_PCT}%) x ${DAYS_IN_MONTH}`}</p>
                                    </div>
                                    <div className="font-bold text-right">{formatCurrency(details.invalidezVida)}</div>

                                    <div>
                                        <p>Guarderías:</p>
                                        <p className="font-mono text-slate-400 text-[10px]">{`(SDI Topado x ${IMSS_RATES.EMPLOYER.NURSERY_PCT}%) x ${DAYS_IN_MONTH}`}</p>
                                    </div>
                                    <div className="font-bold text-right">{formatCurrency(details.guarderias)}</div>

                                    <div>
                                        <p>Riesgo de Trabajo:</p>
                                        <p className="font-mono text-slate-400 text-[10px]">{`(SDI Topado x ${workRisk}%) x ${DAYS_IN_MONTH}`}</p>
                                    </div>
                                    <div className="font-bold text-right">{formatCurrency(details.riesgoTrabajo)}</div>
                                    
                                    <div className="col-span-2 border-t border-slate-600 pt-1 mt-1 flex justify-between font-bold">
                                        <p>Total:</p>
                                        <p>{formatCurrency(res.imss)}</p>
                                    </div>
                                </div>
                            );

                            const retiroTooltip = (
                                <div className="text-left text-xs space-y-1">
                                    <h4 className="font-bold">Retiro (RCV)</h4>
                                    <p>Tasa: {IMSS_RATES.EMPLOYER.RETIREMENT_PCT}%</p>
                                    <div className="border-t border-slate-600 my-1"></div>
                                    <p className="font-mono">{`(${formatCurrency(details.sdiTopado)} x ${IMSS_RATES.EMPLOYER.RETIREMENT_PCT}%) x ${DAYS_IN_MONTH}`}</p>
                                </div>
                            );

                            const cyvTooltip = (
                                <div className="text-left text-xs space-y-1">
                                    <h4 className="font-bold">Cesantía y Vejez (RCV)</h4>
                                    <p>Tasa aplicada (2026): {details.cesantiaVejezRate.toFixed(4)}% (varía por nivel salarial)</p>
                                     <div className="border-t border-slate-600 my-1"></div>
                                    <p className="font-mono">{`(${formatCurrency(details.sdiTopado)} x ${details.cesantiaVejezRate.toFixed(4)}%) x ${DAYS_IN_MONTH}`}</p>
                                </div>
                            );

                             const infonavitTooltip = (
                                <div className="text-left text-xs space-y-1">
                                    <h4 className="font-bold">INFONAVIT</h4>
                                    <p>Tasa: {INFONAVIT_RATE_PCT}%</p>
                                    <div className="border-t border-slate-600 my-1"></div>
                                    <p className="font-mono">{`(${formatCurrency(details.sdiTopado)} x ${INFONAVIT_RATE_PCT}%) x ${DAYS_IN_MONTH}`}</p>
                                </div>
                            );

                             const aguinaldoMensualTooltip = (
                                <div className="text-left text-xs space-y-1">
                                    <h4 className="font-bold">Provisión Aguinaldo Mensual</h4>
                                    <p className="font-mono">{`(${details.aguinaldoDays} Días x ${formatCurrency(res.salarioDiario)}) / 12 meses`}</p>
                                </div>
                            );

                            const primaVacacionalMensualTooltip = (
                                <div className="text-left text-xs space-y-1">
                                    <h4 className="font-bold">Provisión Prima Vac. Mensual</h4>
                                    <p className="font-mono">{`((${formatCurrency(res.salarioDiario)} x ${details.vacationDays} Días) / 12) x ${details.primaVacacionalPct * 100}%`}</p>
                                </div>
                            );
                            
                            const isnTooltip = (
                                <div className="text-left text-xs space-y-1">
                                    <h4 className="font-bold">Impuesto Sobre Nómina</h4>
                                    <p className="text-slate-400 text-[10px]">Base: Percepciones + Provisiones</p>
                                    <p className="font-mono">{`(${formatCurrency(res.totalPercepciones + res.aguinaldoMensual + res.primaVacacionalMensual)} x ${isn.toFixed(2)}%)`}</p>
                                </div>
                            );

                            const costoTotalTooltip = (
                                <div className="text-left text-xs space-y-1">
                                    <h4 className="font-bold">Costo Total Empresa</h4>
                                    <p>Percepciones: <span className="float-right">{formatCurrency(res.totalPercepciones)}</span></p>
                                    <p>Cargas Sociales: <span className="float-right">{formatCurrency(res.imss + res.retiro + res.cesantiaVejez + res.infonavit)}</span></p>
                                    <p>Provisiones: <span className="float-right">{formatCurrency(res.aguinaldoMensual + res.primaVacacionalMensual)}</span></p>
                                    <p>Impuesto Nómina: <span className="float-right">{formatCurrency(res.isn)}</span></p>
                                    <div className="border-t border-slate-600 my-1 pt-1">
                                        <p className="font-bold">Total: <span className="float-right">{formatCurrency(res.costoTotal)}</span></p>
                                    </div>
                                </div>
                            );
                            
                            const factorTooltip = (
                                <div className="text-left text-xs space-y-1">
                                    <h4 className="font-bold">Factor de Costo</h4>
                                    <p>Costo real por cada peso de sueldo base mensual.</p>
                                    <p className="font-mono">{`${formatCurrency(res.costoTotal)} / ${formatCurrency(res.sueldoMensualBase)}`}</p>
                                </div>
                            );

                            const salarioNetoTooltip = (
                                <div className="text-left text-xs space-y-1">
                                    <h4 className="font-bold">Cálculo de Salario Neto</h4>
                                    <div className="grid grid-cols-2 gap-x-2 pt-1">
                                        <p>Total Percepciones:</p>
                                        <p className="text-right font-medium">{formatCurrency(res.totalPercepciones)}</p>

                                        <p>(-) ISR Retenido:</p>
                                        <p className="text-right font-medium">{formatCurrency(details.isr)}</p>

                                        <p>(-) IMSS Obrero:</p>
                                        <p className="text-right font-medium">{formatCurrency(details.imssObrero)}</p>
                                        
                                        <div className="col-span-2 border-t border-slate-600 my-1 pt-1 flex justify-between font-bold">
                                            <p>Salario Neto Mensual:</p>
                                            <p>{formatCurrency(res.salarioNeto)}</p>
                                        </div>

                                        <div className="col-span-2 border-t border-slate-600 my-1 pt-2">
                                            <h5 className="font-semibold mb-1">Desglose Percepciones:</h5>
                                            <div className="grid grid-cols-2 gap-x-2">
                                                {!res.percepcionesDetalladas.some(p => ['sueldo', 'vacaciones a tiempo'].includes(p.name.toLowerCase())) && (
                                                    <React.Fragment>
                                                        <p>Sueldo Mensual Base:</p>
                                                        <p className="text-right">{formatCurrency(res.sueldoMensualBase)}</p>
                                                    </React.Fragment>
                                                )}
                                                {res.percepcionesDetalladas.map((p, index) => (
                                                    <React.Fragment key={index}>
                                                        <p className="truncate pr-1" title={p.name}>{p.name}:</p>
                                                        <p className="text-right">{formatCurrency(p.value)}</p>
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="col-span-2 border-t border-slate-600 my-1 pt-2">
                                            <h5 className="font-semibold mb-1">Desglose ISR:</h5>
                                            <div className="grid grid-cols-2 gap-x-2">
                                                <p>ISR Bruto:</p><p className="text-right">{formatCurrency(details.isr + details.subsidioEmpleo)}</p>
                                                <p>(-) Subsidio Empleo:</p><p className="text-right">{formatCurrency(details.subsidioEmpleo)}</p>
                                            </div>
                                        </div>

                                        <div className="col-span-2 border-t border-slate-600 my-1 pt-2">
                                            <h5 className="font-semibold mb-1">Desglose IMSS Obrero:</h5>
                                            <div className="grid grid-cols-2 gap-x-2">
                                                <p>Excedente:</p><p className="text-right">{formatCurrency(details.imssObreroDetalle.excedente)}</p>
                                                <p>Prest. Dinero:</p><p className="text-right">{formatCurrency(details.imssObreroDetalle.prestacionesDinero)}</p>
                                                <p>Gastos Médicos:</p><p className="text-right">{formatCurrency(details.imssObreroDetalle.gastosMedicos)}</p>
                                                <p>Invalidez y Vida:</p><p className="text-right">{formatCurrency(details.imssObreroDetalle.invalidezVida)}</p>
                                                <p>Cesantía y Vejez:</p><p className="text-right">{formatCurrency(details.imssObreroDetalle.cesantiaVejez)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );

                             const desiredNetTooltip = (
                                <div className="text-left text-xs space-y-1">
                                    <h4 className="font-bold">Salario Neto Deseado</h4>
                                    <p>Ingresa el monto neto que deseas que el empleado reciba. La calculadora ajustará el "Sueldo Mensual Base" y todos los costos relacionados para alcanzar este objetivo.</p>
                                    <p className="pt-1 mt-1 border-t border-slate-600">Deja el campo vacío para volver al cálculo original basado en el sueldo diario.</p>
                                </div>
                            );
                            
                            const commonCells = (
                                <>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 align-top border-b border-slate-200">{formatCurrency(res.salarioDiario)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 align-top border-b border-slate-200">
                                        <InteractiveCell tooltipContent={sdiTooltip} value={formatCurrency(res.sdi)} position={tooltipPosition} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium align-top border-b border-slate-200">
                                        <InteractiveCell tooltipContent={imssTooltip} value={formatCurrency(res.imss)} position={tooltipPosition} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium align-top border-b border-slate-200">
                                        <InteractiveCell tooltipContent={retiroTooltip} value={formatCurrency(res.retiro)} position={tooltipPosition} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium align-top border-b border-slate-200">
                                        <InteractiveCell tooltipContent={cyvTooltip} value={formatCurrency(res.cesantiaVejez)} position={tooltipPosition} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium align-top border-b border-slate-200">
                                        <InteractiveCell tooltipContent={infonavitTooltip} value={formatCurrency(res.infonavit)} position={tooltipPosition} />
                                    </td>
                                     <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium align-top border-b border-slate-200">
                                        <InteractiveCell tooltipContent={aguinaldoMensualTooltip} value={formatCurrency(res.aguinaldoMensual)} position={tooltipPosition} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium align-top border-b border-slate-200">
                                        <InteractiveCell tooltipContent={primaVacacionalMensualTooltip} value={formatCurrency(res.primaVacacionalMensual)} position={tooltipPosition} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 align-top border-b border-slate-200">
                                        <InteractiveCell tooltipContent={isnTooltip} value={formatCurrency(res.isn)} position={tooltipPosition} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-700 align-top border-b border-slate-200">
                                        <InteractiveCell tooltipContent={costoTotalTooltip} value={formatCurrency(res.costoTotal)} position={tooltipPosition} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-700 align-top border-b border-slate-200">
                                        <InteractiveCell tooltipContent={factorTooltip} value={formatFactor(res.factor)} position={tooltipPosition} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-emerald-700 align-top border-b border-slate-200">
                                        <InteractiveCell tooltipContent={salarioNetoTooltip} value={formatCurrency(res.salarioNeto)} position={tooltipPosition} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm align-top border-b border-slate-200">
                                        <Tooltip content={desiredNetTooltip} position={tooltipPosition}>
                                            <input
                                                type="number"
                                                value={desiredNetSalaries.get(res.id) ?? ''}
                                                placeholder={formatCurrency(res.salarioNeto)}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    onDesiredNetChange(res.id, value === '' ? null : parseFloat(value));
                                                }}
                                                className="w-32 px-2 py-1 bg-slate-50 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </Tooltip>
                                    </td>
                                </>
                            );

                            return (
                                <tr key={res.id} className="group/row transition-colors hover:bg-slate-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 align-top font-mono sticky left-0 z-20 bg-white group-hover/row:bg-slate-50 w-28 border-b border-slate-200 border-r border-slate-200">{res.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 align-top sticky left-[7rem] z-20 bg-white group-hover/row:bg-slate-50 w-64 border-b border-slate-200 border-r border-slate-200">{res.employeeName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 align-top sticky left-[23rem] z-20 bg-white group-hover/row:bg-slate-50 w-40 border-b border-slate-200 border-r border-slate-200">
                                        <select
                                            value={res.benefitScheme}
                                            onChange={(e) => onSchemeChange(res.id, e.target.value as BenefitSchemeType)}
                                            className="w-full p-1 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
                                        >
                                            {Object.entries(BENEFIT_SCHEMES).map(([key, scheme]) => (
                                                <option key={key} value={key}>{scheme.name}</option>
                                            ))}
                                        </select>
                                    </td>
                                    {layout === 'vertical' ? (
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 align-top border-b border-slate-200">
                                            <div className="flex flex-col space-y-1 w-64">
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500 truncate pr-2">Sueldo Mensual Base:</span>
                                                    <span className="font-medium text-slate-700">{formatCurrency(res.sueldoMensualBase)}</span>
                                                </div>
                                                {res.percepcionesDetalladas.map((p, index) => (
                                                    <div key={index} className="flex justify-between">
                                                        <span className="text-slate-500 truncate pr-2">{p.name}:</span>
                                                        <span className="font-medium text-slate-700">{formatCurrency(p.value)}</span>
                                                    </div>
                                                ))}
                                                <div className="border-t border-slate-200 mt-2 pt-2 flex justify-between">
                                                    <span className="font-bold text-slate-600">Total:</span>
                                                    <span className="font-bold text-slate-800">{formatCurrency(res.totalPercepciones)}</span>
                                                </div>
                                            </div>
                                        </td>
                                    ) : (
                                        <>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 align-top border-b border-slate-200">{formatCurrency(res.sueldoMensualBase)}</td>
                                            {percepcionHeaders.map(header => {
                                                const p = res.percepcionesDetalladas.find(pd => pd.name === header);
                                                return (
                                                    <td key={header} className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 align-top border-b border-slate-200">
                                                        {p ? formatCurrency(p.value) : formatCurrency(0)}
                                                    </td>
                                                );
                                            })}
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800 font-bold align-top border-b border-slate-200">{formatCurrency(res.totalPercepciones)}</td>
                                        </>
                                    )}
                                    {commonCells}
                                </tr>
                            );
                        })}
                    </tbody>
                     {totals && (
                        <tfoot>
                            {(() => {
                                const totalCostoTotalTooltip = (
                                    <div className="text-left text-xs space-y-1">
                                        <h4 className="font-bold">Costo Total Global</h4>
                                        <p>Percepciones: <span className="float-right">{formatCurrency(totals.totalPercepciones)}</span></p>
                                        <p>Cargas Sociales: <span className="float-right">{formatCurrency(totals.imss + totals.retiro + totals.cesantiaVejez + totals.infonavit)}</span></p>
                                        <p>Provisiones: <span className="float-right">{formatCurrency(totals.aguinaldoMensual + totals.primaVacacionalMensual)}</span></p>
                                        <p>Impuesto Nómina: <span className="float-right">{formatCurrency(totals.isn)}</span></p>
                                        <div className="border-t border-slate-600 my-1 pt-1">
                                            <p className="font-bold">Total: <span className="float-right">{formatCurrency(totals.costoTotal)}</span></p>
                                        </div>
                                    </div>
                                );

                                const totalFactorTooltip = (
                                    <div className="text-left text-xs space-y-1">
                                        <h4 className="font-bold">Factor de Costo Promedio</h4>
                                        <p>Costo promedio por cada peso de sueldo base mensual.</p>
                                        <p className="font-mono">{`${formatCurrency(totals.costoTotal)} / ${formatCurrency(totals.sueldoMensualBase)}`}</p>
                                    </div>
                                );

                                const totalImssTooltip = (
                                    <div className="grid grid-cols-2 gap-x-4 text-xs">
                                        <div className="col-span-2">
                                            <h4 className="font-bold">Desglose Total IMSS Patronal</h4>
                                            <div className="border-t border-slate-600 my-1"></div>
                                        </div>
                                        <div>Cuota Fija:</div><div className="font-bold text-right">{formatCurrency(totals.details.cuotaFija)}</div>
                                        <div>Excedente:</div><div className="font-bold text-right">{formatCurrency(totals.details.excedente)}</div>
                                        <div>Prest. Dinero:</div><div className="font-bold text-right">{formatCurrency(totals.details.prestacionesDinero)}</div>
                                        <div>Gastos Médicos:</div><div className="font-bold text-right">{formatCurrency(totals.details.gastosMedicos)}</div>
                                        <div>Invalidez y Vida:</div><div className="font-bold text-right">{formatCurrency(totals.details.invalidezVida)}</div>
                                        <div>Guarderías:</div><div className="font-bold text-right">{formatCurrency(totals.details.guarderias)}</div>
                                        <div>Riesgo de Trabajo:</div><div className="font-bold text-right">{formatCurrency(totals.details.riesgoTrabajo)}</div>
                                        <div className="col-span-2 border-t border-slate-600 pt-1 mt-1 flex justify-between font-bold">
                                            <p>Total:</p><p>{formatCurrency(totals.imss)}</p>
                                        </div>
                                    </div>
                                );
                                
                                const totalSalarioNetoTooltip = (
                                    <div className="text-left text-xs space-y-1">
                                        <h4 className="font-bold">Total Salario Neto</h4>
                                        <p>Suma de los salarios netos de todos los empleados.</p>
                                        <p className="font-bold pt-1 border-t border-slate-600 mt-1">Total: <span className="float-right">{formatCurrency(totals.salarioNeto)}</span></p>
                                    </div>
                                );
                                
                                const totalDesiredNetTooltip = (
                                    <div className="text-left text-xs space-y-1">
                                        <h4 className="font-bold">Total Neto Deseado</h4>
                                        <p>Suma de los salarios netos deseados de todos los empleados.</p>
                                        <p className="font-bold pt-1 border-t border-slate-600 mt-1">Total: <span className="float-right">{formatCurrency(totals.desiredNet)}</span></p>
                                    </div>
                                );

                                const genericTotalTooltip = (title: string, value: number) => (
                                    <div className="text-left text-xs space-y-1">
                                        <h4 className="font-bold">{title}</h4>
                                        <p>Suma de las aportaciones de todos los empleados.</p>
                                        <p className="font-bold pt-1 border-t border-slate-600 mt-1">Total: <span className="float-right">{formatCurrency(value)}</span></p>
                                    </div>
                                );

                                return (
                                    <tr className="font-bold text-slate-800 bg-slate-200">
                                        <td className="sticky bottom-0 left-0 z-20 bg-slate-200 px-6 py-4 text-sm text-left uppercase tracking-wider border-t border-slate-300 w-28 border-r border-slate-300">Totales</td>
                                        <td className="sticky bottom-0 left-[7rem] z-20 bg-slate-200 px-6 py-4 border-t border-slate-300 w-64 border-r border-slate-300"></td>
                                        <td className="sticky bottom-0 left-[23rem] z-20 bg-slate-200 px-6 py-4 border-t border-slate-300 w-40 border-r border-slate-300"></td>
                                        {layout === 'vertical' ? (
                                            <td className="sticky bottom-0 z-10 bg-slate-200 px-6 py-4 whitespace-nowrap text-sm border-t border-slate-300">
                                                <InteractiveCell tooltipContent={genericTotalTooltip('Total Percepciones Mensuales', totals.totalPercepciones)} value={formatCurrency(totals.totalPercepciones)} position="top" />
                                            </td>
                                        ) : (
                                            <>
                                                <td className="sticky bottom-0 z-10 bg-slate-200 px-6 py-4 whitespace-nowrap text-sm border-t border-slate-300">{formatCurrency(totals.sueldoMensualBase)}</td>
                                                {percepcionHeaders.map(header => (
                                                    <td key={`total-${header}`} className="sticky bottom-0 z-10 bg-slate-200 px-6 py-4 whitespace-nowrap text-sm border-t border-slate-300">
                                                        {formatCurrency(totals.percepcionesDetalladas.get(header) || 0)}
                                                    </td>
                                                ))}
                                                <td className="sticky bottom-0 z-10 bg-slate-200 px-6 py-4 whitespace-nowrap text-sm border-t border-slate-300">{formatCurrency(totals.totalPercepciones)}</td>
                                            </>
                                        )}
                                        <td className="sticky bottom-0 z-10 bg-slate-200 px-6 py-4 border-t border-slate-300"></td>
                                        <td className="sticky bottom-0 z-10 bg-slate-200 px-6 py-4 border-t border-slate-300"></td>
                                        <td className="sticky bottom-0 z-10 bg-slate-200 px-6 py-4 whitespace-nowrap text-sm text-red-700 border-t border-slate-300">
                                            <InteractiveCell tooltipContent={totalImssTooltip} value={formatCurrency(totals.imss)} position="top" />
                                        </td>
                                        <td className="sticky bottom-0 z-10 bg-slate-200 px-6 py-4 whitespace-nowrap text-sm text-red-700 border-t border-slate-300">
                                            <InteractiveCell tooltipContent={genericTotalTooltip('Total Retiro Pat.', totals.retiro)} value={formatCurrency(totals.retiro)} position="top" />
                                        </td>
                                        <td className="sticky bottom-0 z-10 bg-slate-200 px-6 py-4 whitespace-nowrap text-sm text-red-700 border-t border-slate-300">
                                            <InteractiveCell tooltipContent={genericTotalTooltip('Total C y V Pat.', totals.cesantiaVejez)} value={formatCurrency(totals.cesantiaVejez)} position="top" />
                                        </td>
                                        <td className="sticky bottom-0 z-10 bg-slate-200 px-6 py-4 whitespace-nowrap text-sm text-red-700 border-t border-slate-300">
                                            <InteractiveCell tooltipContent={genericTotalTooltip('Total INFONAVIT Pat.', totals.infonavit)} value={formatCurrency(totals.infonavit)} position="top" />
                                        </td>
                                        <td className="sticky bottom-0 z-10 bg-slate-200 px-6 py-4 whitespace-nowrap text-sm text-red-700 border-t border-slate-300">
                                            <InteractiveCell tooltipContent={genericTotalTooltip('Total Aguinaldo Mensual', totals.aguinaldoMensual)} value={formatCurrency(totals.aguinaldoMensual)} position="top" />
                                        </td>
                                        <td className="sticky bottom-0 z-10 bg-slate-200 px-6 py-4 whitespace-nowrap text-sm text-red-700 border-t border-slate-300">
                                            <InteractiveCell tooltipContent={genericTotalTooltip('Total Prima Vac. Mensual', totals.primaVacacionalMensual)} value={formatCurrency(totals.primaVacacionalMensual)} position="top" />
                                        </td>
                                        <td className="sticky bottom-0 z-10 bg-slate-200 px-6 py-4 whitespace-nowrap text-sm text-red-700 border-t border-slate-300">
                                            <InteractiveCell tooltipContent={genericTotalTooltip('Total Costo ISN Mensual', totals.isn)} value={formatCurrency(totals.isn)} position="top" />
                                        </td>
                                        <td className="sticky bottom-0 z-10 bg-slate-200 px-6 py-4 whitespace-nowrap text-sm text-blue-800 border-t border-slate-300">
                                            <InteractiveCell tooltipContent={totalCostoTotalTooltip} value={formatCurrency(totals.costoTotal)} position="top" />
                                        </td>
                                        <td className="sticky bottom-0 z-10 bg-slate-200 px-6 py-4 whitespace-nowrap text-sm text-green-800 border-t border-slate-300">
                                            <InteractiveCell tooltipContent={totalFactorTooltip} value={formatFactor(totals.totalFactor)} position="top" />
                                        </td>
                                        <td className="sticky bottom-0 z-10 bg-slate-200 px-6 py-4 whitespace-nowrap text-sm text-emerald-800 border-t border-slate-300">
                                            <InteractiveCell tooltipContent={totalSalarioNetoTooltip} value={formatCurrency(totals.salarioNeto)} position="top" />
                                        </td>
                                        <td className="sticky bottom-0 z-10 bg-slate-200 px-6 py-4 whitespace-nowrap text-sm text-emerald-800 border-t border-slate-300">
                                            <InteractiveCell tooltipContent={totalDesiredNetTooltip} value={formatCurrency(totals.desiredNet)} position="top" />
                                        </td>
                                    </tr>
                                );
                            })()}
                        </tfoot>
                    )}
                </table>
            </div>
             {scrollState !== 'none' && (
                <button
                    onClick={handleScrollButtonClick}
                    className="absolute bottom-4 right-4 bg-blue-600 text-white rounded-full p-3 shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all z-40"
                    aria-label={scrollState === 'bottom' ? 'Desplazarse al final' : 'Desplazarse al principio'}
                >
                    {scrollState === 'bottom' ? (
                        <ArrowDownIcon className="h-6 w-6" />
                    ) : (
                        <ArrowUpIcon className="h-6 w-6" />
                    )}
                </button>
            )}
        </div>
    );
};