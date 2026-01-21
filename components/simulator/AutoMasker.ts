import * as tf from '@tensorflow/tfjs';
import * as deeplab from '@tensorflow-models/deeplab';

const modelName = 'ade20k'; // Switch to ADE20k for interior scenes
const quantizationBytes = 2;

let model: deeplab.SemanticSegmentation | null = null;

export interface Point {
    x: number;
    y: number;
}

export const loadAutoMaskerModel = async () => {
    if (model) return model;

    // Ensure tf is ready
    await tf.ready();

    console.log('Loading DeepLab ADE20k model...');
    model = await deeplab.load({
        base: modelName,
        quantizationBytes: quantizationBytes
    });
    console.log('DeepLab model loaded.');
    return model;
};

export const detectWallPoints = async (imageElement: HTMLImageElement, width: number, height: number): Promise<Point[]> => {
    try {
        const loadedModel = await loadAutoMaskerModel();
        if (!loadedModel) throw new Error("Model failed to load");

        const segmentation = await loadedModel.segment(imageElement);
        const { height: maskHeight, width: maskWidth, segmentationMap } = segmentation;

        // ADE20k Classes of interest:
        // 0: Wall
        // 1: Building (sometimes used for outdoor walls, but usually 0 is indoor wall)
        // We include both to be safe.
        const targetClasses = [0, 1];

        const binaryMask = new Uint8Array(maskWidth * maskHeight);
        let sumX = 0;
        let sumY = 0;
        let count = 0;

        for (let i = 0; i < segmentationMap.length; i++) {
            if (targetClasses.includes(segmentationMap[i])) {
                binaryMask[i] = 1;
                // Accumulate for centroid
                const x = i % maskWidth;
                const y = Math.floor(i / maskWidth);
                sumX += x;
                sumY += y;
                count++;
            } else {
                binaryMask[i] = 0;
            }
        }

        if (count === 0) {
            console.warn("No wall pixels found by AI.");
            return [];
        }

        // Calculate Centroid of the wall mass
        // This is much safer than "image center" because the wall might be offset or behind logic.
        const centroidX = Math.floor(sumX / count);
        const centroidY = Math.floor(sumY / count);

        // Use Centroid-based Raycast + Wall Crawl
        const points = getContour(binaryMask, maskWidth, maskHeight, centroidX, centroidY);

        // Scale points back
        const scaleX = width / maskWidth;
        const scaleY = height / maskHeight;

        return points.map(p => ({ x: p.x * scaleX, y: p.y * scaleY }));

    } catch (err) {
        console.error("AI Detection failed:", err);
        return [];
    }
};

// Robust Contour Extraction using Radial Search from calculated Centroid
function getContour(data: Uint8Array, width: number, height: number, cx: number, cy: number): Point[] {
    const resolution = 72; // Check every 5 degrees for detail
    const contourPoints: Point[] = [];

    // Safety check
    if (cx < 0 || cx >= width) cx = width / 2;
    if (cy < 0 || cy >= height) cy = height / 2;

    for (let j = 0; j < resolution; j++) {
        const angle = (j * (360 / resolution)) * (Math.PI / 180);
        const dirX = Math.cos(angle);
        const dirY = Math.sin(angle);

        // Raycast from CENTROID outwards
        let lastOnWallX = cx;
        let lastOnWallY = cy;
        let foundWallStart = false;

        // Check if centroid itself is on wall
        const centerIdx = Math.floor(cy) * width + Math.floor(cx);
        if (data[centerIdx] === 1) {
            foundWallStart = true;
        }

        const maxDist = Math.max(width, height);

        // Walk the ray
        for (let d = 0; d < maxDist; d += 2) {
            const px = Math.floor(cx + dirX * d);
            const py = Math.floor(cy + dirY * d);

            if (px < 0 || px >= width || py < 0 || py >= height) break;

            const idx = py * width + px;
            const isWall = data[idx] === 1;

            if (isWall) {
                lastOnWallX = px;
                lastOnWallY = py;
                foundWallStart = true;
            } else {
                // Not wall (furniture, floor, ceiling)
                if (foundWallStart) {
                    // We WERE on wall, now we are NOT. This is the boundary.
                    break;
                }
                // If we haven't found wall yet, keep walking (maybe centroid is in a hole?)
            }
        }

        if (foundWallStart) {
            contourPoints.push({ x: lastOnWallX, y: lastOnWallY });
        }
    }

    return contourPoints;
}
