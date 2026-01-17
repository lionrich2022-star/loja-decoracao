'use client';

import { Upload, X } from 'lucide-react';
import { useCallback, useState } from 'react';

interface ImageUploaderProps {
    onImageSelect: (file: File) => void;
}

export default function ImageUploader({ onImageSelect }: ImageUploaderProps) {
    const [dragActive, setDragActive] = useState(false);

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
        <div className="w-full max-w-xl mx-auto mb-8">
            <div
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive
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
                    <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full">
                        <Upload className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                    </div>
                    <div>
                        <p className="text-lg font-medium text-gray-700 dark:text-gray-200">
                            Arraste e solte uma foto aqui
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            ou clique para selecionar
                        </p>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                        Recomendado: Foto bem iluminada da parede frontal
                    </p>
                </div>
            </div>
        </div>
    );
}
