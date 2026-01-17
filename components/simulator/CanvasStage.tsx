'use client';

import React, { useEffect, useState } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect } from 'react-konva';
import useImage from 'use-image';

interface CanvasStageProps {
    bgImageUrl: string;
    patternUrl: string | null;
    opacity: number;
    scale: number;
}

const URLImage = ({ src, x, y, width, height, opacity = 1, globalCompositeOperation = 'source-over' }: any) => {
    const [image] = useImage(src);
    return (
        <KonvaImage
            image={image}
            x={x}
            y={y}
            width={width}
            height={height}
            opacity={opacity}
            globalCompositeOperation={globalCompositeOperation}
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
            globalCompositeOperation="multiply" // Fusion mode for better realism
        />
    );
};

export default function CanvasStage({ bgImageUrl, patternUrl, opacity, scale }: CanvasStageProps) {
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    const [image] = useImage(bgImageUrl);

    useEffect(() => {
        if (image) {
            // Calculate aspect ratio to fit container
            const containerWidth = Math.min(window.innerWidth - 64, 800); // Max width 800px or responsive
            const ratio = image.width / image.height;
            setDimensions({
                width: containerWidth,
                height: containerWidth / ratio
            });
        }
    }, [image]);

    if (!bgImageUrl) return null;

    return (
        <Stage width={dimensions.width} height={dimensions.height}>
            <Layer>
                {/* Background Wall Image */}
                <URLImage
                    src={bgImageUrl}
                    width={dimensions.width}
                    height={dimensions.height}
                />

                {/* Pattern Overlay */}
                {patternUrl && (
                    <PatternLayer
                        patternUrl={patternUrl}
                        width={dimensions.width}
                        height={dimensions.height}
                        opacity={opacity}
                        scale={scale}
                    />
                )}
            </Layer>
        </Stage>
    );
}
