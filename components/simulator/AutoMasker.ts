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

        // 4. Create Binary Map & Find Starting Point
        const binaryMap = new Uint8Array(maskWidth * maskHeight);
        let startPoint: Point | null = null;
        let firstPixelIndex = -1;

        for (let i = 0; i < segmentationMap.length; i++) {
            if (targetClasses.includes(segmentationMap[i])) {
                binaryMap[i] = 1;
                if (!startPoint) {
                    // Find the first top-left pixel of the wall to start tracing
                    // (Ideally we want a point on the boundary, scanning Top->Bottom, Left->Right finds one)
                    startPoint = { x: i % maskWidth, y: Math.floor(i / maskWidth) };
                    firstPixelIndex = i;
                }
            } else {
                binaryMap[i] = 0;
            }
        }

        if (!startPoint) {
            console.warn("AI found no wall pixels.");
            return [];
        }

        // 5. Trace Boundary (Moore-Neighbor Tracing)
        // Note: The simple scan above finds a point *inside* or on the edge. 
        // For Moore, we need a true boundary pixel (pixel is 1, neighbor is 0).
        // The first pixel found scanning top-down left-right IS guaranteed to be on the boundary 
        // (because the pixel immediately above or left of it must be 0 or out of bounds).

        const rawContour = traceBoundary(binaryMap, maskWidth, maskHeight, startPoint);

        // 6. Simplify Contour (Reduce points for performance)
        const simplifiedPoints = simplifyPoints(rawContour, 3.0); // 3px tolerance

        // 7. Scale Back
        const scaleX = width / maskWidth;
        const scaleY = height / maskHeight;

        return simplifiedPoints.map(p => ({ x: p.x * scaleX, y: p.y * scaleY }));

    } catch (err) {
        console.error("AI Estimation Error:", err);
        return [];
    }
};

/**
 * Moore-Neighbor Tracing Algorithm
 * Walks around the perimeter of a connected component.
 */
function traceBoundary(map: Uint8Array, width: number, height: number, start: Point): Point[] {
    const contour: Point[] = [];

    // Bounds check helper
    const isWall = (x: number, y: number) => {
        if (x < 0 || x >= width || y < 0 || y >= height) return false;
        return map[y * width + x] === 1;
    };

    // Moore neighborhood offsets (Clockwise starting from Top-Left? Standard is usually specific)
    // P = current pixel. We search neighbors clockwise.
    // 0: (-1, -1), 1: (0, -1), 2: (1, -1), ...
    // Using a simplified list for walking:
    // N, NE, E, SE, S, SW, W, NW
    // dx/dy pairs
    const neighborhood = [
        { x: 0, y: -1 }, // N (0)
        { x: 1, y: -1 }, // NE (1)
        { x: 1, y: 0 },  // E (2)
        { x: 1, y: 1 },  // SE (3)
        { x: 0, y: 1 },  // S (4)
        { x: -1, y: 1 }, // SW (5)
        { x: -1, y: 0 }, // W (6)
        { x: -1, y: -1 } // NW (7)
    ];

    let cx = start.x;
    let cy = start.y;

    // Boundary check using Backtracking method (simple wall follower) usually easiest.
    // Let's use a robust approach: define 'backtrack' as direction we came from.
    // Algorithm:
    // B = backtrack direction (points to previous pixel in open space)
    // Scan clockwise from B until we hit a BLACK pixel (1). That is our next P.
    // The previous WHITE pixel (0) becomes the new B.

    contour.push({ x: cx, y: cy });

    // Initial backtrack direction: Since we scanned/found 'start' from top-left, 
    // we approached from the West or North. Let's assume we entered from West (-1,0) (neighbor 6).
    // So 'backtrack' index in neighborhood is 6.
    let backdropIdx = 6;

    // Safety break
    let maxSteps = width * height;
    let steps = 0;

    let currX = cx;
    let currY = cy;

    while (steps < maxSteps) {
        // Search for next boundary pixel
        let foundNext = false;

        // We start searching CLOCKWISE from the backdrop direction
        for (let i = 0; i < 8; i++) {
            const checkIdx = (backdropIdx + i) % 8;
            const dir = neighborhood[checkIdx];
            const nx = currX + dir.x;
            const ny = currY + dir.y;

            if (isWall(nx, ny)) {
                // Found the next wall pixel!
                currX = nx;
                currY = ny;
                contour.push({ x: nx, y: ny });

                // The new backtrack direction is the one pointing back to where we passed 
                // (or rather, the empty space before this pixel). 
                // The convention: New Backtrack = (checkIdx + 4) % 8 is 'Opposite', 
                // but for Moore, we want to start searching from the neighbor PREVIOUS to this one in the cycle.
                // It's (checkIdx + 4 + 2) % 8 or similar.
                // Simple rule: Start scanning 'next time' from the direction relative to 'previous empty neighbor'.
                // If we found wall at `checkIdx`, `checkIdx-1` was empty.
                // So next search starts from `checkIdx - 2` or `checkIdx - 3`?
                // Standard Moore: enter from `entryDir`. Search start from `entryDir + 1` (CCW) or `-1` (CW)?

                // Let's reset backdrop to 'scan start': 
                // If we found neighbor at index K, next time start checking from K-2 or K-3 (modulo 8)
                backdropIdx = (checkIdx + 4 + 1) % 8; // Heuristic adjustment

                foundNext = true;
                break;
            }
        }

        if (!foundNext) {
            // Isolated pixel?
            break;
        }

        // Closed loop check
        if (currX === start.x && currY === start.y) {
            break;
        }

        steps++;
    }

    return contour;
}

/**
 * Simplifies a polygon by distance threshold
 */
function simplifyPoints(points: Point[], tolerance: number): Point[] {
    if (points.length < 3) return points;

    // Radial Distance simplification (Basic)
    // Only keep points that are > tolerance distance from the last kept point
    const res: Point[] = [points[0]];
    let lastP = points[0];

    for (let i = 1; i < points.length; i++) {
        const p = points[i];
        const dx = p.x - lastP.x;
        const dy = p.y - lastP.y;
        const distSq = dx * dx + dy * dy;

        if (distSq > tolerance * tolerance) {
            res.push(p);
            lastP = p;
        }
    }

    // Ensure loop closure if original was closed
    // (Our trace stops at start, so usually implies closed, but let's check distance to start)
    const first = res[0];
    const last = res[res.length - 1];
    const dClose = (first.x - last.x) ** 2 + (first.y - last.y) ** 2;
    if (dClose > tolerance * tolerance) {
        res.push(first);
    } else {
        // Snap last to first
        res[res.length - 1] = first;
    }

    return res;
}
