'use client';

import { useState } from 'react';
import { X, Loader2, Send } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface QuoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    summary: {
        paperId: string | undefined;
        paperName: string | undefined;
        width: number;
        height: number;
        totalPrice: number;
    };
    imageBlob?: string | null; // URL of the simulated image
}

export default function QuoteModal({ isOpen, onClose, summary, imageBlob }: QuoteModalProps) {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        whatsapp: '',
        email: '',
        notes: ''
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Insert Data
            const { error } = await supabase
                .from('orcamentos')
                .insert({
                    papel_id: summary.paperId,
                    largura: summary.width,
                    altura: summary.height,
                    area: summary.width * summary.height,
                    valor_total: summary.totalPrice,
                    nome_cliente: formData.name,
                    whatsapp: formData.whatsapp,
                    email: formData.email,
                    observacoes: formData.notes,
                    status: 'novo',
                    imagem_cliente_url: imageBlob // We save the dataURL directly if small, or upload logic needed for big files
                });

            if (error) throw error;

            setSuccess(true);
        } catch (error) {
            console.error('Error submitting quote:', error);
            alert('Erro ao enviar solicitação. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl w-full max-w-md p-8 text-center animate-in zoom-in duration-300">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Send size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Solicitação Enviada!</h2>
                    <p className="text-gray-500 mb-6">
                        Recebemos seu pedido. Nossa equipe entrará em contato pelo WhatsApp em breve.
                    </p>
                    <button
                        onClick={() => {
                            setSuccess(false);
                            onClose();
                            setFormData({ name: '', whatsapp: '', email: '', notes: '' });
                        }}
                        className="bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors w-full font-medium"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl relative animate-in fade-in zoom-in duration-200">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">Solicitar Orçamento</h2>
                    <p className="text-sm text-gray-500 mt-1">Preencha seus dados para receber o contato.</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Summary Card */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 mb-4 flex gap-4 items-center">
                        <div className="flex-1">
                            <p className="text-xs text-gray-500 uppercase font-bold">Papel Selecionado</p>
                            <p className="font-medium text-gray-900 truncate">{summary.paperName}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-500 uppercase font-bold">Valor Estimado</p>
                            <p className="font-bold text-blue-600">
                                {summary.totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
                        <input
                            required
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Seu nome"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp *</label>
                            <input
                                required
                                type="tel"
                                value={formData.whatsapp}
                                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="(00) 00000-0000"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-gray-400 font-normal">(opcional)</span></label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="seu@email.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                        <textarea
                            rows={3}
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                            placeholder="Dúvidas ou detalhes específicos..."
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-blue-200 mt-2 flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <Send size={18} />}
                        {loading ? 'Enviando...' : 'Enviar Solicitação'}
                    </button>

                    <p className="text-xs text-center text-gray-400">
                        Ao enviar, você concorda em ser contatado pela loja.
                    </p>
                </form>
            </div>
        </div>
    );
}
