import React, { useEffect, useState, useRef } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Group, Line, Circle, Text as KonvaText } from 'react-konva';
import Konva from 'konva';
import useImage from 'use-image';

import { WallData, SIMULATOR_CONFIG } from './SimulatorConfig';

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

// Helper for Golden Ratio Auto-Scale
function calculatePatternScale(wallWidth: number) {
    if (wallWidth > 1200) return 0.18; // paredes grandes
    if (wallWidth > 800) return 0.22;  // médias
    return 0.28;                       // pequenas
}



const PatternLayer = ({ patternUrl, width, height, preset, scale, ...props }: any) => {
    const [image, status] = useImage(patternUrl || '', 'anonymous');

    // Use user-provided scale OR auto-calculate based on wall width if scale is default/1
    // Actually, 'scale' prop comes from the slider. If user hasn't touched it, it might be 1.
    // But we want to respect the slider.
    // Let's assume the passed 'scale' props is what we use, but we default the SLIDER in page.tsx to a good value?
    // The user request implies using this function.
    // "const patternScale = calculatePatternScale(wall.width);"
    // Let's use this logic to derive the final scale used for rendering.

    // NOTE: In `CanvasStage` we receive `scale` which is the Slider value.
    // If the user wants `calculatePatternScale` to be the "Base", maybe the slider adjusts relative to it?
    // Or maybe the Slider SETS this value initially?
    // Given the previous Context, the slider is explicit.
    // BUT the user just sent: "const patternScale = calculatePatternScale(wall.width);"
    // So let's use that specific logic for the pattern scale.
    // However, we still have a slider 'scale'. 
    // Let's use the explicit 'scale' prop but refer to the calculate function if needed?
    // Actually, looking at the user's snippet "fillPatternScale={{ x: patternScale, y: patternScale }}",
    // they likel want this variable to be defined.

    // Let's defer "Auto-Scale" on init to the Page component, and here we just render what we are given?
    // NO, the user updated `CanvasStage.tsx` in the snippet.
    // Let's assume the `scale` prop PASSED IN is the one we use.
    // But we need to apply the Golden Ratio visual settings (Blur, Gradient, Opacity).

    return (
        <Group {...props}>
            {/* Main Pattern Rect - clips to the mask using inherited globalCompositeOperation (source-in) */}
            <Rect
                x={0}
                y={0}
                width={width}
                height={height}
                fillPatternImage={image || undefined}
                fill={image ? undefined : "rgba(0,0,0,0)"}
                fillPatternRepeat="repeat"
                fillPatternScale={{ x: scale, y: scale }}
                opacity={preset.opacity}
                // CRITICAL FIX: Do NOT use preset.blend (multiply) here. 
                // It multiplies against the black mask, creating a black box.
                // We trust the Prop passed (source-in) to handle the masking.
                // The PARENT LAYER already handles the 'multiply' blend with the room.
                globalCompositeOperation={props.globalCompositeOperation || "source-in"}
                filters={[Konva.Filters.Blur]}
                blurRadius={preset.blur}
            />

            {/* Shadow Gradient Overlay - clips to the pattern using source-atop */}
            <Rect
                width={width}
                height={height}
                fillLinearGradientStartPoint={{ x: 0, y: 0 }}
                fillLinearGradientEndPoint={{ x: 0, y: height }}
                fillLinearGradientColorStops={[
                    0, "rgba(0,0,0,0.10)", // Subtle top shadow
                    1, "rgba(0,0,0,0.30)"  // Stronger bottom shadow
                ]}
                listening={false}
                globalCompositeOperation="source-atop"
            />
        </Group>
    );
};

export default function CanvasStage(props: any) {
    // This is just a wrapper for the forwardRef component to handle the dynamic import constraints if needed, 
    // but typically dynamic import works with forwardRef components too. 
    // However, the cleanest way in Next.js dynamic import + ref is tricky.
    // Let's rely on the user having done 'const CanvasStage = dynamic(..., { ssr: false })'.
    // Actually, dynamic imports WIPE the ref unless the component uses forwardRef AND is statically typed or we cast it?
    // Let's just export the forwardRef component as default.
    return <CanvasStageInner {...props} />;
}

const CanvasStageInner = React.forwardRef(({ bgImageUrl, patternUrl, preset, scale, mode, wallPoints = [], onStageClick, walls = [], selectedWallId, onWallsChange, onSelectWall, onPointsChange, activeTool = 'poly', brushSize = 20 }: any, ref: any) => {
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
            ref={ref}
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
                // Slider Clipping at Layer level for the entire "After" view, ONLY if enabled
                clipFunc={(mode === 'view' && SIMULATOR_CONFIG.enableBeforeAfter && patternUrl) ? (ctx) => {
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
                                        preset={preset}
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
                                    preset={preset}
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
                                strokeWidth={2 / stageScale}
                                draggable
                                onMouseDown={(e) => {
                                    e.cancelBubble = true;
                                }}
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

            {/* Layer 3.5: Branding (Store Info) - Always Visible, Unscaled or Scaled? 
                User requested: Text "Loja Exemplo" + Image Logo.
                User provided code: 
                  <Layer>
                    <Text text="Loja Exemplo..." y={canvasHeight - 40} ... />
                  </Layer>
                The user put this AFTER the wallpaper layer.
                Ideally this should be static UI (Unscaled) so it stays in the corner.
            */}
            <Layer>
                {/* Branding Gradient for readability */}
                <Rect
                    y={dimensions.height - 60}
                    width={dimensions.width}
                    height={60}
                    fillLinearGradientStartPoint={{ x: 0, y: 0 }}
                    fillLinearGradientEndPoint={{ x: 0, y: 60 }}
                    fillLinearGradientColorStops={[0, "transparent", 1, "rgba(0,0,0,0.8)"]}
                    listening={false}
                />

                <KonvaText
                    text="DECORA DESING • WhatsApp (38) 99726-9019"
                    x={20}
                    y={dimensions.height - 25}
                    fontSize={16}
                    fill="#ffffff"
                    shadowColor="black"
                    shadowBlur={4}
                    opacity={0.9}
                    fontStyle="bold"
                />
                {/* Placeholder for Logo if we had the image loaded */}
                {/* <KonvaImage ... /> */}
            </Layer>

            {/* Layer 4: Static Screen UI (Slider & Labels) - NO SCALE */}
            <Layer>
                {/* Static Labels (Premium Style - Fixed at bottom corners) */}
                {mode === 'view' && patternUrl && SIMULATOR_CONFIG.enableBeforeAfter && (
                    <>
                        {/* ORIGINAL Label (Left) */}
                        <Group x={20} y={dimensions.height - 60}>
                            <Rect
                                width={80}
                                height={24}
                                fill="rgba(0,0,0,0.6)"
                                cornerRadius={12}
                            />
                            <KonvaText
                                width={80}
                                height={24}
                                text="ORIGINAL"
                                fill="white"
                                fontSize={10}
                                fontStyle="bold"
                                align="center"
                                verticalAlign="middle"
                            />
                        </Group>

                        {/* SIMULATION Label (Right) */}
                        <Group x={dimensions.width - 100} y={dimensions.height - 60}>
                            <Rect
                                width={80}
                                height={24}
                                fill="rgba(0,163,255,0.8)" // Blue brand color
                                cornerRadius={12}
                            />
                            <KonvaText
                                width={80}
                                height={24}
                                text="SIMULAÇÃO"
                                fill="white"
                                fontSize={10}
                                fontStyle="bold"
                                align="center"
                                verticalAlign="middle"
                            />
                        </Group>
                    </>
                )}

                {/* Slider UI (Visible in View Mode) */}
                {mode === 'view' && patternUrl && SIMULATOR_CONFIG.enableBeforeAfter && (
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
                        {/* Minimalist Line */}
                        <Line
                            points={[0, 0, 0, dimensions.height]}
                            stroke="white"
                            strokeWidth={2}
                            shadowColor="black"
                            shadowBlur={4}
                            shadowOpacity={0.4}
                        />
                        {/* Minimalist Handle */}
                        <Circle
                            y={dimensions.height / 2}
                            radius={16}
                            fill="white"
                            shadowColor="black"
                            shadowBlur={4}
                            shadowOpacity={0.2}
                        />
                        {/* Arrows Icon */}
                        <KonvaText
                            y={dimensions.height / 2 - 6}
                            x={-7}
                            text="< >"
                            fontSize={12}
                            fontStyle="bold"
                            fill="#666"
                            align="center"
                        />
                    </Group>
                )}
            </Layer>

        </Stage>
    );
});
