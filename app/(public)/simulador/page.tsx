'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import PublicHeader from '@/components/layout/PublicHeader';
import ImageUploader from '@/components/simulator/ImageUploader';
import QuoteModal from '@/components/simulator/QuoteModal';
import { MOCK_PAPERS } from '@/lib/constants';
import { Loader2 } from 'lucide-react';

// Import Konva Stage dynamically to avoid SSR issues
const CanvasStage = dynamic(() => import('@/components/simulator/CanvasStage'), {
    ssr: false,
    loading: () => <div className="aspect-video bg-gray-200 flex items-center justify-center"><Loader2 className="animate-spin text-gray-400" /></div>
});

export default function SimuladorPage() {
    const [bgImage, setBgImage] = useState<string | null>(null);
    const [selectedPaper, setSelectedPaper] = useState<string | null>(null);
    const [opacity, setOpacity] = useState(0.8);
    const [scale, setScale] = useState(0.5);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleImageSelect = (file: File) => {
        const url = URL.createObjectURL(file);
        setBgImage(url);
    };

    const selectedPaperData = MOCK_PAPERS.find(p => p.id === selectedPaper);

    const totalPrice = useMemo(() => {
        if (!dimensions.width || !dimensions.height || !selectedPaperData) return 0;
        const area = dimensions.width * dimensions.height;
        return area * selectedPaperData.price_m2;
    }, [dimensions, selectedPaperData]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <PublicHeader />

            <main className="flex-1 container mx-auto px-4 py-8">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                            Simulador de Ambientes
                        </h1>
                        <p className="text-gray-600">
                            Visualize, calcule e transforme sua parede em segundos.
                        </p>
                    </div>

                    {!bgImage ? (
                        <ImageUploader onImageSelect={handleImageSelect} />
                    ) : (
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex gap-4 items-center flex-wrap">
                                    <h2 className="text-xl font-semibold">Sua Simulação</h2>
                                    {selectedPaper && (
                                        <div className="flex gap-4 text-sm bg-gray-100 p-2 rounded-lg">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <span>Opacidade:</span>
                                                <input
                                                    type="range"
                                                    min="0.1"
                                                    max="1"
                                                    step="0.05"
                                                    value={opacity}
                                                    onChange={(e) => setOpacity(parseFloat(e.target.value))}
                                                    className="w-24 accent-blue-600"
                                                />
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <span>Escala:</span>
                                                <input
                                                    type="range"
                                                    min="0.1"
                                                    max="2"
                                                    step="0.1"
                                                    value={scale}
                                                    onChange={(e) => setScale(parseFloat(e.target.value))}
                                                    className="w-24 accent-blue-600"
                                                />
                                            </label>
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => setBgImage(null)}
                                    className="text-sm text-red-600 hover:text-red-700 font-medium border border-red-200 px-3 py-1 rounded hover:bg-red-50 transition-colors"
                                >
                                    Trocar foto
                                </button>
                            </div>

                            <div className="bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex justify-center items-center min-h-[400px] relative">
                                {!selectedPaper && (
                                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                                        <span className="bg-black/50 text-white px-4 py-2 rounded-full text-sm backdrop-blur-sm animate-pulse">
                                            Selecione um papel abaixo para aplicar
                                        </span>
                                    </div>
                                )}
                                <CanvasStage
                                    bgImageUrl={bgImage}
                                    patternUrl={selectedPaperData?.pattern || null}
                                    opacity={opacity}
                                    scale={scale}
                                />
                            </div>

                            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2">
                                    <h3 className="font-medium mb-4 flex items-center justify-between">
                                        Escolha o Papel de Parede
                                        <span className="text-xs font-normal text-gray-500">{MOCK_PAPERS.length} opções disponíveis</span>
                                    </h3>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-96 overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-gray-300">
                                        {MOCK_PAPERS.map((paper) => (
                                            <div
                                                key={paper.id}
                                                onClick={() => setSelectedPaper(paper.id)}
                                                className={`
                            group cursor-pointer rounded-lg border-2 overflow-hidden transition-all relative
                            ${selectedPaper === paper.id ? 'border-blue-500 ring-2 ring-blue-200 shadow-md' : 'border-gray-200 hover:border-gray-300'}
                        `}
                                            >
                                                <img src={paper.thumbnail} alt={paper.name} referrerPolicy="no-referrer" className="w-full aspect-square object-cover" />
                                                <div className={`absolute inset-0 transition-colors ${selectedPaper === paper.id ? 'bg-blue-500/10' : 'bg-black/0 group-hover:bg-black/5'}`} />
                                                <div className="p-2 text-xs font-medium truncate bg-white border-t border-gray-100 text-gray-900">
                                                    {paper.name}
                                                    <div className="text-gray-500 font-normal">R$ {paper.price_m2.toFixed(2)}/m²</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-gray-50 p-6 rounded-lg border">
                                        <h3 className="font-medium mb-4 text-gray-900 border-b pb-2">Medidas da Parede</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs uppercase text-gray-500 font-bold mb-1">Altura (m)</label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        onChange={(e) => setDimensions(prev => ({ ...prev, height: parseFloat(e.target.value) || 0 }))}
                                                        step="0.01"
                                                        className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none pl-3 text-gray-900 bg-white"
                                                        placeholder="0.00"
                                                    />
                                                    <span className="absolute right-3 top-2 text-gray-400 text-sm">m</span>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs uppercase text-gray-500 font-bold mb-1">Largura (m)</label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        onChange={(e) => setDimensions(prev => ({ ...prev, width: parseFloat(e.target.value) || 0 }))}
                                                        step="0.01"
                                                        className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none pl-3 text-gray-900 bg-white"
                                                        placeholder="0.00"
                                                    />
                                                    <span className="absolute right-3 top-2 text-gray-400 text-sm">m</span>
                                                </div>
                                            </div>
                                        </div>
                                        {dimensions.width > 0 && dimensions.height > 0 && (
                                            <div className="mt-4 flex justify-between text-sm bg-white p-2 rounded border border-gray-200">
                                                <span className="text-gray-500">Área total:</span>
                                                <span className="font-medium text-gray-900">{(dimensions.width * dimensions.height).toFixed(2)} m²</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 shadow-sm">
                                        <div className="flex justify-between items-end mb-1">
                                            <span className="text-gray-600 font-medium">Valor Estimado</span>
                                            <span className="text-3xl font-bold text-blue-900">
                                                {totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </span>
                                        </div>
                                        {!selectedPaperData ? (
                                            <p className="text-sm text-amber-600 mb-4 mt-2 bg-amber-50 p-2 rounded border border-amber-100">
                                                ⚠ Selecione um papel de parede.
                                            </p>
                                        ) : (dimensions.width === 0 || dimensions.height === 0) && (
                                            <p className="text-sm text-amber-600 mb-4 mt-2 bg-amber-50 p-2 rounded border border-amber-100">
                                                ⚠ Informe as medidas da parede.
                                            </p>
                                        )}

                                        <button
                                            disabled={!totalPrice || totalPrice === 0}
                                            onClick={() => setIsModalOpen(true)}
                                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 mt-4 shadow-sm"
                                        >
                                            SOLICITAR ORÇAMENTO
                                        </button>
                                        <p className="text-xs text-center text-blue-600/80 mt-3">
                                            O envio do orçamento é rápido e sem compromisso.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <QuoteModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                summary={{
                    paperId: selectedPaper || undefined,
                    paperName: selectedPaperData?.name,
                    width: dimensions.width,
                    height: dimensions.height,
                    totalPrice: totalPrice
                }}
                imageBlob={bgImage} // Passing the BLOB url (will basically just save string)
            />
        </div>
    );
}
