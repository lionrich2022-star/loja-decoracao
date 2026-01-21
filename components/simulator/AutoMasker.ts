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

    // Check if browser environment supports 32-bit indices for large tensors if needed
    // But we are resizing to 512, so it's fine.
    await tf.ready();

    // Attempt to load model with retry
    try {
        console.log('Loading DeepLab ADE20k model...');
        model = await deeplab.load({
            base: modelName,
            quantizationBytes: quantizationBytes
        });
        return model;
    } catch (e) {
        console.error("Failed to load AutoMasker Model", e);
        return null; // Model failed
    }
};

export const detectWallPoints = async (imageElement: HTMLImageElement, width: number, height: number): Promise<Point[]> => {
    try {
        const loadedModel = await loadAutoMaskerModel();
        if (!loadedModel) throw new Error("Model failed to load");

        // 1. Safe Resize (512px) - Proven to help stability
        const size = 512;
        const resizeCanvas = document.createElement('canvas');
        resizeCanvas.width = size;
        resizeCanvas.height = size;
        const ctx = resizeCanvas.getContext('2d');
        if (!ctx) return [];
        ctx.drawImage(imageElement, 0, 0, size, size);

        // 2. Segment
        const segmentation = await loadedModel.segment(resizeCanvas);
        const { width: maskWidth, height: maskHeight, segmentationMap } = segmentation;

        // ADE20k Classes: 0=Wall, 1=Building (structure).
        const targetClasses = [0, 1];

        // 3. Find Centroid & Mass
        let sumX = 0, sumY = 0, count = 0;
        const binaryMap = new Uint8Array(maskWidth * maskHeight);

        for (let i = 0; i < segmentationMap.length; i++) {
            if (targetClasses.includes(segmentationMap[i])) {
                binaryMap[i] = 1;
                // Accumulate for centroid
                const x = i % maskWidth;
                const y = Math.floor(i / maskWidth);
                sumX += x;
                sumY += y;
                count++;
            } else {
                binaryMap[i] = 0;
            }
        }

        // If very few pixels (< 0.5%), detection probably failed or no wall visible
        if (count < (maskWidth * maskHeight * 0.005)) {
            console.warn("AI found almost no wall pixels.");
            return []; // Return empty to prompt manual, or use a box? Empty is safer.
        }

        // 4. Determine Seal Point (Hub)
        let hubX = Math.floor(sumX / count);
        let hubY = Math.floor(sumY / count);

        // Verify Hub is actually ON a wall pixel. If not, spiral out to find nearest wall pixel.
        // This handles cases where the wall is a "U" shape and centroid is in the empty middle.
        const hubIdx = hubY * maskWidth + hubX;
        if (binaryMap[hubIdx] === 0) {
            // Spiral search
            let found = false;
            const maxRadius = Math.min(maskWidth, maskHeight) / 2;
            for (let r = 1; r < maxRadius; r += 2) {
                // Check circle at radius r (simplified to 8 points or ring?)
                // Just scan a box ring for simplicity
                for (let dx = -r; dx <= r; dx++) {
                    for (let dy = -r; dy <= r; dy++) {
                        // Only check perimeter
                        if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;

                        const nx = hubX + dx;
                        const ny = hubY + dy;
                        if (nx >= 0 && nx < maskWidth && ny >= 0 && ny < maskHeight) {
                            if (binaryMap[ny * maskWidth + nx] === 1) {
                                hubX = nx;
                                hubY = ny;
                                found = true;
                                break;
                            }
                        }
                    }
                    if (found) break;
                }
                if (found) break;
            }
        }

        // 5. Raycast Hub & Spoke
        const points = getHubSpokeContour(binaryMap, maskWidth, maskHeight, hubX, hubY);

        // 6. Smoothing / Simplifying (Simple outlier removal could go here)

        // 7. Scale Back
        const scaleX = width / maskWidth;
        const scaleY = height / maskHeight;

        return points.map(p => ({ x: p.x * scaleX, y: p.y * scaleY }));

    } catch (err) {
        console.error("AI Estimation Error:", err);
        return [];
    }
};

function getHubSpokeContour(map: Uint8Array, width: number, height: number, cx: number, cy: number): Point[] {
    const resolution = 72; // 360 / 5 degree steps
    const contour: Point[] = [];

    for (let i = 0; i < resolution; i++) {
        const theta = (i * (360 / resolution)) * (Math.PI / 180);
        const dx = Math.cos(theta);
        const dy = Math.sin(theta);

        let edgeX = cx;
        let edgeY = cy;
        let foundBoundary = false;

        // Ray march
        const maxDist = Math.max(width, height); // Covering diagonals

        // We assume we START on a wall (hub). We look for when we EXIT the wall.
        for (let r = 0; r < maxDist; r += 1) { // Step 1 for precision
            const px = Math.floor(cx + dx * r);
            const py = Math.floor(cy + dy * r);

            // Check bounds
            if (px < 0 || px >= width || py < 0 || py >= height) {
                edgeX = Math.max(0, Math.min(width - 1, px)); // Clamp to image edge
                edgeY = Math.max(0, Math.min(height - 1, py));
                foundBoundary = true;
                break;
            }

            if (map[py * width + px] === 0) {
                // Hit non-wall (furniture, floor, etc.)
                edgeX = px - dx; // Backtrack slightly? or just take previous
                edgeY = py - dy;
                foundBoundary = true;
                break;
            }

            edgeX = px;
            edgeY = py;
        }

        contour.push({ x: edgeX, y: edgeY });
    }

    return contour;
}
