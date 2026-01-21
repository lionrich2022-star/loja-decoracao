'use client';

import { Upload, X, Image as ImageIcon, Camera } from 'lucide-react';
import { useCallback, useState } from 'react';
import { ROOM_PRESETS, RoomPreset } from './SimulatorPresets';

interface ImageUploaderProps {
    onImageSelect: (file: File) => void;
    onPresetSelect: (preset: RoomPreset) => void;
}

export default function ImageUploader({ onImageSelect, onPresetSelect }: ImageUploaderProps) {
    const [dragActive, setDragActive] = useState(false);
    const [activeTab, setActiveTab] = useState<'upload' | 'presets'>('upload');

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            onImageSelect(e.dataTransfer.files[0]);
        }
    }, [onImageSelect]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            onImageSelect(e.target.files[0]);
        }
    }, [onImageSelect]);

    return (
        <div className="w-full max-w-4xl mx-auto mb-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => setActiveTab('upload')}
                    className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'upload'
                            ? 'bg-white dark:bg-gray-800 text-blue-600 border-b-2 border-blue-600'
                            : 'bg-gray-50 dark:bg-gray-900/50 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                >
                    <Camera className="w-4 h-4" />
                    Sua Foto
                </button>
                <button
                    onClick={() => setActiveTab('presets')}
                    className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'presets'
                            ? 'bg-white dark:bg-gray-800 text-purple-600 border-b-2 border-purple-600'
                            : 'bg-gray-50 dark:bg-gray-900/50 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                >
                    <ImageIcon className="w-4 h-4" />
                    Ambientes Inspiradores
                </button>
            </div>

            <div className="p-6">
                {activeTab === 'upload' ? (
                    <div
                        className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-colors ${dragActive
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
                            }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        <input
                            type="file"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={handleChange}
                            accept="image/*"
                        />
                        <div className="flex flex-col items-center justify-center space-y-4">
                            <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                                <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-lg font-medium text-gray-700 dark:text-gray-200">
                                    Arraste e solte uma foto da sua parede
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    ou clique para selecionar do computador
                                </p>
                            </div>
                            <p className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                                💡 Dica: Tire a foto de frente, com boa iluminação.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                        {ROOM_PRESETS.map((preset) => (
                            <button
                                key={preset.id}
                                onClick={() => onPresetSelect(preset)}
                                className="group relative aspect-video rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:ring-2 hover:ring-purple-500 transition-all text-left"
                            >
                                <img
                                    src={preset.imageUrl}
                                    alt={preset.label}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4">
                                    <span className="text-white font-medium text-lg">{preset.label}</span>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-gray-300 uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded backdrop-blur-sm">
                                            {preset.category}
                                        </span>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
