'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import NewPaperModal from '@/components/admin/NewPaperModal';

interface Papel {
    id: string;
    nome: string;
    preco_m2: number;
    imagem_url: string;
}

export default function PapeisPage() {
    const [papeis, setPapeis] = useState<Papel[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchPapeis();
    }, []);

    async function fetchPapeis() {
        setLoading(true);
        const { data, error } = await supabase
            .from('papeis')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Erro ao buscar papéis:', error);
        } else {
            setPapeis(data || []);
        }
        setLoading(false);
    }

    async function handleDelete(id: string) {
        if (!confirm('Tem certeza que deseja excluir este papel?')) return;

        const { error } = await supabase.from('papeis').delete().eq('id', id);
        if (error) {
            alert('Erro ao excluir');
        } else {
            fetchPapeis();
        }
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-gray-900 dark:text-white">Gerenciar Papéis de Parede</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Adicione, edite ou remova produtos do seu catálogo.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-gold-500 hover:bg-gold-600 text-white font-medium py-2.5 px-5 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-gold-500/20"
                >
                    <Plus size={20} /> Novo Papel
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900/50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Imagem</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nome</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Preço (m²)</th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                    <div className="flex justify-center items-center gap-3">
                                        <div className="w-5 h-5 border-2 border-gold-500 border-t-transparent rounded-full animate-spin"></div>
                                        Carregando catálogo...
                                    </div>
                                </td>
                            </tr>
                        ) : papeis.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-3">
                                            <ImageIcon className="text-gray-400" size={32} />
                                        </div>
                                        <p className="font-medium text-gray-900 dark:text-white">Nenhum papel de parede encontrado</p>
                                        <p className="text-sm mt-1">Comece adicionando seu primeiro produto.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            papeis.map((papel) => (
                                <tr key={papel.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="h-16 w-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-sm relative group">
                                            {papel.imagem_url ? (
                                                <img src={papel.imagem_url} alt={papel.nome} className="h-full w-full object-cover" />
                                            ) : (
                                                <ImageIcon className="h-full w-full p-4 text-gray-400" />
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm font-medium text-gray-900 dark:text-white font-serif">{papel.nome}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded font-mono">
                                            R$ {Number(papel.preco_m2).toFixed(2)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleDelete(papel.id)}
                                            className="text-red-400 hover:text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                                            title="Excluir Papel"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <NewPaperModal
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={fetchPapeis}
                />
            )}
        </div>
    );
}
