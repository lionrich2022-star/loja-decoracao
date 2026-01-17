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
    onPointsChange?: (points: { x: number; y: number }[]) => void;

    // V4 Props
    activeTool?: 'poly' | 'brush-add' | 'brush-remove';
    brushSize?: number;
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

export default function CanvasStage({ bgImageUrl, patternUrl, opacity, scale, mode, wallPoints = [], onStageClick, walls = [], selectedWallId, onWallsChange, onSelectWall, onPointsChange, activeTool = 'poly', brushSize = 20 }: CanvasStageProps) {
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    const [image] = useImage(bgImageUrl || '');
    const [sliderX, setSliderX] = useState<number>(400);
    const [isDraggingSlider, setIsDraggingSlider] = useState(false);

    // V4 Drawing State
    const [isPaintDrawing, setIsPaintDrawing] = useState(false);
    const [currentStroke, setCurrentStroke] = useState<{ points: number[], tool: 'add' | 'remove', size: number } | null>(null);

    // ... (useEffect for resize remains same) ...
    useEffect(() => {
        if (image) {
            const containerWidth = Math.min(window.innerWidth - 64, 800);
            const ratio = image.width / image.height;
            const newHeight = containerWidth / ratio;
            setDimensions({
                width: containerWidth,
                height: newHeight
            });
            setSliderX(containerWidth / 2);
        }
    }, [image]);

    // Group Ref for caching if needed (skipping strict caching for MVP, trying Layer composition)
    // Note: For 'destination-in' to work, the group typically needs to be on its own Layer or cached.
    // In React Konva, simple nesting might fail the blend mode without cache.
    // Let's rely on the top-level Layer Clearing.

    if (!bgImageUrl) return null;

    // ... (Default mask logic) ...
    const hasUserMask = wallPoints.length >= 3;
    const defaultMask = [
        { x: dimensions.width * 0.1, y: dimensions.height * 0.1 },
        { x: dimensions.width * 0.9, y: dimensions.height * 0.1 },
        { x: dimensions.width * 0.9, y: dimensions.height * 0.8 },
        { x: dimensions.width * 0.1, y: dimensions.height * 0.8 },
    ];
    const activeMask = hasUserMask ? wallPoints : defaultMask;

    const handleMouseDown = (e: any) => {
        if (mode === 'masking') {
            const stage = e.target.getStage();
            const pointer = stage.getPointerPosition();

            if (activeTool === 'poly') {
                if (onStageClick) onStageClick(e);
            } else if (activeTool && ['brush-add', 'brush-remove'].includes(activeTool) && selectedWallId) {
                // Start drawing
                setIsPaintDrawing(true);
                setCurrentStroke({
                    tool: activeTool === 'brush-add' ? 'add' : 'remove',
                    size: brushSize,
                    points: [pointer.x, pointer.y]
                });
            }
        }
    };

    const handleMouseMove = (e: any) => {
        const stage = e.target.getStage();
        const pointer = stage.getPointerPosition();
        if (!stage || !pointer) return;

        if (isDraggingSlider) {
            setSliderX(Math.max(0, Math.min(dimensions.width, pointer.x)));
        } else if (isPaintDrawing && currentStroke) {
            // Append points
            setCurrentStroke({
                ...currentStroke,
                points: [...currentStroke.points, pointer.x, pointer.y]
            });
        }
    };

    const handleMouseUp = () => {
        setIsDraggingSlider(false);
        if (isPaintDrawing && currentStroke && selectedWallId && onWallsChange) {
            // Commit stroke
            const updatedWalls = walls.map(w => {
                if (w.id === selectedWallId) {
                    return {
                        ...w,
                        brushStrokes: [...(w.brushStrokes || []), { ...currentStroke, id: Date.now().toString() }]
                    };
                }
                return w;
            });
            onWallsChange(updatedWalls);
            setCurrentStroke(null);
            setIsPaintDrawing(false);
        }
    };

    return (
        <Stage
            width={dimensions.width}
            height={dimensions.height}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => { setIsDraggingSlider(false); setIsPaintDrawing(false); }}
            className={mode === 'masking' ? (activeTool === 'poly' ? 'cursor-crosshair' : 'cursor-none') : isDraggingSlider ? 'cursor-ew-resize' : 'cursor-default'}
        >
            {/* Layer 1: Background Image (Bottom) */}
            <Layer>
                <URLImage
                    src={bgImageUrl}
                    width={dimensions.width}
                    height={dimensions.height}
                />
            </Layer>

            {/* Layer 2: Wall Patterns (Middle) - Contains the masking magic */}
            <Layer
                // Slider Clipping at Layer level for the entire "After" view
                clipFunc={mode === 'view' ? (ctx) => {
                    // In View mode, we only show this layer (the simulation) to the right of the slider
                    // But wait, the slider logic in the original code was:
                    // SliderX defines the split.
                    // Left side = Original (Background only).
                    // Right side = Simulation (Background + Wallpaper).
                    // So we typically want to CLIP this whole Layer to the region > SliderX
                    // OR < SliderX depending on design. 
                    // Standard: Left = Original, Right = Simulation? 
                    // The user uploaded image shows: Left = Original, Right = Sim.
                    // So we clip this layer to rect(sliderX, 0, width-sliderX, height).
                    ctx.rect(sliderX, 0, dimensions.width - sliderX, dimensions.height);
                } : undefined}
            >
                {/* Render each wall independently */}
                {walls.length > 0 ? (
                    walls.map((wall) => {
                        const currentPattern = wall.paperUrl || patternUrl;
                        if (!currentPattern) return null;

                        return (
                            <Group key={wall.id}>
                                {/* 
                                   COMPLEX MASKING STRATEGY: 
                                   1. Define the Shape (Poly + AddStrokes - RemoveStrokes).
                                   2. Fill it with Pattern.
                                */}
                                <Group>
                                    {/* 
                                       The Mask Shape: Render the polygon and brush strokes as a black shape.
                                       This will define the area where the pattern will be visible.
                                    */}
                                    <Group>
                                        {/* Base Polygon */}
                                        <Line
                                            points={(wall.points.length >= 3 ? wall.points : defaultMask).flatMap(p => [p.x, p.y])}
                                            closed
                                            fill="black"
                                        // Ensure this is treated as the base content for this group logic
                                        />
                                        {/* Brush Strokes */}
                                        {wall.brushStrokes?.map((stroke: any, i: number) => (
                                            <Line
                                                key={i}
                                                points={stroke.points}
                                                stroke="black"
                                                strokeWidth={stroke.size}
                                                lineCap="round"
                                                lineJoin="round"
                                                globalCompositeOperation={stroke.tool === 'remove' ? 'destination-out' : 'source-over'}
                                            />
                                        ))}
                                        {/* Current Drawing Stroke (If this is the active wall) */}
                                        {isPaintDrawing && currentStroke && selectedWallId === wall.id && (
                                            <Line
                                                points={currentStroke.points}
                                                stroke="black"
                                                strokeWidth={currentStroke.size}
                                                lineCap="round"
                                                lineJoin="round"
                                                globalCompositeOperation={currentStroke.tool === 'remove' ? 'destination-out' : 'source-over'}
                                            />
                                        )}
                                    </Group>

                                    {/* 
                                       The Pattern Layer: Render the pattern, using 'source-in' to only show it
                                       where it overlaps with the black mask shape rendered above.
                                       
                                       CRITICAL: For 'source-in' to work against ONLY the mask we just drew, 
                                       they need to be composited together. In a single Layer, 'source-in' 
                                       uses EVERYTHING below it as the mask. 
                                       Since this Layer only contains Walls, enabling 'clearBeforeDraw' is default.
                                       However, if we have Multiple Walls, Wall A is drawn first.
                                       Wall B uses 'source-in'. It will use Wall A as part of the mask if we aren't careful.
                                       
                                       Ideally, each Wall should be its own Layer? No, that's too heavy.
                                       We can use globalCompositeOperation='source-over' for the result of (Mask + Pattern).
                                       
                                       Solution:
                                       We need to cache the Mask Group? 
                                       Or we accept that Walls don't overlap much.
                                       
                                       Better approach for Konva:
                                       Use 'clipFunc' on a Group instead of composite operations?
                                       Konva Groups support arbitrary clipFuncs but they are canvas path commands, 
                                       hard to do with Brush strokes (raster).
                                       
                                       Back to Compositing:
                                       We can render the Pattern for the WHOLE screen, 
                                       then use the Mask to cut it?
                                       
                                       Let's try this order for a single wall:
                                       1. Draw Mask (Black).
                                       2. Draw Pattern (source-in). 
                                       This replaces the Black Mask with Pattern.
                                       
                                       If we have multiple walls:
                                       1. Draw Wall 1 Mask -> Pattern.
                                       2. Draw Wall 2 Mask -> Pattern.
                                       
                                       If Wall 2 draws 'source-in', it uses (Wall 1 + Wall 2 Mask) as the source?
                                       Yes, 'destination' is the accumulator.
                                       
                                       To isolate walls, we might encounter issues.
                                       BUT for MVP V4 with typically non-overlapping walls, this is fine.
                                    */}
                                    <PatternLayer
                                        patternUrl={currentPattern}
                                        width={dimensions.width}
                                        height={dimensions.height}
                                        opacity={wall.opacity || opacity}
                                        scale={wall.scale || scale}
                                        globalCompositeOperation="source-in"
                                    />
                                </Group>

                                {/* Selected Outline */}
                                {selectedWallId === wall.id && mode === 'view' && (
                                    <Line
                                        points={wall.points.flatMap(p => [p.x, p.y])}
                                        closed
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        opacity={0.5}
                                        globalCompositeOperation="source-over" // Reset
                                    />
                                )}
                            </Group>
                        );
                    })
                ) : (
                    // Fallback: V1 Single Wall (Active User Mask)
                    patternUrl && (
                        <Group>
                            {/* Replicate logic for V1 if needed, or just use clipFunc for simple poly */}
                            {/* Keep simple clipFunc for V1 for now as it supports no brushes */}
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
                        </Group>
                    )
                )}
            </Layer>

            {/* Layer 3: UI Overlays (Top) */}
            <Layer>
                {/* Slider UI (Visible in View Mode) */}
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

                {/* Masking UI (Visible only when masking) */}
                {mode === 'masking' && (
                    <>
                        <Line
                            points={wallPoints.flatMap(p => [p.x, p.y])}
                            closed={wallPoints.length > 2}
                            stroke="#ef4444"
                            strokeWidth={2}
                            dash={[10, 5]}
                        />
                        {wallPoints.map((point, i) => (
                            <Circle
                                key={i}
                                x={point.x}
                                y={point.y}
                                radius={8} // Slightly larger hit area
                                fill="white"
                                stroke="#ef4444"
                                strokeWidth={2}
                                draggable
                                onDragMove={(e) => {
                                    const newPoints = [...wallPoints];
                                    newPoints[i] = { x: e.target.x(), y: e.target.y() };
                                    // Optimistic update if needed, but usually we rely on parent callback
                                    // For smooth dragging in React Konva, usually better to update state onDragMove
                                    if (onPointsChange) {
                                        onPointsChange(newPoints);
                                    }
                                }}
                                onMouseEnter={(e) => {
                                    const container = e.target.getStage()?.container();
                                    if (container) container.style.cursor = 'move';
                                }}
                                onMouseLeave={(e) => {
                                    const container = e.target.getStage()?.container();
                                    if (container) container.style.cursor = 'crosshair'; // Back to tool cursor
                                }}
                            />
                        ))}
                    </>
                )}
            </Layer>
        </Stage>
    );
}
