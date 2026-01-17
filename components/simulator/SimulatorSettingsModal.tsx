'use client';

import { X } from 'lucide-react';
import { SIMULATOR_CONFIG } from './SimulatorConfig';

interface SimulatorSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    config: typeof SIMULATOR_CONFIG;
    onConfigChange: (newConfig: typeof SIMULATOR_CONFIG) => void;
}

export default function SimulatorSettingsModal({ isOpen, onClose, config, onConfigChange }: SimulatorSettingsModalProps) {
    if (!isOpen) return null;

    const toggleFeature = (key: keyof typeof SIMULATOR_CONFIG) => {
        // Only toggle boolean flags
        if (typeof config[key] === 'boolean') {
            onConfigChange({
                ...config,
                [key]: !config[key]
            });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Configuração de Versões</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-medium text-gray-900 dark:text-white">V1: Seleção Manual</h3>
                                <p className="text-xs text-gray-500">Recorte manual ponto a ponto.</p>
                            </div>
                            <div className="flex items-center">
                                <span className="mr-2 text-xs font-bold text-green-600">Sempre Ativo</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-medium text-gray-900 dark:text-white">V2: Auto-Detect (IA)</h3>
                                <p className="text-xs text-gray-500">Botão de varinha mágica para detecção automática.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={config.enableV2}
                                    onChange={() => toggleFeature('enableV2')}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-medium text-gray-900 dark:text-white">V3: Multi-Paredes</h3>
                                <p className="text-xs text-gray-500">Suporte a múltiplas áreas independentes.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={config.enableMultiWall}
                                    onChange={() => toggleFeature('enableMultiWall')}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between opacity-50 cursor-not-allowed">
                            <div>
                                <h3 className="font-medium text-gray-900 dark:text-white">V4: Pincel de Ajuste</h3>
                                <p className="text-xs text-gray-500">Em desenvolvimento.</p>
                            </div>
                            <label className="relative inline-flex items-center">
                                <input type="checkbox" className="sr-only peer" disabled checked={config.enableBrush} />
                                <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700"></div>
                            </label>
                        </div>
                    </div>

                    <div className="mt-6 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded text-xs text-amber-800 dark:text-amber-200">
                        <strong>Nota:</strong> Estas opções simulam os diferentes planos SaaS disponíveis para os lojistas.
                    </div>
                </div>

                <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 rounded-b-xl flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
}
