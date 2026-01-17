'use client';

import { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import PublicHeader from '@/components/layout/PublicHeader';
import ImageUploader from '@/components/simulator/ImageUploader';
import QuoteModal from '@/components/simulator/QuoteModal';
import WallList from '@/components/simulator/WallList';
import SimulatorSettingsModal from '@/components/simulator/SimulatorSettingsModal';
import { supabase } from '@/lib/supabase'; // Import supabase
import { Loader2, Wand2, Settings } from 'lucide-react';
import Footer from '@/components/layout/Footer';

// Import Konva Stage dynamically to avoid SSR issues
const CanvasStage = dynamic(() => import('@/components/simulator/CanvasStage'), {
    ssr: false,
    loading: () => <div className="aspect-video bg-gray-200 flex items-center justify-center"><Loader2 className="animate-spin text-gray-400" /></div>
});

import { SIMULATOR_CONFIG, WallData } from '@/components/simulator/SimulatorConfig';



export default function SimuladorPage() {
    // Runtime Config State (initialized from default config)
    const [config, setConfig] = useState(SIMULATOR_CONFIG);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const [bgImage, setBgImage] = useState<string | null>(null);
    const [selectedPaper, setSelectedPaper] = useState<string | null>(null);
    const [opacity, setOpacity] = useState(config.defaultOpacity);
    const [scale, setScale] = useState(config.defaultScale);
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
        const recordVisit = async () => {
            // Check session storage to avoid duplicate counts in same session (simple debounce)
            if (sessionStorage.getItem('visited_simulator')) return;

            try {
                await supabase.from('page_views').insert({ page: 'simulator' });
                sessionStorage.setItem('visited_simulator', 'true');
            } catch (err) {
                console.error('Error recording visit:', err);
            }
        };

        recordVisit();
    }, []);

    useEffect(() => {
        async function fetchPapers() {
            try {
                const { data, error } = await supabase
                    .from('papeis')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('Supabase error fetching papers:', error);
                }

                // Manually added papers for immediate availability
                const manualPapers = [
                    { id: 'nou-1', nome: 'Papel Infantil Borboletas', imagem_url: '/papeis/papel_infantil.png', preco_m2: 59.90 },
                    { id: 'nou-2', nome: 'Cimento Queimado', imagem_url: '/papeis/cimento_queimado.png', preco_m2: 45.00 },
                    { id: 'nou-3', nome: 'Pedra Natural', imagem_url: '/papeis/pedra_natural.png', preco_m2: 89.90 },
                ];

                setPapers([...manualPapers, ...(data || [])]);
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

        // Initialize with a default wall to enable V3/V4 features (Brush, etc) immediately
        const defaultWallId = `wall-${Date.now()}`;
        const defaultWall: WallData = {
            id: defaultWallId,
            name: 'Parede Principal',
            points: [], // CanvasStage will handle default mask for empty points
            brushStrokes: []
        };
        setWalls([defaultWall]);
        setSelectedWallId(defaultWallId);
        setWallPoints([]);
    };

    // V2/V3 AI Detection Logic
    const handleAutoDetect = async () => {
        setIsDetecting(true);
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        const newWalls: WallData[] = [];

        if (config.enableMultiWall) {
            // Simulate 2 Walls detected (Polygons)
            newWalls.push({
                id: 'wall-auto-1',
                name: 'Parede Esquerda (IA)',
                points: [
                    { x: 50, y: 100 },
                    { x: 350, y: 100 },
                    { x: 350, y: 500 },
                    { x: 50, y: 500 }
                ]
            });
            newWalls.push({
                id: 'wall-auto-2',
                name: 'Parede Direita (IA)',
                points: [
                    { x: 400, y: 100 },
                    { x: 750, y: 100 },
                    { x: 750, y: 500 },
                    { x: 400, y: 500 }
                ]
            });
        } else {
            // Single Wall V2
            newWalls.push({
                id: 'wall-auto-1',
                name: 'Parede (IA)',
                points: [
                    { x: 50, y: 50 },
                    { x: 750, y: 50 },
                    { x: 750, y: 550 },
                    { x: 50, y: 550 }
                ]
            });
        }

        setWalls(newWalls);
        if (newWalls.length > 0) {
            setSelectedWallId(newWalls[0].id);
            setWallPoints(newWalls[0].points); // Sync edit state
        }
        setIsDetecting(false);
        setMode('masking');
    };

    // Masking State
    const [wallPoints, setWallPoints] = useState<{ x: number; y: number }[]>([]);

    // V4: Brush Components
    const [activeTool, setActiveTool] = useState<'poly' | 'brush-add' | 'brush-remove'>('poly');
    const [brushSize, setBrushSize] = useState(20);

    // Handler to Add Manual Wall (V3)
    const handleAddWall = () => {
        const newId = `wall-manual-${Date.now()}`;
        const newWall: WallData = {
            id: newId,
            name: `Nova Parede ${walls.length + 1}`,
            points: [],
            brushStrokes: []
        };
        setWalls(prev => [...prev, newWall]);
        setSelectedWallId(newId);
        setWallPoints([]);
        setMode('masking');
        setActiveTool('poly'); // Reset to poly
    };

    const handleRemoveWall = (id: string) => {
        setWalls(prev => prev.filter(w => w.id !== id));
        if (selectedWallId === id) {
            setSelectedWallId(null);
            setWallPoints([]);
        }
    };

    const handleStageClick = (e: any) => {
        if (mode !== 'masking') return;
        const stage = e.target.getStage();
        const pointer = stage.getPointerPosition();
        if (pointer) {
            const newPoints = [...wallPoints, pointer];
            setWallPoints(newPoints);

            // If we have a selected wall (V3), update it immediately in the list too?
            // Or only on "Confirm"? Let's update immediately for responsiveness.
            if (config.enableMultiWall && selectedWallId) {
                setWalls(prev => prev.map(w =>
                    w.id === selectedWallId ? { ...w, points: newPoints } : w
                ));
            }
        }
    };

    const toggleMaskingMode = () => {
        if (mode === 'view') {
            setMode('masking');
            // Check if we need to init points
            if (selectedWallId) {
                const wall = walls.find(w => w.id === selectedWallId);
                if (wall) setWallPoints(wall.points);
            } else if (wallPoints.length < 3) {
                setWallPoints([]);
            }
        } else {
            setMode('view');
        }
    };

    const undoLastPoint = () => {
        const newPoints = wallPoints.slice(0, -1);
        setWallPoints(newPoints);
        if (config.enableMultiWall && selectedWallId) {
            setWalls(prev => prev.map(w =>
                w.id === selectedWallId ? { ...w, points: newPoints } : w
            ));
        }
    };

    const clearMask = () => {
        if (confirm('Deseja limpar o recorte atual?')) {
            setWallPoints([]);
            if (config.enableMultiWall && selectedWallId) {
                setWalls(prev => prev.map(w =>
                    w.id === selectedWallId ? { ...w, points: [] } : w
                ));
            }
        }
    };

    // Derived state for the selected paper
    const selectedPaperData = papers.find(p => p.id === selectedPaper);

    const totalPrice = useMemo(() => {
        if (!dimensions.width || !dimensions.height || !selectedPaperData) return 0;
        const area = dimensions.width * dimensions.height;
        // Use preco_m2 from DB, default to 0 if missing
        return area * (selectedPaperData.preco_m2 || 0);
    }, [dimensions, selectedPaperData]);

    const handlePointsChange = (newPoints: { x: number; y: number }[]) => {
        setWallPoints(newPoints);
        if (config.enableMultiWall && selectedWallId) {
            setWalls(prev => prev.map(w =>
                w.id === selectedWallId ? { ...w, points: newPoints } : w
            ));
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors flex flex-col">
            <PublicHeader />

            <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
                {/* ... (Keep existing layout) ... */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl lg:text-4xl font-serif font-bold text-gray-900 dark:text-white mb-2">Simulador de Ambientes</h1>
                    <p className="text-gray-600 dark:text-gray-400">Visualize, calcule e transforme sua parede em segundos.</p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 lg:p-6">
                    {/* Toolbar */}
                    {bgImage && (
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                            {/* ... (Keep existing toolbar) ... */}
                            <div className="flex items-center gap-2">
                                {/* V2: Auto Detect Button */}
                                {config.enableV2 && (
                                    <button
                                        onClick={handleAutoDetect}
                                        disabled={isDetecting}
                                        className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-wait"
                                        title="Detectar paredes automaticamente com IA"
                                    >
                                        {isDetecting ? <Loader2 className="animate-spin w-4 h-4" /> : <Wand2 className="w-4 h-4" />}
                                        {isDetecting ? 'Detectando...' : 'Auto IA'}
                                    </button>
                                )}

                                {/* V1: Polygon Tool */}
                                <button
                                    onClick={() => {
                                        setMode(mode === 'masking' ? 'view' : 'masking');
                                        setActiveTool('poly'); // Set poly tool when entering masking mode
                                    }}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${mode === 'masking' && activeTool === 'poly'
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600'
                                        }`}
                                >
                                    {mode === 'masking' ? '✅ Concluir' : '✂️ Recortar'}
                                </button>

                                {/* V4: Brush Tools */}
                                {config.enableBrush && mode === 'masking' && (
                                    <div className="flex items-center gap-1 ml-2 border-l border-gray-300 dark:border-gray-600 pl-3">
                                        <button
                                            onClick={() => setActiveTool('poly')}
                                            className={`p-2 rounded transition-colors ${activeTool === 'poly'
                                                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 ring-2 ring-blue-500'
                                                : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                            title="Polígono (Pontos)"
                                        >
                                            📐
                                        </button>
                                        <button
                                            onClick={() => setActiveTool('brush-add')}
                                            className={`p-2 rounded transition-colors ${activeTool === 'brush-add'
                                                ? 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400 ring-2 ring-green-500'
                                                : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                            title="Pincel (Adicionar Área)"
                                        >
                                            🖌️
                                        </button>
                                        <button
                                            onClick={() => setActiveTool('brush-remove')}
                                            className={`p-2 rounded transition-colors ${activeTool === 'brush-remove'
                                                ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400 ring-2 ring-red-500'
                                                : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                            title="Borracha (Remover Área)"
                                        >
                                            🧹
                                        </button>
                                        <input
                                            type="range"
                                            min="5"
                                            max="80"
                                            value={brushSize}
                                            onChange={(e) => setBrushSize(Number(e.target.value))}
                                            className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                                            title={`Tamanho: ${brushSize}px`}
                                        />
                                    </div>
                                )}

                                {mode === 'masking' && (
                                    <>
                                        <button
                                            onClick={undoLastPoint}
                                            className="px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                            title="Desfazer último ponto"
                                        >
                                            ↩ Desfazer
                                        </button>
                                        <button
                                            onClick={clearMask}
                                            className="px-3 py-2 bg-white dark:bg-gray-800 text-red-600 border border-red-200 dark:border-red-900/30 rounded-lg text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                            title="Limpar tudo"
                                        >
                                            🗑️ Limpar
                                        </button>
                                    </>
                                )}
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
                                    {mode === 'masking'
                                        ? 'Clique nos cantos da parede.'
                                        : 'Arraste < > para comparar.'}
                                </div>

                                {/* Settings Trigger */}
                                <button
                                    onClick={() => setIsSettingsOpen(true)}
                                    className="p-2 text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                    title="Configurações do Simulador"
                                >
                                    <Settings className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="aspect-video bg-gray-100 dark:bg-gray-900 rounded-xl overflow-hidden relative cursor-crosshair">
                        {!bgImage ? (
                            <ImageUploader onImageSelect={handleImageSelect} />
                        ) : (
                            <CanvasStage
                                bgImageUrl={bgImage}
                                patternUrl={selectedPaperData?.imagem_url || null}
                                opacity={opacity}
                                scale={scale}
                                mode={mode}
                                wallPoints={wallPoints}
                                onStageClick={handleStageClick}
                                // V3 Props
                                walls={walls}
                                selectedWallId={selectedWallId}
                                onWallsChange={setWalls}
                                onSelectWall={(id) => {
                                    setSelectedWallId(id);
                                    const wall = walls.find(w => w.id === id);
                                    if (wall) setWallPoints(wall.points);
                                    setMode('masking');
                                }}
                                // V4 Props
                                activeTool={activeTool}
                                brushSize={brushSize}
                                onPointsChange={handlePointsChange}
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

                            {/* V3: Wall List (Only if MultiWall enabled in Runtime Config) */}
                            {config.enableMultiWall && walls.length > 0 && (
                                <WallList
                                    walls={walls}
                                    selectedWallId={selectedWallId}
                                    onSelectWall={(id) => {
                                        setSelectedWallId(id);
                                        // Sync points to editing state
                                        const wall = walls.find(w => w.id === id);
                                        if (wall) setWallPoints(wall.points);
                                        setMode('masking'); // Auto switch to view/edit
                                    }}
                                    onAddWall={handleAddWall}
                                    onRemoveWall={handleRemoveWall}
                                />
                            )}
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
                imageBlob={bgImage} // Passing the BLOB url
            />
            {/* Runtime Settings Modal */}
            <SimulatorSettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                config={config}
                onConfigChange={setConfig}
            />
            <Footer />
        </div>
    );
}
