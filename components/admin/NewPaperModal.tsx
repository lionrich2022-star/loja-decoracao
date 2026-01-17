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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6 border border-gray-200 dark:border-gray-700 transform transition-all">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-serif font-bold text-gray-900 dark:text-white">Novo Papel</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Adicione um novo item ao catálogo.</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nome do Papel</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-600"
                            placeholder="Ex: Mármore Carrara"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Preço por m² (R$)</label>
                        <input
                            type="number"
                            required
                            step="0.01"
                            value={price}
                            onChange={e => setPrice(e.target.value)}
                            className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-600"
                            placeholder="0.00"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Imagem da Textura</label>
                        <div className="relative group">
                            <div className={`
                                border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer
                                ${file
                                    ? 'border-gold-500 bg-gold-50 dark:bg-gold-500/10'
                                    : 'border-gray-300 dark:border-gray-600 hover:border-gold-400 dark:hover:border-gold-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                }
                            `}>
                                <input
                                    type="file"
                                    required
                                    accept="image/*"
                                    onChange={e => setFile(e.target.files?.[0] || null)}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <div className="flex flex-col items-center justify-center pointer-events-none">
                                    <div className={`p-3 rounded-full mb-3 ${file ? 'bg-gold-100 text-gold-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}>
                                        <Upload size={24} />
                                    </div>
                                    <span className={`text-sm font-medium ${file ? 'text-gold-700 dark:text-gold-400' : 'text-gray-600 dark:text-gray-400'}`}>
                                        {file ? file.name : 'Clique para selecionar a imagem'}
                                    </span>
                                    {!file && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">PNG, JPG ou WEBP (Max 5MB)</p>}
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gold-500 hover:bg-gold-600 disabled:bg-gold-300 text-white font-bold py-3 rounded-lg transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : 'Salvar no Catálogo'}
                    </button>
                </form>
            </div>
        </div>
    );
}
