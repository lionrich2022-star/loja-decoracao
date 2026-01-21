import * as tf from '@tensorflow/tfjs';
import * as deeplab from '@tensorflow-models/deeplab';

const modelName = 'ade20k';
const quantizationBytes = 2;

let model: deeplab.SemanticSegmentation | null = null;

export interface Point {
    x: number;
    y: number;
}

export const loadAutoMaskerModel = async () => {
    if (model) return model;
    await tf.ready();
    console.log('Loading DeepLab ADE20k model...');
    model = await deeplab.load({
        base: modelName,
        quantizationBytes: quantizationBytes
    });
    return model;
};

export const detectWallPoints = async (imageElement: HTMLImageElement, width: number, height: number): Promise<Point[]> => {
    try {
        const loadedModel = await loadAutoMaskerModel();
        if (!loadedModel) throw new Error("Model failed to load");

        // Segment
        const segmentation = await loadedModel.segment(imageElement);
        const { height: maskHeight, width: maskWidth, segmentationMap } = segmentation;

        // ADE20k: 0=Wall, 1=Building. 
        const targetClasses = [0, 1];

        // 1. Column Scan Algorithm
        // We scan vertical columns (strips) across the image.
        // For each column, we find the "Main Wall Segment" (longest continuous run of wall pixels).
        // This effectively traces the "Ceiling Line" (top of segment) and "Floor/Furniture Line" (bottom of segment).

        const numColumns = 40; // Resolution: 40 points across width
        const colStep = Math.floor(maskWidth / numColumns);

        const topPoints: Point[] = [];
        const bottomPoints: Point[] = [];

        for (let c = 0; c <= numColumns; c++) {
            const x = Math.min(c * colStep, maskWidth - 1);

            // Scan this column y: 0 -> height
            // Find continuous segments of '1' (Wall)
            let longestSegment = { start: -1, end: -1, length: 0 };
            let currentStart = -1;

            for (let y = 0; y < maskHeight; y++) {
                const idx = y * maskWidth + x;
                const isWall = targetClasses.includes(segmentationMap[idx]);

                if (isWall) {
                    if (currentStart === -1) currentStart = y;
                } else {
                    if (currentStart !== -1) {
                        // Segment ended
                        const len = y - currentStart;
                        if (len > longestSegment.length) {
                            longestSegment = { start: currentStart, end: y, length: len };
                        }
                        currentStart = -1;
                    }
                }
            }
            // Check last segment
            if (currentStart !== -1) {
                const len = maskHeight - currentStart;
                if (len > longestSegment.length) {
                    longestSegment = { start: currentStart, end: maskHeight, length: len };
                }
            }

            // Threshold: If segment is too small (e.g. < 5% of height), ignore (noise)
            if (longestSegment.length > maskHeight * 0.05) {
                // Add points
                topPoints.push({ x: x, y: longestSegment.start });
                bottomPoints.unshift({ x: x, y: longestSegment.end }); // Add to beginning to reverse order for polygon
            }
        }

        if (topPoints.length < 3) {
            console.warn("No clear wall found.");
            return [];
        }

        // 2. Build Polygon
        // Top points L->R, then Bottom points R->L
        let points = [...topPoints, ...bottomPoints];

        // 3. Simplify / Smooth (Optional)
        // For now, the resolution (40 cols) acts as smoothing.

        // 4. Scale to output
        const scaleX = width / maskWidth;
        const scaleY = height / maskHeight;

        return points.map(p => ({ x: p.x * scaleX, y: p.y * scaleY }));

    } catch (err) {
        console.error("AI Detection failed:", err);
        return [];
    }
};
