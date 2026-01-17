import React, { useEffect, useState, useRef } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Group, Line, Circle, Text as KonvaText } from 'react-konva';
import useImage from 'use-image';

import { WallData } from './SimulatorConfig';

interface CanvasStageProps {
    bgImageUrl: string | null;
    patternUrl: string | null;
    opacity: number;
    scale: number;
    mode: 'view' | 'masking';
    wallPoints?: { x: number; y: number }[];
    onStageClick?: (e: any) => void;
    // V3 Props
    walls?: WallData[];
    selectedWallId?: string | null;
    onWallsChange?: (walls: WallData[]) => void;
    onSelectWall?: (id: string | null) => void;
}

const URLImage = ({ src, width, height }: any) => {
    const [image] = useImage(src);
    return (
        <KonvaImage
            image={image}
            width={width}
            height={height}
        />
    );
};

const PatternLayer = ({ patternUrl, width, height, opacity, scale }: any) => {
    const [image] = useImage(patternUrl || '');

    if (!image || !patternUrl) return null;

    return (
        <Rect
            x={0}
            y={0}
            width={width}
            height={height}
            fillPatternImage={image}
            fillPatternScale={{ x: scale, y: scale }}
            opacity={opacity}
            globalCompositeOperation="multiply"
        />
    );
};

export default function CanvasStage({ bgImageUrl, patternUrl, opacity, scale, mode, wallPoints = [], onStageClick, walls = [], selectedWallId, onWallsChange, onSelectWall }: CanvasStageProps) {
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    const [image] = useImage(bgImageUrl || undefined);
    const [sliderX, setSliderX] = useState<number>(400); // Default slider position
    const [isDraggingSlider, setIsDraggingSlider] = useState(false);

    useEffect(() => {
        if (image) {
            const containerWidth = Math.min(window.innerWidth - 64, 800);
            const ratio = image.width / image.height;
            const newHeight = containerWidth / ratio;
            setDimensions({
                width: containerWidth,
                height: newHeight
            });
            setSliderX(containerWidth / 2); // Center slider initially
        }
    }, [image]);

    if (!bgImageUrl) return null;

    // Default MVP Mask (Central Rectangle) if no points defined
    const hasUserMask = wallPoints.length >= 3;
    const defaultMask = [
        { x: dimensions.width * 0.1, y: dimensions.height * 0.1 }, // Top-Left
        { x: dimensions.width * 0.9, y: dimensions.height * 0.1 }, // Top-Right
        { x: dimensions.width * 0.9, y: dimensions.height * 0.8 }, // Bottom-Right
        { x: dimensions.width * 0.1, y: dimensions.height * 0.8 }, // Bottom-Left
    ];
    const activeMask = hasUserMask ? wallPoints : defaultMask;

    return (
        <Stage
            width={dimensions.width}
            height={dimensions.height}
            onMouseDown={(e) => {
                if (mode === 'masking' && onStageClick) onStageClick(e);
            }}
            onMouseMove={(e) => {
                const stage = e.target.getStage();
                if (isDraggingSlider && stage) {
                    const pointer = stage.getPointerPosition();
                    if (pointer) {
                        setSliderX(Math.max(0, Math.min(dimensions.width, pointer.x)));
                    }
                }
            }}
            onMouseUp={() => setIsDraggingSlider(false)}
            onMouseLeave={() => setIsDraggingSlider(false)}
            className={mode === 'masking' ? 'cursor-crosshair' : isDraggingSlider ? 'cursor-ew-resize' : 'cursor-default'}
        >
            <Layer>
                {/* 1. Background Image (Always Visible) */}
                <URLImage
                    src={bgImageUrl}
                    width={dimensions.width}
                    height={dimensions.height}
                />

                {/* 2. Pattern Group (Before/After Slider + Mask) */}
                {/* 2. Pattern Group (Multi-Wall V3) */}
                <Group
                    // Slider Clipping (Global for all walls for now, simplifies comparison)
                    clipFunc={(ctx) => {
                        ctx.rect(sliderX, 0, dimensions.width - sliderX, dimensions.height);
                    }}
                >
                    {/* Render each wall independently */}
                    {walls.length > 0 ? (
                        walls.map((wall) => {
                            // Use specific paper for this wall, or global fallback if selected
                            const currentPattern = wall.paperUrl || patternUrl;
                            if (!currentPattern) return null;

                            return (
                                <Group
                                    key={wall.id}
                                    clipFunc={(ctx) => {
                                        if (wall.points && wall.points.length > 2) {
                                            ctx.beginPath();
                                            ctx.moveTo(wall.points[0].x, wall.points[0].y);
                                            for (let i = 1; i < wall.points.length; i++) {
                                                ctx.lineTo(wall.points[i].x, wall.points[i].y);
                                            }
                                            ctx.closePath();
                                        }
                                    }}
                                >
                                    <PatternLayer
                                        patternUrl={currentPattern}
                                        width={dimensions.width}
                                        height={dimensions.height}
                                        opacity={wall.opacity || opacity}
                                        scale={wall.scale || scale}
                                    />
                                    {/* Highlight Selected Wall */}
                                    {selectedWallId === wall.id && mode === 'view' && (
                                        <Line
                                            points={wall.points.flatMap(p => [p.x, p.y])}
                                            closed
                                            stroke="#3b82f6"
                                            strokeWidth={2}
                                            opacity={0.5}
                                        />
                                    )}
                                </Group>
                            );
                        })
                    ) : (
                        // Fallback: V1 Single Wall (Active User Mask)
                        patternUrl && (
                            <Group
                                clipFunc={(ctx) => {
                                    ctx.beginPath();
                                    if (activeMask.length > 0) {
                                        ctx.moveTo(activeMask[0].x, activeMask[0].y);
                                        for (let i = 1; i < activeMask.length; i++) {
                                            ctx.lineTo(activeMask[i].x, activeMask[i].y);
                                        }
                                    }
                                    ctx.closePath();
                                }}
                            >
                                <PatternLayer
                                    patternUrl={patternUrl}
                                    width={dimensions.width}
                                    height={dimensions.height}
                                    opacity={opacity}
                                    scale={scale}
                                />
                            </Group>
                        )
                    )}
                </Group>


                {/* 3. Slider UI (Visible in View Mode) */}
                {mode === 'view' && patternUrl && (
                    <Group
                        x={sliderX}
                        draggable
                        dragBoundFunc={(pos) => ({ x: Math.max(0, Math.min(pos.x, dimensions.width)), y: 0 })}
                        onDragMove={(e) => setSliderX(e.target.x())}
                        onMouseEnter={(e) => {
                            const container = e.target.getStage()?.container();
                            if (container) container.style.cursor = 'ew-resize';
                        }}
                        onMouseLeave={(e) => {
                            const container = e.target.getStage()?.container();
                            if (container) container.style.cursor = 'default';
                        }}
                    >
                        <Line
                            points={[0, 0, 0, dimensions.height]}
                            stroke="white"
                            strokeWidth={2}
                            shadowColor="black"
                            shadowBlur={5}
                            shadowOpacity={0.5}
                        />
                        <Circle
                            y={dimensions.height / 2}
                            radius={15}
                            fill="white"
                            shadowColor="black"
                            shadowBlur={5}
                            shadowOpacity={0.3}
                        />
                        <KonvaText
                            y={dimensions.height / 2 - 5}
                            x={-5}
                            text="< >"
                            fontSize={10}
                            fontStyle="bold"
                            fill="#333"
                        />
                        {/* Labels for Before/After */}
                        <Group y={20}>
                            <KonvaText
                                x={-60}
                                text="ORIGINAL"
                                fill="white"
                                fontSize={12}
                                fontStyle="bold"
                                shadowColor="black"
                                shadowBlur={2}
                            />
                            <KonvaText
                                x={10}
                                text="SIMULAÇÃO"
                                fill="white"
                                fontSize={12}
                                fontStyle="bold"
                                shadowColor="black"
                                shadowBlur={2}
                            />
                        </Group>
                    </Group>
                )}

                {/* 4. Masking UI (Visible only when masking) */}
                {mode === 'masking' && (
                    <>
                        {/* Show the Default Mask in a lighter color if active but not user-defined? No, show current points */}
                        <Line
                            points={wallPoints.flatMap(p => [p.x, p.y])}
                            closed={wallPoints.length > 2}
                            stroke="#ef4444" // Red-500
                            strokeWidth={2}
                            dash={[10, 5]}
                        />
                        {wallPoints.map((point, i) => (
                            <Circle
                                key={i}
                                x={point.x}
                                y={point.y}
                                radius={6}
                                fill="white"
                                stroke="#ef4444"
                                strokeWidth={2}
                            />
                        ))}
                        {/* Helper Text following cursor? Maybe too complex. */}
                    </>
                )}
            </Layer>
        </Stage>
    );
}
