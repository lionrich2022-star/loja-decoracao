import { NextResponse } from 'next/server';

export async function GET() {
    // Simulating AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return NextResponse.json({
        // For Test Page (Simplified)
        points: [
            140, 70,
            760, 70,
            800, 410,
            120, 410,
        ],
        // For Main Simulator (Robust)
        walls: [
            {
                id: 'wall-auto-api-1',
                name: 'Parede Detectada (IA)',
                points: [
                    { x: 140, y: 70 },
                    { x: 760, y: 70 },
                    { x: 800, y: 410 },
                    { x: 120, y: 410 }
                ]
            }
        ]
    });
}
