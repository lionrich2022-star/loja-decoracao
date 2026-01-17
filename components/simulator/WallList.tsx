'use client';

import { Plus, Trash2, Edit2, Layers } from 'lucide-react';
import { WallData } from './SimulatorConfig';

interface WallListProps {
    walls: WallData[];
    selectedWallId: string | null;
    onSelectWall: (id: string) => void;
    onAddWall: () => void;
    onRemoveWall: (id: string) => void;
}

export default function WallList({ walls, selectedWallId, onSelectWall, onAddWall, onRemoveWall }: WallListProps) {
    if (walls.length === 0) return null;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-3 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Layers size={14} /> Paredes Detectadas
                </h3>
                <button
                    onClick={onAddWall}
                    className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors flex items-center gap-1"
                >
                    <Plus size={12} /> Nova
                </button>
            </div>

            <div className="max-h-64 overflow-y-auto">
                {walls.map((wall) => (
                    <div
                        key={wall.id}
                        onClick={() => onSelectWall(wall.id)}
                        className={`
                            group flex items-center justify-between p-3 cursor-pointer text-sm transition-colors border-b last:border-0 border-gray-100 dark:border-gray-700
                            ${selectedWallId === wall.id
                                ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-700 border-l-4 border-l-transparent'}
                        `}
                    >
                        <div className="flex-1">
                            <div className={`font-medium ${selectedWallId === wall.id ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                                {wall.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                {wall.points.length} pontos • {wall.paperUrl ? 'Papel aplicado' : 'Sem papel'}
                            </div>
                        </div>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onRemoveWall(wall.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all"
                            title="Remover parede"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
