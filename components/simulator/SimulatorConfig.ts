export const SIMULATOR_CONFIG = {
    // Basic Features
    enableV1: true,        // Manual Selection

    // Advanced Features (SaaS Tiers)
    enableV2: true,        // AI Auto-Detect (Single Wall)
    enableMultiWall: true, // V3: Multiple Walls Support
    enableBrush: false,    // V4: Fine-tuning (Coming Soon)
    enableBeforeAfter: true, // V5: Slider & Export (Partial)
    enableBudget: true,    // V6: Calculator

    // UI Config
    defaultOpacity: 0.85,
    defaultScale: 0.5,
    showDebug: false
};

export type WallData = {
    id: string;
    rect: { x: number; y: number; width: number; height: number };
    paperUrl?: string | null; // Allow different papers per wall in future
    name?: string;
};
