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

    // Zoom & Pan State
    const [stageScale, setStageScale] = useState(1);
    const [stagePos, setStagePos] = useState({ x: 0, y: 0 });

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

    // Helper to get pointer position relative to stage (handling zoom/pan)
    const getRelativePointerPosition = (node: any) => {
        const transform = node.getAbsoluteTransform().copy();
        transform.invert();
        const pos = transform.point(node.getStage().getPointerPosition());
        return pos;
    };

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

    const handleWheel = (e: any) => {
        // Only zoom in masking mode
        if (mode !== 'masking') return;

        e.evt.preventDefault();
        const stage = e.target.getStage();
        const scaleBy = 1.1;
        const oldScale = stage.scaleX();
        const pointer = stage.getPointerPosition();

        const mousePointTo = {
            x: (pointer.x - stage.x()) / oldScale,
            y: (pointer.y - stage.y()) / oldScale,
        };

        const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;

        // Limit zoom
        if (newScale < 0.5 || newScale > 5) return;

        setStageScale(newScale);

        const newPos = {
            x: pointer.x - mousePointTo.x * newScale,
            y: pointer.y - mousePointTo.y * newScale,
        };
        setStagePos(newPos);
    };

    const handleMouseDown = (e: any) => {
        if (mode === 'masking') {
            const stage = e.target.getStage();
            // Important: Get position relative to the layer/group, compensating for stage zoom/pan
            // Actually for drawing lines on a layer that SCALES with the stage, we want the ORIGINAL coordinate space?
            // No, the Stage scales, so the Layer scales. 
            // If I draw a line from (0,0) to (100,100), and stage is scaled 2x, line appears long.
            // So I need the "Virtual" coordinates (model coordinates), so I must untransform the pointer.
            const pointer = getRelativePointerPosition(stage.getLayers()[0]); // Use first layer for transform reference

            if (activeTool === 'poly') {
                if (onStageClick) {
                    // We need to pass the transformed coordinates back for the polygon point
                    // onStageClick expects raw event or we wrap it. 
                    // Existing poly logic likely relies on `e.target` or something.
                    // Let's assume onStageClick needs adaptation or we handle it here.
                    // For now, let's just let it pass but poly might be broken with zoom if it uses raw pointer.
                    // To fix poly point addition:
                    if (onPointsChange) {
                        // We are not adding points here, page.tsx does.
                        // We should probably just pass the event, but Page.tsx will use `e.target.getStage().getPointerPosition()` 
                        // which is SCREEN coords. Any logic adding points needs to use `getRelativePointerPosition`.
                        // Since I cannot see Page.tsx logic for `handleStageClick`, I assume it might need update.
                        // But for now, focus on Brush.
                        onStageClick(e);
                    }
                }
            } else if (activeTool && ['brush-add', 'brush-remove'].includes(activeTool) && selectedWallId) {
                // Start drawing
                setIsPaintDrawing(true);
                setCurrentStroke({
                    tool: activeTool === 'brush-add' ? 'add' : 'remove',
                    size: brushSize / stageScale, // Adjust brush size visual? No, size 20 is model units. 
                    points: [pointer.x, pointer.y]
                });
            }
        }
    };

    const [cursorPos, setCursorPos] = useState<{ x: number, y: number } | null>(null);

    // ... (useEffect remains same)

    const handleMouseMove = (e: any) => {
        const stage = e.target.getStage();
        if (!stage) return;

        // Raw pointer for slider (which is UI overlay, not zoomed?)
        // Wait, if I zoom the Stage, EVERYTHING zooms, including UI overlays?
        // Usually UI overlay should use an independent layer that DOES NOT zoom.
        // But Konva Stage scale applies to all Layers unless I handle it differently.
        // If I scale Stage, Layer 3 (UI) also scales.
        // That means the Slider will get huge or small.
        // BAD.
        // Ideally, we only scale Layer 1 & 2 (Content). Layer 3 (UI) should stay fixed.
        // So I should apply scale/pos to Layer 1&2 Groups, NOT the Stage.
        // THIS IS CRITICAL.

        // REVISED APPROACH:
        // Do NOT scale Stage.
        // Scale a wrapper Group inside Layer 1 & 2?
        // Or apply scale/x/y to Layer 1 and Layer 2 directly?
        // Yes, apply transforms to Layer 1 and Layer 2. Leave Layer 3 (UI) Unscaled.
        // Wait, if I pan, the background moves. The UI (slider) should likely stay?
        // The Slider is "Before/After". It cuts the view. The cut line is screen-space.
        // If I zoom in, I want to inspect details.
        // The Slider should probably operate on SCREEN space width?
        // Yes.

        // Okay, so:
        // Stage stays fixed 100%.
        // Layer 1 (Image) & Layer 2 (Patterns) get the scale/x/y props.
        // Layer 3 (UI) stays default.

        // Pointer logic:
        // handleMouseDown/Move needs to know if we are interacting with UI or Content.
        // Brush drawing happens in "Content Space". So we need transformed pointer.
        // Slider dragging happens in "Screen Space". So we need raw pointer.

        const pointerRaw = stage.getPointerPosition();
        if (!pointerRaw) return;

        // Cursor pos for UI circle (Screen Space? Or Content Space?)
        // If I draw on content, I want the green circle to 'stick' to the content pos?
        // If I zoom in, the brush circle should appear the size of the brush relative to the wall.
        // So if brush is 20px (on wall), and I zoom 2x, it looks like 40px on screen.
        // So Cursor Circle should correspond to Model coordinates.
        // So `cursorPos` should be Model Coordinates.

        const pointerModel = getRelativePointerPosition(stage.getLayers()[0]); // Layer 1 has the transform

        // Update cursor position for visual feedback
        setCursorPos({ x: pointerModel.x, y: pointerModel.y });

        if (isDraggingSlider) {
            setSliderX(Math.max(0, Math.min(dimensions.width, pointerRaw.x)));
        } else if (isPaintDrawing && currentStroke) {
            // Append points in Model Space
            setCurrentStroke({
                ...currentStroke,
                points: [...currentStroke.points, pointerModel.x, pointerModel.y]
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
            onWheel={handleWheel}
            onMouseLeave={() => {
                setIsDraggingSlider(false);
                setIsPaintDrawing(false);
                setCursorPos(null); // Hide cursor when leaving stage
            }}
            className={mode === 'masking' ? 'cursor-none' : isDraggingSlider ? 'cursor-ew-resize' : 'cursor-default'} // Always hide system cursor in masking mode to show custom one
        >
            {/* Layer 1: Background Image (Bottom) */}
            <Layer
                scaleX={stageScale}
                scaleY={stageScale}
                x={stagePos.x}
                y={stagePos.y}
            >
                <URLImage
                    src={bgImageUrl}
                    width={dimensions.width}
                    height={dimensions.height}
                />
            </Layer>

            {/* Layer 2: Wall Patterns (Middle) - Contains the masking magic */}
            <Layer
                globalCompositeOperation="multiply"
                // Slider Clipping at Layer level for the entire "After" view
                clipFunc={mode === 'view' ? (ctx) => {
                    // With zooming, the clipRect is tricky.
                    // The clipFunc is applied in the Local Coordinate Space of the Layer?
                    // Yes. So if Layer is scaled, we should use coordinates that match the visible area?
                    // Actually, sliderX is in SCREEN coords (unscaled).
                    // If content is zoomed, the clip should still follow the visual slider line.
                    // The clipFunc context will have the Layer transform applied.
                    // So we need to inverse transform the sliderX to local coords?
                    // ctx.transform is already applied.
                    // If we draw rect(0,0, w, h), it will scale.
                    // But sliderX is absolute screen X.
                    // So we want to clip from `unproject(sliderX)` to end.
                    // This is complex for clipFunc.
                    // Alternative: Don't scale Layer 2. Scale a Group inside Layer 2.
                    // Then clipFunc on Layer won't be affected by scale?
                    // No, if I scale Layer, everything scales.
                    // Let's stick to simple first:
                    // If I zoom, the split view also zooms?
                    // Usually Split View is a screen-space effect.
                    // So left side is Original (zoomed), right side is Sim (zoomed).
                    // So the clip line should stay fixed on screen.
                    // If I zoom, the content zooms, but the split line stays?
                    // Yes.
                    // To achieve fixed split line on zoomed content:
                    // We need to counter-scale the clip rect? Or use `ctx.setTransform(1,0,0,1,0,0)` to reset?
                    // `clipFunc(ctx)` receives a context with current transform.
                    // We can reset transform inside clipFunc!
                    ctx.save();
                    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset to screen space
                    ctx.rect(sliderX, 0, dimensions.width - sliderX, dimensions.height);
                    ctx.restore();
                } : undefined}
                scaleX={stageScale}
                scaleY={stageScale}
                x={stagePos.x}
                y={stagePos.y}
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

            {/* Layer 3: Interactive World UI (Handles, Cursor) - SCALED & PANNED */}
            <Layer
                scaleX={stageScale}
                scaleY={stageScale}
                x={stagePos.x}
                y={stagePos.y}
            >
                {/* Brush Cursor Preview */}
                {mode === 'masking' && cursorPos && (activeTool === 'brush-add' || activeTool === 'brush-remove') && (
                    <Circle
                        x={cursorPos.x}
                        y={cursorPos.y}
                        radius={brushSize / 2}
                        stroke={activeTool === 'brush-remove' ? 'red' : '#22c55e'} // Red or Green-500
                        strokeWidth={2 / stageScale} // Keep stroke constant width visually? Or scale? 2/scale keeps it thin.
                        fill={activeTool === 'brush-remove' ? 'rgba(255, 0, 0, 0.2)' : 'rgba(34, 197, 94, 0.2)'}
                        listening={false}
                    />
                )}

                {/* Masking UI (Visible only when masking) */}
                {mode === 'masking' && (
                    <>
                        <Line
                            points={wallPoints.flatMap(p => [p.x, p.y])}
                            closed={wallPoints.length > 2}
                            stroke="#00A3FF"
                            strokeWidth={2 / stageScale} // Constant visual width
                            dash={[8 / stageScale, 4 / stageScale]} // Constant visual dash
                        />
                        {wallPoints.map((point, i) => (
                            <Circle
                                key={i}
                                x={point.x}
                                y={point.y}
                                radius={6 / stageScale} // Constant visual radius
                                fill="white"
                                stroke="#00A3FF"
                                strokeWidth={2 / stageScale}
                                draggable
                                onDragMove={(e) => {
                                    // Pointer is Screen Space, but e.target.x() is Layer Space (Local).
                                    // Since Layer is scaled, x() returns local coord. Perfect.
                                    const newPoints = [...wallPoints];
                                    newPoints[i] = { x: e.target.x(), y: e.target.y() };
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
                                    if (container) container.style.cursor = 'crosshair';
                                }}
                            />
                        ))}
                    </>
                )}
            </Layer>

            {/* Layer 4: Static Screen UI (Slider) - NO SCALE */}
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
                                x={-80}
                                text="ORIGINAL"
                                fill="white"
                                fontSize={16}
                                fontStyle="bold"
                                shadowColor="black"
                                shadowBlur={4}
                            />
                            <KonvaText
                                x={15}
                                text="SIMULAÇÃO"
                                fill="white"
                                fontSize={16}
                                fontStyle="bold"
                                shadowColor="black"
                                shadowBlur={4}
                            />
                        </Group>
                    </Group>
                )}
            </Layer>
        </Stage>
    );
}
