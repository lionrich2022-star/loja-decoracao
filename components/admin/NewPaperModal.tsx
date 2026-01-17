'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Upload, Loader2 } from 'lucide-react';

interface NewPaperModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export default function NewPaperModal({ onClose, onSuccess }: NewPaperModalProps) {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!file || !name || !price) return;

        setLoading(true);
        try {
            // 1. Upload Image
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('papeis')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('papeis')
                .getPublicUrl(filePath);

            // 3. Insert into Database
            const { error: dbError } = await supabase
                .from('papeis')
                .insert([
                    {
                        nome: name,
                        preco_m2: parseFloat(price),
                        imagem_url: publicUrl,
                    },
                ]);

            if (dbError) throw dbError;

            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            alert('Erro ao salvar papel de parede');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Novo Papel de Parede</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Papel</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Ex: Floral Azul"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Preço por m² (R$)</label>
                        <input
                            type="number"
                            required
                            step="0.01"
                            value={price}
                            onChange={e => setPrice(e.target.value)}
                            className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="0.00"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Imagem da Textura</label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                            <input
                                type="file"
                                required
                                accept="image/*"
                                onChange={e => setFile(e.target.files?.[0] || null)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="flex flex-col items-center justify-center text-gray-500">
                                <Upload size={24} className="mb-2" />
                                <span className="text-sm">{file ? file.name : 'Clique para selecionar a imagem'}</span>
                            </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Recomendado: Imagem seamless (padrão contínuo).</p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : 'Salvar Papel'}
                    </button>
                </form>
            </div>
        </div>
    );
}
