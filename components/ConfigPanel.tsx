import React from 'react';
import { SaveIcon, CheckIcon } from './icons';

interface ConfigPanelProps {
    uma: number;
    setUma: (value: number) => void;
    workRisk: number;
    setWorkRisk: (value: number) => void;
    isn: number;
    setIsn: (value: number) => void;
    onSave: () => void;
    configSaved: boolean;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({ uma, setUma, workRisk, setWorkRisk, isn, setIsn, onSave, configSaved }) => {
    
    const handleValueChange = <T,>(setter: (value: T) => void, parser: (value: string) => T) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setter(parser(e.target.value));
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
            <h2 className="text-xl font-bold text-slate-700 mb-4">Parámetros de Cálculo</h2>
            <div className="space-y-4">
                <div>
                    <label htmlFor="uma" className="block text-sm font-medium text-slate-600 mb-1">
                        Valor UMA (Diario)
                    </label>
                    <input
                        type="number"
                        id="uma"
                        value={uma}
                        onChange={handleValueChange(setUma, parseFloat)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <div>
                    <label htmlFor="workRisk" className="block text-sm font-medium text-slate-600 mb-1">
                        Riesgo de Trabajo (%)
                    </label>
                    <input
                        type="number"
                        id="workRisk"
                        value={workRisk}
                        onChange={handleValueChange(setWorkRisk, parseFloat)}
                        step="0.0001"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <div>
                    <label htmlFor="isn" className="block text-sm font-medium text-slate-600 mb-1">
                        Impuesto Sobre Nómina (ISN) (%)
                    </label>
                    <input
                        type="number"
                        id="isn"
                        value={isn}
                        onChange={handleValueChange(setIsn, parseFloat)}
                        step="0.1"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
            </div>
            <button
                onClick={onSave}
                className="mt-6 w-full flex items-center justify-center bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 ease-in-out"
            >
                <SaveIcon className="h-5 w-5 mr-2" />
                Guardar Configuración
            </button>
            {configSaved && (
                 <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-center transition-opacity duration-300">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <p className="text-sm text-green-700 font-medium">
                        ¡Configuración guardada permanentemente!
                    </p>
                </div>
            )}
        </div>
    );
};