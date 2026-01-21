import * as tf from '@tensorflow/tfjs';
import * as deeplab from '@tensorflow-models/deeplab';

const modelName = 'ade20k';
const quantizationBytes = 2; // Keep 2 for quality, but handle resize

let model: deeplab.SemanticSegmentation | null = null;

export interface Point {
    x: number;
    y: number;
}

export const loadAutoMaskerModel = async () => {
    if (model) return model;
    await tf.ready();
    console.log('Loading DeepLab ADE20k model...');
    try {
        model = await deeplab.load({
            base: modelName,
            quantizationBytes: quantizationBytes
        });
        return model;
    } catch (e) {
        console.error("Failed to load model", e);
        return null; // Handle graceful failure
    }
};

export const detectWallPoints = async (imageElement: HTMLImageElement, width: number, height: number): Promise<Point[]> => {
    try {
        const loadedModel = await loadAutoMaskerModel();
        if (!loadedModel) throw new Error("Model failed to load");

        // 1. Resize Input for Stability (Max 512px)
        const size = 512;
        const resizeCanvas = document.createElement('canvas');
        resizeCanvas.width = size;
        resizeCanvas.height = size;
        const ctx = resizeCanvas.getContext('2d');
        if (!ctx) return [];
        ctx.drawImage(imageElement, 0, 0, size, size);

        // 2. Segment
        // Note: DeepLab internal resizing is sometimes opaque. Doing it explicitly helps.
        const segmentation = await loadedModel.segment(resizeCanvas);
        const { height: maskHeight, width: maskWidth, segmentationMap } = segmentation;

        // ADE20k: 0=Wall, 1=Building, 5=Ceiling, 3=Floor. 
        // We focus on Wall (0) and Building (1) primarily.
        const targetClasses = [0, 1];

        let wallPixelsCount = 0;
        let minX = maskWidth, maxX = 0, minY = maskHeight, maxY = 0;

        // Analyze presence
        for (let i = 0; i < segmentationMap.length; i++) {
            if (targetClasses.includes(segmentationMap[i])) {
                wallPixelsCount++;
                const px = i % maskWidth;
                const py = Math.floor(i / maskWidth);
                if (px < minX) minX = px;
                if (px > maxX) maxX = px;
                if (py < minY) minY = py;
                if (py > maxY) maxY = py;
            }
        }

        if (wallPixelsCount < (maskWidth * maskHeight * 0.01)) {
            // Less than 1% is wall? Probaly failed.
            // Try fallback to include "Ceiling" (5) just in case?
            console.warn("Low wall detection confidence.");
            if (wallPixelsCount === 0) return [];
        }

        // 3. Algorithm: Column Scan (Preferred)
        const points = scanColumns(segmentationMap, maskWidth, maskHeight, targetClasses);

        // 4. Fallback: Bounding Box
        let finalPoints = points;
        if (points.length < 3) {
            console.log("Column scan failed, falling back to Bounding Box");
            finalPoints = [
                { x: minX, y: minY },
                { x: maxX, y: minY },
                { x: maxX, y: maxY },
                { x: minX, y: maxY }
            ];
        }

        // 5. Scale back to original
        const scaleX = width / maskWidth;
        const scaleY = height / maskHeight;

        return finalPoints.map(p => ({ x: p.x * scaleX, y: p.y * scaleY }));

    } catch (err) {
        console.error("AI Detection failed:", err);
        return [];
    }
};

function scanColumns(map: any, width: number, height: number, classes: number[]): Point[] {
    const numColumns = 40;
    const colStep = Math.floor(width / numColumns);
    const topPoints: Point[] = [];
    const bottomPoints: Point[] = [];

    for (let c = 0; c <= numColumns; c++) {
        const x = Math.min(c * colStep, width - 1);
        let longestSegment = { start: -1, end: -1, length: 0 };
        let currentStart = -1;

        for (let y = 0; y < height; y++) {
            const idx = y * width + x;
            if (classes.includes(map[idx])) {
                if (currentStart === -1) currentStart = y;
            } else {
                if (currentStart !== -1) {
                    const len = y - currentStart;
                    if (len > longestSegment.length) longestSegment = { start: currentStart, end: y, length: len };
                    currentStart = -1;
                }
            }
        }
        if (currentStart !== -1) {
            const len = height - currentStart;
            if (len > longestSegment.length) longestSegment = { start: currentStart, end: height, length: len };
        }

        // Relaxed threshold: > 2% of height
        if (longestSegment.length > height * 0.02) {
            topPoints.push({ x: x, y: longestSegment.start });
            bottomPoints.unshift({ x: x, y: longestSegment.end });
        }
    }
    return [...topPoints, ...bottomPoints];
}
