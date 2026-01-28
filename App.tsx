import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { ConfigPanel } from './components/ConfigPanel';
import { ResultsTable } from './components/ResultsTable';
import { InfoIcon, ResetIcon, DownloadIcon, ChevronDownIcon } from './components/icons';
import { DEFAULT_UMA, DEFAULT_WORK_RISK, DEFAULT_ISN, BENEFIT_SCHEMES, BenefitSchemeType } from './constants';
import type { ParsedData, CalculationResult } from './types';
import { CalculationDatePanel } from './components/CalculationDatePanel';
import { DataTablesPanel } from './components/DataTablesPanel';
import { ISR_MONTHLY_TABLE, CESANTIA_VEJEZ_TABLE } from './constants';
import { calculateForward, calculateBackward } from './utils/calculation';

function App() {
    const [rawText, setRawText] = useState('');
    const [uma, setUma] = useState(DEFAULT_UMA);
    const [workRisk, setWorkRisk] = useState(DEFAULT_WORK_RISK);
    const [isn, setIsn] = useState(DEFAULT_ISN);
    const [employeeIdCol, setEmployeeIdCol] = useState<number>(0);
    const [employeeNameCol, setEmployeeNameCol] = useState<number>(1);
    const [hireDateCol, setHireDateCol] = useState<number>(2);
    const [dailySalaryCol, setDailySalaryCol] = useState<number>(3);
    const [configSaved, setConfigSaved] = useState(false);
    const [percepcionesLayout, setPercepcionesLayout] = useState<'vertical' | 'horizontal'>('vertical');
    const [results, setResults] = useState<CalculationResult[]>([]);
    const [calculationDate, setCalculationDate] = useState(new Date());
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    const exportMenuRef = useRef<HTMLDivElement>(null);
    const [desiredNetSalaries, setDesiredNetSalaries] = useState<Map<string, number | null>>(new Map());
    const [originalRows, setOriginalRows] = useState<Map<string, (string | number)[]>>(new Map());

    useEffect(() => {
        const savedConfigRaw = localStorage.getItem('payrollConfig');
        if (savedConfigRaw) {
            try {
                const savedConfig = JSON.parse(savedConfigRaw);
                if (typeof savedConfig.uma === 'number') setUma(savedConfig.uma);
                if (typeof savedConfig.workRisk === 'number') setWorkRisk(savedConfig.workRisk);
                if (typeof savedConfig.isn === 'number') setIsn(savedConfig.isn);
            } catch (error) {
                console.error("Failed to parse saved config from localStorage:", error);
                localStorage.removeItem('payrollConfig');
            }
        }
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
                setIsExportMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const parsedData: ParsedData = useMemo(() => {
        if (!rawText.trim()) return { headers: [], rows: [] };
        const rows = rawText.trim().split('\n').map(row => row.split('\t'));
        const headers = rows[0] || [];
        const dataRows = rows.slice(1);
        
        const newOriginalRows = new Map<string, (string | number)[]>();
        dataRows.forEach(row => {
            const employeeId = String(row[employeeIdCol] || `row-${Math.random()}`);
            newOriginalRows.set(employeeId, row);
        });
        setOriginalRows(newOriginalRows);

        return { headers, rows: dataRows };
    }, [rawText, employeeIdCol]);

    const percepcionColumns = useMemo(() => {
        const requiredCols = new Set([employeeIdCol, employeeNameCol, hireDateCol, dailySalaryCol]);
        if (parsedData.headers.length === 0) return [];
        return parsedData.headers
            .map((_, i) => i)
            .filter(i => !requiredCols.has(i));
    }, [parsedData.headers, employeeIdCol, employeeNameCol, hireDateCol, dailySalaryCol]);

    const percepcionHeaders = useMemo(() => 
        percepcionColumns.map(i => parsedData.headers[i]), 
        [percepcionColumns, parsedData.headers]
    );

    const calculateAllResults = useCallback(() => {
        const requiredCols = new Set([employeeIdCol, employeeNameCol, hireDateCol, dailySalaryCol]);
        if (parsedData.rows.length === 0 || requiredCols.size < 4) {
            setResults([]);
            return;
        }

        const newResults = parsedData.rows.map(row => {
            const employeeId = String(row[employeeIdCol]);
            const desiredNet = desiredNetSalaries.get(employeeId);

            if (desiredNet !== undefined && desiredNet !== null) {
                return calculateBackward({
                    row,
                    desiredNet,
                    benefitScheme: 'ley', // Initial scheme, will be updated
                    calculationDate,
                    config: { uma, workRisk, isn },
                    columnMapping: { employeeIdCol, employeeNameCol, hireDateCol, dailySalaryCol, percepcionColumns },
                    headers: parsedData.headers
                });
            } else {
                 return calculateForward({
                    row,
                    benefitScheme: 'ley',
                    calculationDate,
                    config: { uma, workRisk, isn },
                    columnMapping: { employeeIdCol, employeeNameCol, hireDateCol, dailySalaryCol, percepcionColumns },
                    headers: parsedData.headers
                });
            }
        }).filter((r): r is CalculationResult => r !== null);
        
        setResults(newResults);
    }, [parsedData, uma, workRisk, isn, employeeIdCol, employeeNameCol, hireDateCol, dailySalaryCol, calculationDate, desiredNetSalaries]);


    useEffect(() => {
        calculateAllResults();
    }, [calculateAllResults]);

    const handleSchemeChange = useCallback((employeeId: string, newScheme: BenefitSchemeType) => {
        const originalRow = originalRows.get(employeeId);
        if (!originalRow) return;

        const desiredNet = desiredNetSalaries.get(employeeId);
        let updatedResult: CalculationResult | null;
        
        if(desiredNet !== undefined && desiredNet !== null){
             updatedResult = calculateBackward({
                row: originalRow,
                desiredNet,
                benefitScheme: newScheme,
                calculationDate,
                config: { uma, workRisk, isn },
                columnMapping: { employeeIdCol, employeeNameCol, hireDateCol, dailySalaryCol, percepcionColumns },
                headers: parsedData.headers
            });
        } else {
            updatedResult = calculateForward({
                row: originalRow,
                benefitScheme: newScheme,
                calculationDate,
                config: { uma, workRisk, isn },
                columnMapping: { employeeIdCol, employeeNameCol, hireDateCol, dailySalaryCol, percepcionColumns },
                headers: parsedData.headers
            });
        }
        
        if (!updatedResult) return;
        setResults(prevResults => prevResults.map(res => res.id === employeeId ? updatedResult : res));
    }, [originalRows, employeeIdCol, calculationDate, uma, workRisk, isn, percepcionColumns, parsedData.headers, desiredNetSalaries]);
    
    const handleDesiredNetChange = useCallback((employeeId: string, newDesiredNet: number | null) => {
        const originalRow = originalRows.get(employeeId);
        if (!originalRow) return;

        setDesiredNetSalaries(prev => new Map(prev).set(employeeId, newDesiredNet));

        // Find the current benefit scheme for the employee
        const currentResult = results.find(r => r.id === employeeId);
        const currentScheme = currentResult?.benefitScheme || 'ley';

        let updatedResult: CalculationResult | null;
        if (newDesiredNet !== null) {
             updatedResult = calculateBackward({
                row: originalRow,
                desiredNet: newDesiredNet,
                benefitScheme: currentScheme,
                calculationDate,
                config: { uma, workRisk, isn },
                columnMapping: { employeeIdCol, employeeNameCol, hireDateCol, dailySalaryCol, percepcionColumns },
                headers: parsedData.headers
            });
        } else {
            updatedResult = calculateForward({
                row: originalRow,
                benefitScheme: currentScheme,
                calculationDate,
                config: { uma, workRisk, isn },
                columnMapping: { employeeIdCol, employeeNameCol, hireDateCol, dailySalaryCol, percepcionColumns },
                headers: parsedData.headers
            });
        }
        
        if (!updatedResult) return;
        setResults(prevResults => prevResults.map(res => res.id === employeeId ? updatedResult : res));
    }, [originalRows, results, calculationDate, uma, workRisk, isn, employeeIdCol, employeeNameCol, hireDateCol, dailySalaryCol, percepcionColumns, parsedData.headers]);


    const handleReset = useCallback(() => {
        setRawText('');
        setEmployeeIdCol(0);
        setEmployeeNameCol(1);
        setHireDateCol(2);
        setDailySalaryCol(3);
        setResults([]);
        setDesiredNetSalaries(new Map());
        setOriginalRows(new Map());
    }, []);

    const handleSaveConfig = useCallback(() => {
        const configToSave = { uma, workRisk, isn };
        localStorage.setItem('payrollConfig', JSON.stringify(configToSave));
        setConfigSaved(true);
        setTimeout(() => setConfigSaved(false), 3000);
    }, [uma, workRisk, isn]);

    const handleExportToCSV = useCallback(() => {
        if (results.length === 0) return;
        const headers = ["Código", "Empleado", "Prestaciones", "Sueldo Mensual Base", ...percepcionHeaders, "Total Percepciones", "Salario Diario", "SDI", "IMSS Patronal", "Retiro Pat.", "C y V Pat.", "INFONAVIT Pat.", "Aguinaldo Mensual", "Prima Vac. Mensual", "Costo ISN Mensual", "Costo Total Empresa", "Factor de Costo", "Salario Neto", "Neto Deseado"];
        const escapeCsvCell = (cell: any): string => {
            const strCell = String(cell ?? '');
            if (strCell.includes(',') || strCell.includes('"') || strCell.includes('\n')) return `"${strCell.replace(/"/g, '""')}"`;
            return strCell;
        };
        const csvRows = [headers.map(escapeCsvCell).join(',')];
        results.forEach(res => {
            const schemeName = BENEFIT_SCHEMES[res.benefitScheme]?.name || 'N/A';
            const perceptionValues = percepcionHeaders.map(header => res.percepcionesDetalladas.find(pd => pd.name === header)?.value || 0);
            const desiredNet = desiredNetSalaries.get(res.id);
            const row = [res.id, res.employeeName, schemeName, res.sueldoMensualBase, ...perceptionValues, res.totalPercepciones, res.salarioDiario, res.sdi, res.imss, res.retiro, res.cesantiaVejez, res.infonavit, res.aguinaldoMensual, res.primaVacacionalMensual, res.isn, res.costoTotal, res.factor.toFixed(4), res.salarioNeto, desiredNet ?? res.salarioNeto];
            csvRows.push(row.map(escapeCsvCell).join(','));
        });
        const csvString = csvRows.join('\n');
        const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "resultados_costo_factorizado.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [results, percepcionHeaders, desiredNetSalaries]);

    const handleExportToXLSX = useCallback(() => {
        if (results.length === 0) return;
        // @ts-ignore
        const XLSX = window.XLSX;
        if (!XLSX) {
            alert("La librería de exportación no se ha cargado. Por favor, recarga la página.");
            return;
        }

        const dataToExport = results.map(res => {
            const schemeName = BENEFIT_SCHEMES[res.benefitScheme]?.name || 'N/A';
            const perceptionValues: {[key: string]: number} = {};
            percepcionHeaders.forEach(header => {
                const p = res.percepcionesDetalladas.find(pd => pd.name === header);
                perceptionValues[header] = p ? p.value : 0;
            });
            const desiredNet = desiredNetSalaries.get(res.id);

            return {
                "Código": res.id,
                "Empleado": res.employeeName,
                "Prestaciones": schemeName,
                "Sueldo Mensual Base": res.sueldoMensualBase,
                ...perceptionValues,
                "Total Percepciones": res.totalPercepciones,
                "Salario Diario": res.salarioDiario,
                "SDI": res.sdi,
                "IMSS Patronal": res.imss,
                "Retiro Pat.": res.retiro,
                "C y V Pat.": res.cesantiaVejez,
                "INFONAVIT Pat.": res.infonavit,
                "Aguinaldo Mensual": res.aguinaldoMensual,
                "Prima Vac. Mensual": res.primaVacacionalMensual,
                "Costo ISN Mensual": res.isn,
                "Costo Total Empresa": res.costoTotal,
                "Factor de Costo": parseFloat(res.factor.toFixed(4)),
                "Salario Neto": res.salarioNeto,
                "Neto Deseado": desiredNet ?? res.salarioNeto
            };
        });

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Resultados");
        XLSX.writeFile(wb, "resultados_costo_factorizado.xlsx");
    }, [results, percepcionHeaders, desiredNetSalaries]);


    const ColumnSelector = ({ label, value, onChange, headers }: { label: string, value: number, onChange: (val: number) => void, headers: string[] }) => (
        <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">{label}</label>
            <select value={value} onChange={(e) => onChange(parseInt(e.target.value))} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                {headers.map((h, i) => <option key={`${label}-${i}`} value={i}>{h}</option>)}
            </select>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-100 p-4 sm:p-6 lg:p-8">
            <div className="max-w-full mx-auto">
                <header className="text-center mb-8">
                    <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">Calculadora de Costo Factorizado</h1>
                    <p className="mt-2 text-lg text-slate-600">Pega los datos de tu nómina desde Excel para calcular el costo total para la empresa.</p>
                </header>

                <main className="space-y-8">
                    <div>
                        {results.length > 0 ? (
                            <>
                                <div className="flex justify-end items-center mb-4 space-x-4">
                                    <div ref={exportMenuRef} className="relative">
                                        <button onClick={() => setIsExportMenuOpen(!isExportMenuOpen)} className="flex items-center bg-green-600 text-white font-bold py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 ease-in-out text-sm">
                                            <DownloadIcon className="h-4 w-4 mr-2" />
                                            Exportar
                                            <ChevronDownIcon className="h-4 w-4 ml-1" />
                                        </button>
                                        {isExportMenuOpen && (
                                            <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                                                <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                                                    <button onClick={() => { handleExportToXLSX(); setIsExportMenuOpen(false); }} className="w-full text-left block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900" role="menuitem">Descargar como .xlsx</button>
                                                    <button onClick={() => { handleExportToCSV(); setIsExportMenuOpen(false); }} className="w-full text-left block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900" role="menuitem">Descargar como .csv</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <label htmlFor="layout-checkbox" className="flex items-center text-sm font-medium text-slate-700 cursor-pointer">
                                        <input id="layout-checkbox" type="checkbox" checked={percepcionesLayout === 'horizontal'} onChange={(e) => setPercepcionesLayout(e.target.checked ? 'horizontal' : 'vertical')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                        <span className="ml-2">Mostrar percepciones en columnas</span>
                                    </label>
                                </div>
                                <ResultsTable 
                                    results={results} 
                                    uma={uma} 
                                    workRisk={workRisk} 
                                    isn={isn} 
                                    layout={percepcionesLayout} 
                                    percepcionHeaders={percepcionHeaders} 
                                    onSchemeChange={handleSchemeChange}
                                    desiredNetSalaries={desiredNetSalaries}
                                    onDesiredNetChange={handleDesiredNetChange}
                                />
                            </>
                        ) : (
                           parsedData.rows.length > 0 && (
                                <div className="flex flex-col items-center justify-center text-center bg-white p-10 rounded-xl shadow-lg border border-slate-200 h-full">
                                    <div className="bg-blue-100 p-4 rounded-full"><InfoIcon className="h-8 w-8 text-blue-600" /></div>
                                    <h3 className="mt-4 text-xl font-bold text-slate-700">No hay resultados para mostrar</h3>
                                    <p className="mt-1 text-slate-500 max-w-md">Verifica el mapeo de columnas. Asegúrate de que las columnas de 'Fecha de Ingreso' y 'Sueldo Diario' contengan datos válidos y que existan columnas de percepciones con valores numéricos.</p>
                                </div>
                           )
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1 space-y-8">
                            <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-bold text-slate-700">Pegar Datos de Nómina</h2>
                                    <button onClick={handleReset} className="flex items-center text-sm text-slate-500 hover:text-blue-600 transition-colors"><ResetIcon className="h-4 w-4 mr-1" /> Limpiar</button>
                                </div>
                                <textarea value={rawText} onChange={(e) => setRawText(e.target.value)} placeholder="Copia una tabla de Excel (incluyendo encabezados) y pégala aquí..." className="w-full h-48 p-3 bg-slate-50 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow" />
                                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start">
                                    <InfoIcon className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-blue-700">La primera fila debe contener encabezados. Asegúrate de incluir columnas para 'Fecha de Ingreso' y 'Sueldo Diario' para un cálculo preciso del SDI.</p>
                                </div>
                            </div>
                            {parsedData.headers.length > 0 && (
                                <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
                                    <h2 className="text-xl font-bold text-slate-700 mb-4">Mapeo de Columnas</h2>
                                    <p className="text-sm text-slate-500 mb-4">Asegúrate que las columnas correctas están seleccionadas para el cálculo.</p>
                                    <div className="space-y-4">
                                        <ColumnSelector label="ID del Empleado" value={employeeIdCol} onChange={setEmployeeIdCol} headers={parsedData.headers} />
                                        <ColumnSelector label="Nombre del Empleado" value={employeeNameCol} onChange={setEmployeeNameCol} headers={parsedData.headers} />
                                        <ColumnSelector label="Fecha de Ingreso" value={hireDateCol} onChange={setHireDateCol} headers={parsedData.headers} />
                                        <ColumnSelector label="Sueldo Diario (Base)" value={dailySalaryCol} onChange={setDailySalaryCol} headers={parsedData.headers} />
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="lg:col-span-1 space-y-8">
                            <ConfigPanel uma={uma} setUma={setUma} workRisk={workRisk} setWorkRisk={setWorkRisk} isn={isn} setIsn={setIsn} onSave={handleSaveConfig} configSaved={configSaved} />
                            <CalculationDatePanel currentCalculationDate={calculationDate} onApplyDate={setCalculationDate} />
                        </div>
                        <div className="lg:col-span-1 space-y-8">
                            <DataTablesPanel isrTable={ISR_MONTHLY_TABLE} cyvTable={CESANTIA_VEJEZ_TABLE} uma={uma} calculationDate={calculationDate} />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default App;
