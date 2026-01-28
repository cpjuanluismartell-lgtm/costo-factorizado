
import React, { useState } from 'react';
import { DAYS_IN_MONTH, SUBSIDY_INCOME_CAP, SUBSIDY_UMA_MULTIPLIER_2026, SUBSIDY_UMA_MULTIPLIER_JAN_2026, CESANTIA_VEJEZ_TABLE } from '../constants';

type IsrTableRow = {
    lowerLimit: number;
    upperLimit: number | string;
    fixedQuota: number;
    percentOverExcess: number;
};

type CyVTableRow = typeof CESANTIA_VEJEZ_TABLE[0];


interface DataTablesPanelProps {
    isrTable: IsrTableRow[];
    cyvTable: CyVTableRow[];
    uma: number;
    calculationDate: Date;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
    }).format(value);
};

export const DataTablesPanel: React.FC<DataTablesPanelProps> = ({ isrTable, cyvTable, uma, calculationDate }) => {
    const [activeTab, setActiveTab] = useState<'isr' | 'subsidy' | 'cyv'>('isr');
    const currentYear = calculationDate.getFullYear();
    const tableYears = Object.keys(cyvTable[0].rates);

    const renderIsrTable = () => (
        <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                    <tr>
                        <th scope="col" className="px-4 py-2">Límite Inferior</th>
                        <th scope="col" className="px-4 py-2">Límite Superior</th>
                        <th scope="col" className="px-4 py-2">Cuota Fija</th>
                        <th scope="col" className="px-4 py-2">% Excedente</th>
                    </tr>
                </thead>
                <tbody>
                    {isrTable.map((row, index) => (
                        <tr key={index} className="bg-white border-b border-slate-200 hover:bg-slate-50">
                            <td className="px-4 py-2">{formatCurrency(row.lowerLimit)}</td>
                            <td className="px-4 py-2">{typeof row.upperLimit === 'number' ? formatCurrency(row.upperLimit) : 'En adelante'}</td>
                            <td className="px-4 py-2">{formatCurrency(row.fixedQuota)}</td>
                            <td className="px-4 py-2">{row.percentOverExcess.toFixed(2)}%</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const renderSubsidyInfo = () => {
        const monthlyUMA = uma * DAYS_IN_MONTH;
        const generalSubsidy = monthlyUMA * SUBSIDY_UMA_MULTIPLIER_2026;
        const janSubsidy = monthlyUMA * SUBSIDY_UMA_MULTIPLIER_JAN_2026;

        return (
            <div className="p-4 text-sm text-slate-700 space-y-3">
                <h3 className="font-bold text-base text-slate-800">Regla de Subsidio al Empleo (Ejercicio 2026)</h3>
                <p>Para ingresos mensuales que no excedan <strong>{formatCurrency(SUBSIDY_INCOME_CAP)}</strong>, se aplica un subsidio basado en el valor de la UMA mensual.</p>
                <ul className="list-disc list-inside space-y-2 bg-slate-50 p-3 rounded-md border border-slate-200">
                    <li>
                        <strong>Subsidio General:</strong> {(SUBSIDY_UMA_MULTIPLIER_2026 * 100).toFixed(2)}% del valor de la UMA mensual.
                        <span className="block text-xs text-slate-500 pl-4">Equivalente a: <strong>{formatCurrency(generalSubsidy)}</strong> (calculado con UMA de {formatCurrency(uma)})</span>
                    </li>
                    <li>
                        <strong>Subsidio Transitorio (Enero):</strong> {(SUBSIDY_UMA_MULTIPLIER_JAN_2026 * 100).toFixed(2)}% del valor de la UMA mensual.
                        <span className="block text-xs text-slate-500 pl-4">Equivalente a: <strong>{formatCurrency(janSubsidy)}</strong> (calculado con UMA de {formatCurrency(uma)})</span>
                    </li>
                </ul>
                <p className="pt-2 border-t border-slate-200">Ingresos mensuales superiores a {formatCurrency(SUBSIDY_INCOME_CAP)} no son elegibles para el subsidio.</p>
            </div>
        );
    };


    const renderCyVTable = () => (
         <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left text-slate-600 border-collapse">
                <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                    <tr>
                        <th scope="col" className="px-4 py-2 sticky left-0 bg-slate-100 z-10 w-40">Salario Base de Cotización</th>
                        {tableYears.map(year => (
                            <th key={year} scope="col" className={`px-4 py-2 text-center transition-colors ${parseInt(year) === currentYear ? 'bg-blue-200 text-blue-800' : ''}`}>
                                {year}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {cyvTable.map((row, index) => (
                        <tr key={index} className="bg-white border-b border-slate-200 hover:bg-slate-50">
                            <td className="px-4 py-2 font-medium sticky left-0 bg-white hover:bg-slate-50 z-10 w-40">{row.range}</td>
                            {tableYears.map(year => (
                                <td key={`${index}-${year}`} className={`px-4 py-2 text-center transition-colors ${parseInt(year) === currentYear ? 'bg-blue-50 font-semibold text-blue-700' : ''}`}>
                                    {row.rates[year].toFixed(2)}%
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const getTabClass = (tabName: 'isr' | 'subsidy' | 'cyv') => {
        return `px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === tabName
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-600 hover:bg-slate-200'
        }`;
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
            <h2 className="text-xl font-bold text-slate-700 mb-4">Tablas de Referencia</h2>
            <div className="mb-4 flex space-x-2 border-b border-slate-200 pb-2">
                <button onClick={() => setActiveTab('isr')} className={getTabClass('isr')}>ISR</button>
                <button onClick={() => setActiveTab('subsidy')} className={getTabClass('subsidy')}>Subsidio</button>
                <button onClick={() => setActiveTab('cyv')} className={getTabClass('cyv')}>C y V Patronal</button>
            </div>
            <div className="max-h-64 overflow-y-auto">
                {activeTab === 'isr' && renderIsrTable()}
                {activeTab === 'subsidy' && renderSubsidyInfo()}
                {activeTab === 'cyv' && renderCyVTable()}
            </div>
        </div>
    );
};