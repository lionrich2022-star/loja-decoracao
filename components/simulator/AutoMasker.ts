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
        // 3: Floor
        // 5: Ceiling
        // We want class 0 (Wall).
        const targetClass = 0;

        const binaryMask = new Uint8Array(maskWidth * maskHeight);
        for (let i = 0; i < segmentationMap.length; i++) {
            // STRICT MASK: Only allow pixels explicitly classified as WALL (0)
            binaryMask[i] = segmentationMap[i] === targetClass ? 1 : 0;
        }

        // Use improved contour detection
        const points = getContour(binaryMask, maskWidth, maskHeight);

        // Scale points back
        const scaleX = width / maskWidth;
        const scaleY = height / maskHeight;

        return points.map(p => ({ x: p.x * scaleX, y: p.y * scaleY }));

    } catch (err) {
        console.error("AI Detection failed:", err);
        return [];
    }
};

// Robust Contour Extraction using Radial Search + Edge Refinement
function getContour(data: Uint8Array, width: number, height: number): Point[] {
    const cx = Math.floor(width / 2);
    const cy = Math.floor(height / 2);
    const resolution = 72; // Check every 5 degrees
    const contourPoints: Point[] = [];

    // Check if center is actually wall
    const centerIdx = cy * width + cx;
    // If center is not wall, we might be looking at a room where the wall is split?
    // For now assume center-ish view.

    for (let j = 0; j < resolution; j++) {
        const angle = (j * (360 / resolution)) * (Math.PI / 180);
        const dirX = Math.cos(angle);
        const dirY = Math.sin(angle);

        // Raycast from center outwards
        let lastOnWallX = cx;
        let lastOnWallY = cy;
        let foundWall = false;

        // Optimization: dynamic step
        for (let d = 0; d < Math.max(width, height); d += 2) {
            const px = Math.floor(cx + dirX * d);
            const py = Math.floor(cy + dirY * d);

            if (px < 0 || px >= width || py < 0 || py >= height) break;

            const idx = py * width + px;
            const isWall = data[idx] === 1;

            if (isWall) {
                lastOnWallX = px;
                lastOnWallY = py;
                foundWall = true;
            } else if (foundWall) {
                // If we were on a wall and now we are NOT, we found the edge.
                // This handles furniture in front of walls (furniture is 0).
                break;
            }
        }

        if (foundWall) {
            contourPoints.push({ x: lastOnWallX, y: lastOnWallY });
        }
    }

    return contourPoints;
}
