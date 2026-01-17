"use client";

import { Stage, Layer, Image, Group, Rect, Line, Circle } from "react-konva";
import { useEffect, useState } from "react";
import dynamic from 'next/dynamic';

// Dynamic import for Stage to avoid SSR issues with Konva
const KonvaStage = dynamic(() => import('react-konva').then(mod => mod.Stage), {
    ssr: false
});

export default function WallpaperSimulatorTest() {
    const [roomImage, setRoomImage] = useState<HTMLImageElement | null>(null);
    const [wallpaperImage, setWallpaperImage] = useState<HTMLImageElement | null>(null);

    const [wallPoints, setWallPoints] = useState<number[]>([
        150, 80,
        750, 80,
        780, 420,
        120, 420,
    ]);

    const SHOW_V2_BUTTON = true;

    useEffect(() => {
        const room = new window.Image();
        // Using a placeholder or existing image if available. 
        // Ideally user should provide /room.jpg, but I'll use a placeholder to ensure it doesn't crash visually.
        // room.src = "/room.jpg"; 
        room.src = "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1000&auto=format&fit=crop"; // Exemplo de sala
        room.crossOrigin = "Anonymous";
        room.onload = () => setRoomImage(room);

        const wp = new window.Image();
        // wp.src = "/wallpaper.jpg";
        wp.src = "/papeis/papel_infantil.png"; // Usando um existente do projeto se possível, ou placeholder
        wp.crossOrigin = "Anonymous";
        wp.onload = () => setWallpaperImage(wp);
    }, []);

    async function handleV2Click() {
        try {
            const iaPoints = await detectWallWithAI();
            if (iaPoints) {
                setWallPoints(iaPoints);
            }
        } catch (error) {
            console.error("Erro ao detectar parede:", error);
            alert("Erro ao conectar com a IA. Verifique o console.");
        }
    }

    async function detectWallWithAI() {
        const response = await fetch("/api/detect-wall");
        const data = await response.json();
        return data.points;
    }

    // Se for SSR, não renderiza o Stage
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => setIsMounted(true), []);

    if (!isMounted) return <div>Carregando...</div>;

    return (
        <div className="min-h-screen bg-gray-100 p-8 flex flex-col items-center gap-4">
            <h1 className="text-2xl font-bold">Página de Teste - Simulador Simplificado</h1>

            {/* BOTÕES */}
            <div className="flex gap-2">
                {SHOW_V2_BUTTON && (
                    <button
                        onClick={handleV2Click}
                        className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                    >
                        V2 – Detectar parede automaticamente
                    </button>
                )}
            </div>

            {/* CANVAS */}
            <div className="border border-gray-300 shadow-lg bg-white">
                <Stage width={900} height={500}>
                    <Layer>
                        {roomImage && (
                            <Image image={roomImage} width={900} height={500} />
                        )}
                    </Layer>

                    <Layer>
                        <Group
                            clipFunc={(ctx) => {
                                ctx.beginPath();
                                if (wallPoints.length >= 2) {
                                    ctx.moveTo(wallPoints[0], wallPoints[1]);
                                    for (let i = 2; i < wallPoints.length; i += 2) {
                                        ctx.lineTo(wallPoints[i], wallPoints[i + 1]);
                                    }
                                }
                                ctx.closePath();
                            }}
                        >
                            {wallpaperImage && (
                                <Rect
                                    width={900}
                                    height={500}
                                    fillPatternImage={wallpaperImage}
                                    fillPatternScale={{ x: 0.5, y: 0.5 }}
                                    opacity={0.9} // Opacidade leve para ver o fundo
                                />
                            )}
                        </Group>

                        {/* CONTORNO DA PAREDE */}
                        <Line
                            points={wallPoints}
                            closed
                            stroke="#00A3FF"
                            strokeWidth={2}
                            dash={[8, 4]}
                        />

                        {/* HANDLES */}
                        {wallPoints.map((_, i) => {
                            if (i % 2 !== 0) return null;

                            const pointIndex = i / 2;
                            const x = wallPoints[i];
                            const y = wallPoints[i + 1];

                            return (
                                <Circle
                                    key={pointIndex}
                                    x={x}
                                    y={y}
                                    radius={6}
                                    fill="#ffffff"
                                    stroke="#00A3FF"
                                    strokeWidth={2}
                                    draggable
                                    onDragMove={(e: any) => {
                                        const newPoints = [...wallPoints];
                                        newPoints[i] = e.target.x();
                                        newPoints[i + 1] = e.target.y();
                                        setWallPoints(newPoints);
                                    }}
                                />
                            );
                        })}
                    </Layer>
                </Stage>
            </div>

            <p className="text-gray-500 mt-4">Acesse <a href="/simulador" className="text-blue-500 underline">/simulador</a> para a versão completa.</p>
        </div>
    );
}
