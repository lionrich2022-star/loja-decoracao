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
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Gerenciar Papéis de Parede</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded flex items-center gap-2 transition-colors"
                >
                    <Plus size={20} /> Novo Papel
                </button>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-100">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Imagem</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preço (m²)</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                    <div className="flex justify-center items-center gap-2">
                                        Carregando...
                                    </div>
                                </td>
                            </tr>
                        ) : papeis.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                    Nenhum papel de parede cadastrado.
                                    <br />
                                    <span className="text-xs">Use o botão "Novo Papel" para cadastrar.</span>
                                </td>
                            </tr>
                        ) : (
                            papeis.map((papel) => (
                                <tr key={papel.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="h-16 w-16 rounded overflow-hidden bg-gray-100 border">
                                            {papel.imagem_url ? (
                                                <img src={papel.imagem_url} alt={papel.nome} className="h-full w-full object-cover" />
                                            ) : (
                                                <ImageIcon className="h-full w-full p-4 text-gray-400" />
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {papel.nome}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        R$ {Number(papel.preco_m2).toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleDelete(papel.id)}
                                            className="text-red-600 hover:text-red-900 bg-red-50 p-2 rounded hover:bg-red-100 transition-colors"
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
