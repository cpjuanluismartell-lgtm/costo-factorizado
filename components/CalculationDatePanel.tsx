
import React, { useState, useEffect } from 'react';
import { CheckIcon, ResetIcon } from './icons';

// Helper to format date as YYYY-MM-DD for input[type=date]
const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

interface CalculationDatePanelProps {
    currentCalculationDate: Date;
    onApplyDate: (newDate: Date) => void;
}

export const CalculationDatePanel: React.FC<CalculationDatePanelProps> = ({ currentCalculationDate, onApplyDate }) => {
    const [selectedDate, setSelectedDate] = useState(formatDateForInput(currentCalculationDate));

    useEffect(() => {
        setSelectedDate(formatDateForInput(currentCalculationDate));
    }, [currentCalculationDate]);

    const handleApply = () => {
        // The input value is YYYY-MM-DD. new Date() will parse it as midnight UTC.
        // To avoid timezone issues where the date might be off by one day depending on the user's location,
        // we add the user's timezone offset to ensure the date is treated as midnight in their local time.
        const date = new Date(selectedDate);
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        onApplyDate(new Date(date.getTime() + userTimezoneOffset));
    };
    
    const handleReset = () => {
         onApplyDate(new Date());
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
            <h2 className="text-xl font-bold text-slate-700 mb-4">Fecha de Cálculo</h2>
            <p className="text-sm text-slate-500 mb-4">
                Selecciona la fecha para la cual deseas calcular la antigüedad y las prestaciones.
            </p>
            <div className="space-y-4">
                <div>
                    <label htmlFor="calculation-date" className="block text-sm font-medium text-slate-600 mb-1">
                        Fecha
                    </label>
                    <input
                        type="date"
                        id="calculation-date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <div className="flex space-x-2">
                     <button
                        onClick={handleApply}
                        className="flex-1 flex items-center justify-center bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                        <CheckIcon className="h-5 w-5 mr-2" />
                        Aplicar Fecha
                    </button>
                    <button
                        onClick={handleReset}
                        title="Restablecer a la fecha actual"
                        className="flex items-center justify-center bg-slate-200 text-slate-700 font-bold py-2 px-3 rounded-md hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 transition-colors"
                    >
                       <ResetIcon className="h-5 w-5 mr-2" />
                       Hoy
                    </button>
                </div>
            </div>
        </div>
    );
};
