'use client';

import { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import PublicHeader from '@/components/layout/PublicHeader';
import ImageUploader from '@/components/simulator/ImageUploader';
import QuoteModal from '@/components/simulator/QuoteModal';
import { supabase } from '@/lib/supabase'; // Import supabase
import { Loader2 } from 'lucide-react';
import Footer from '@/components/layout/Footer';

// Import Konva Stage dynamically to avoid SSR issues
const CanvasStage = dynamic(() => import('@/components/simulator/CanvasStage'), {
    ssr: false,
    loading: () => <div className="aspect-video bg-gray-200 flex items-center justify-center"><Loader2 className="animate-spin text-gray-400" /></div>
});

import { SIMULATOR_CONFIG, WallData } from '@/components/simulator/SimulatorConfig';



export default function SimuladorPage() {
    const [bgImage, setBgImage] = useState<string | null>(null);
    const [selectedPaper, setSelectedPaper] = useState<string | null>(null);
    const [opacity, setOpacity] = useState(SIMULATOR_CONFIG.defaultOpacity);
    const [scale, setScale] = useState(SIMULATOR_CONFIG.defaultScale);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [isModalOpen, setIsModalOpen] = useState(false);

    // State for real papers
    const [papers, setPapers] = useState<any[]>([]);
    const [loadingPapers, setLoadingPapers] = useState(true);

    const [mode, setMode] = useState<'view' | 'masking'>('view');

    // V3: Multiple Walls State
    const [walls, setWalls] = useState<WallData[]>([]);
    const [selectedWallId, setSelectedWallId] = useState<string | null>(null);

    const [isDetecting, setIsDetecting] = useState(false);

    useEffect(() => {
        async function fetchPapers() {
            try {
                const { data, error } = await supabase
                    .from('papeis')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('Supabase error fetching papers:', error);
                    // If error, maybe empty list but stop loading
                }
                setPapers(data || []);
            } catch (error) {
                console.error('Unexpected error fetching papers:', error);
            } finally {
                setLoadingPapers(false);
            }
        }

        fetchPapers();
    }, []);

    const handleImageSelect = (file: File) => {
        const url = URL.createObjectURL(file);
        setBgImage(url);
        setWalls([]); // Reset walls
        setSelectedWallId(null);
    };

    // V2/V3 AI Detection Logic
    const handleAutoDetect = async () => {
        setIsDetecting(true);
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Mock Result
        // Ideally we need canvas dimensions here to be precise, but we'll infer.
        // Let's assume standard container ~800x600 for simulation inputs
        // CanvasStage handles internal scaling, so we try to provide relative or safe absolute coords?
        // Actually CanvasStage manages logic.
        // For 'Auto Detect', we will pass a list of walls.

        const newWalls: WallData[] = [];

        if (SIMULATOR_CONFIG.enableMultiWall) {
            // Simulate 2 Walls detected
            newWalls.push({
                id: 'wall-auto-1',
                rect: { x: 50, y: 100, width: 300, height: 400 },
                name: 'Parede Esquerda (IA)'
            });
            newWalls.push({
                id: 'wall-auto-2',
                rect: { x: 400, y: 100, width: 350, height: 400 },
                name: 'Parede Direita (IA)'
            });
        } else {
            // Single Wall V2
            newWalls.push({
                id: 'wall-auto-1',
                rect: { x: 50, y: 50, width: 700, height: 500 },
                name: 'Parede (IA)'
            });
        }

        setWalls(newWalls);
        setSelectedWallId(newWalls[0].id); // Select first one
        setIsDetecting(false);
        setMode('masking');
    };

    // Derived state for the selected paper
    const selectedPaperData = papers.find(p => p.id === selectedPaper);

    const totalPrice = useMemo(() => {
        if (!dimensions.width || !dimensions.height || !selectedPaperData) return 0;
        const area = dimensions.width * dimensions.height;
        // Use preco_m2 from DB, default to 0 if missing
        return area * (selectedPaperData.preco_m2 || 0);
    }, [dimensions, selectedPaperData]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors flex flex-col">
            <PublicHeader />

            <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl lg:text-4xl font-serif font-bold text-gray-900 dark:text-white mb-2">Simulador de Ambientes</h1>
                    <p className="text-gray-600 dark:text-gray-400">Visualize, calcule e transforme sua parede em segundos.</p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 lg:p-6">
                    <div className="aspect-video bg-gray-100 dark:bg-gray-900 rounded-xl overflow-hidden relative">
                        {!bgImage ? (
                            <ImageUploader onImageSelect={handleImageSelect} />
                        ) : (
                            <CanvasStage
                                bgImageUrl={bgImage}
                                patternUrl={selectedPaperData?.imagem_url || null}
                                opacity={opacity}
                                scale={scale}
                                mode={mode}
                                walls={walls}
                                selectedWallId={selectedWallId}
                                onWallsChange={setWalls}
                                onSelectWall={setSelectedWallId}
                            />
                        )}
                    </div>

                    <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2">
                            <h3 className="font-medium mb-4 flex items-center justify-between text-gray-900 dark:text-white">
                                Escolha o Papel de Parede
                                <span className="text-xs font-normal text-gray-500 dark:text-gray-400">{papers.length} opções disponíveis</span>
                            </h3>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-96 overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                                {loadingPapers ? (
                                    <div className="col-span-full py-8 flex justify-center text-gray-500">
                                        <Loader2 className="animate-spin mr-2" /> Carregando papéis...
                                    </div>
                                ) : papers.length === 0 ? (
                                    <div className="col-span-full py-8 text-center text-gray-500 text-sm">
                                        Nenhum papel encontrado na loja.
                                    </div>
                                ) : (
                                    papers.map((paper) => (
                                        <div
                                            key={paper.id}
                                            onClick={() => setSelectedPaper(paper.id)}
                                            className={`
                                    group cursor-pointer rounded-lg border-2 overflow-hidden transition-all relative
                                    ${selectedPaper === paper.id ? 'border-blue-500 ring-2 ring-blue-200 shadow-md' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}
                                `}
                                        >
                                            <img src={paper.imagem_url} alt={paper.nome} referrerPolicy="no-referrer" className="w-full aspect-square object-cover" />
                                            <div className={`absolute inset-0 transition-colors ${selectedPaper === paper.id ? 'bg-blue-500/10' : 'bg-black/0 group-hover:bg-black/5'}`} />
                                            <div className="p-2 text-xs font-medium truncate bg-white dark:bg-gray-700 border-t border-gray-100 dark:border-gray-600 text-gray-900 dark:text-white">
                                                {paper.nome}
                                                <div className="text-gray-500 dark:text-gray-300 font-normal">
                                                    {paper.preco_m2 ? `R$ ${paper.preco_m2.toFixed(2)}/m²` : 'Preço sob consulta'}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
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
            </main>

            <QuoteModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                summary={{
                    paperId: selectedPaper || undefined,
                    paperName: selectedPaperData?.nome,
                    width: dimensions.width,
                    height: dimensions.height,
                    totalPrice: totalPrice
                }}
                imageBlob={bgImage} // Passing the BLOB url (will basically just save string)
            />
            <Footer />
        </div>
    );
}
