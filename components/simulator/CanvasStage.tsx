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
    const [image, status] = useImage(patternUrl || '', 'anonymous');

    // Always render the Rect with 'source-in'.
    // If image is loaded, it paints the pattern.
    // If image is missing/loading, it paints transparent pixels, which CLEARS the destination (the black mask).
    return (
        <Rect
            x={0}
            y={0}
            width={width}
            height={height}
            fillPatternImage={image || undefined}
            fill={image ? undefined : "rgba(0,0,0,0)"}
            fillPatternScale={{ x: scale, y: scale }}
            opacity={opacity}
            globalCompositeOperation="source-in"
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

    const [cursorPos, setCursorPos] = useState<{ x: number, y: number } | null>(null);

    // ... (useEffect remains same)

    const handleMouseMove = (e: any) => {
        const stage = e.target.getStage();
        const pointer = stage.getPointerPosition();
        if (!stage || !pointer) return;

        // Update cursor position for visual feedback
        setCursorPos({ x: pointer.x, y: pointer.y });

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
            onMouseLeave={() => {
                setIsDraggingSlider(false);
                setIsPaintDrawing(false);
                setCursorPos(null); // Hide cursor when leaving stage
            }}
            className={mode === 'masking' ? 'cursor-none' : isDraggingSlider ? 'cursor-ew-resize' : 'cursor-default'} // Always hide system cursor in masking mode to show custom one
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
                                <Group>
                                    <Group>
                                        <Line
                                            points={(wall.points.length >= 3 ? wall.points : defaultMask).flatMap(p => [p.x, p.y])}
                                            closed
                                            fill="black"
                                        />
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

                                    <PatternLayer
                                        patternUrl={currentPattern}
                                        width={dimensions.width}
                                        height={dimensions.height}
                                        opacity={wall.opacity || opacity}
                                        scale={wall.scale || scale}
                                        globalCompositeOperation="source-in"
                                    />
                                </Group>

                                {selectedWallId === wall.id && mode === 'view' && (
                                    <Line
                                        points={wall.points.flatMap(p => [p.x, p.y])}
                                        closed
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        opacity={0.5}
                                        globalCompositeOperation="source-over"
                                    />
                                )}
                            </Group>
                        );
                    })
                ) : (
                    patternUrl && (
                        <Group>
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
                {/* ... (Slider UI remains same) ... */}

                {/* Brush Cursor Preview */}
                {mode === 'masking' && cursorPos && (activeTool === 'brush-add' || activeTool === 'brush-remove') && (
                    <Circle
                        x={cursorPos.x}
                        y={cursorPos.y}
                        radius={brushSize / 2}
                        stroke={activeTool === 'brush-remove' ? 'red' : '#22c55e'} // Red or Green-500
                        strokeWidth={2}
                        fill={activeTool === 'brush-remove' ? 'rgba(255, 0, 0, 0.2)' : 'rgba(34, 197, 94, 0.2)'} // Transparent fill
                        listening={false} // Pass events through to the stage
                    />
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
