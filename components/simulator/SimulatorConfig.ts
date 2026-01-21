export const SIMULATOR_CONFIG = {
    // Basic Features
    enableV1: true,        // Manual Selection (Polygon)

    // Advanced Features (SaaS Tiers)
    enableV2: true,        // AI Auto-Detect (Single/Multi Wall)
    enableMultiWall: true, // V3: Multiple Walls Support
    enableBrush: true,     // V4: Fine-tuning Brush
    enableBeforeAfter: false, // V5: Disabled by user request
    enableBudget: true,    // V6: Calculator

    // UI Config
    defaultOpacity: 0.90, // Tweak for realism (was 0.85)
    defaultScale: 0.5,
    showDebug: false
};

export type WallData = {
    id: string;
    name: string;
    points: { x: number; y: number }[]; // Polygon points for this wall
    paperId?: string | null;            // Specific paper for this wall
    paperUrl?: string | null;           // URL for rendering
    opacity?: number;
    scale?: number;
    brushStrokes?: {
        id: string;
        points: number[];
        tool: 'add' | 'remove';
        size: number;
    }[];
};
