import React, { useEffect, useState } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Group, Line, Circle } from 'react-konva';
import useImage from 'use-image';

interface CanvasStageProps {
    bgImageUrl: string;
    patternUrl: string | null;
    opacity: number;
    scale: number;
    mode: 'view' | 'masking';
    wallPoints: { x: number; y: number }[];
    onStageClick: (e: any) => void;
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

export default function CanvasStage({ bgImageUrl, patternUrl, opacity, scale, mode, wallPoints, onStageClick }: CanvasStageProps) {
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    const [image] = useImage(bgImageUrl);

    useEffect(() => {
        if (image) {
            const containerWidth = Math.min(window.innerWidth - 64, 800);
            const ratio = image.width / image.height;
            setDimensions({
                width: containerWidth,
                height: containerWidth / ratio
            });
        }
    }, [image]);

    if (!bgImageUrl) return null;

    return (
        <Stage
            width={dimensions.width}
            height={dimensions.height}
            onMouseDown={onStageClick}
            className={mode === 'masking' ? 'cursor-crosshair' : 'cursor-default'}
        >
            <Layer>
                {/* 1. Background Image */}
                <URLImage
                    src={bgImageUrl}
                    width={dimensions.width}
                    height={dimensions.height}
                />

                {/* 2. Pattern Group with Clipping */}
                {patternUrl && (
                    <Group
                        clipFunc={(ctx) => {
                            if (wallPoints.length < 3) {
                                // If no valid mask, show full (or typically nothing? let's default to full for ease)
                                ctx.rect(0, 0, dimensions.width, dimensions.height);
                                return;
                            }
                            ctx.beginPath();
                            ctx.moveTo(wallPoints[0].x, wallPoints[0].y);
                            for (let i = 1; i < wallPoints.length; i++) {
                                ctx.lineTo(wallPoints[i].x, wallPoints[i].y);
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
                )}

                {/* 3. Masking UI (Visible only when masking) */}
                {mode === 'masking' && (
                    <>
                        <Line
                            points={wallPoints.flatMap(p => [p.x, p.y])}
                            closed={wallPoints.length > 2}
                            stroke="red"
                            strokeWidth={2}
                            dash={[10, 5]}
                        />
                        {wallPoints.map((point, i) => (
                            <Circle
                                key={i}
                                x={point.x}
                                y={point.y}
                                radius={5}
                                fill="white"
                                stroke="red"
                                strokeWidth={2}
                            />
                        ))}
                    </>
                )}
            </Layer>
        </Stage>
    );
}
