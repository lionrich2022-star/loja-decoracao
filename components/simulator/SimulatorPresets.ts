
import { WallData } from './SimulatorConfig';

export interface RoomPreset {
    id: string;
    label: string;
    imageUrl: string;
    category: 'sala' | 'quarto' | 'escritorio' | 'cozinha' | 'infantil';
    walls: WallData[];
}

export const ROOM_PRESETS: RoomPreset[] = [
    {
        id: 'room-sala-moderna',
        label: 'Sala de Estar Moderna',
        category: 'sala',
        imageUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=2000&auto=format&fit=crop',
        walls: [
            {
                id: 'pres-1-wall-1',
                name: 'Parede Fundo',
                points: [
                    { x: 350, y: 150 }, // Approximation based on image structure
                    { x: 1650, y: 150 },
                    { x: 1650, y: 850 },
                    { x: 350, y: 850 }
                ],
                brushStrokes: []
            }
        ]
    },
    {
        id: 'room-quarto-luxo',
        label: 'Quarto Luxuoso',
        category: 'quarto',
        imageUrl: 'https://images.unsplash.com/photo-1616594039964-40891a90b3a9?q=80&w=2000&auto=format&fit=crop',
        walls: [
            {
                id: 'pres-2-wall-1',
                name: 'Cabeceira',
                points: [
                    { x: 200, y: 100 },
                    { x: 1800, y: 100 },
                    { x: 1800, y: 900 },
                    { x: 200, y: 900 }
                ],
                brushStrokes: []
            }
        ]
    },
    {
        id: 'room-escritorio-clean',
        label: 'Home Office Clean',
        category: 'escritorio',
        imageUrl: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=2000&auto=format&fit=crop',
        walls: [
            {
                id: 'pres-3-wall-1',
                name: 'Parede Lateral',
                points: [
                    { x: 100, y: 100 },
                    { x: 800, y: 200 }, // Perspective left-ish
                    { x: 800, y: 900 },
                    { x: 100, y: 1000 }
                ],
                brushStrokes: []
            }
        ]
    },
    {
        id: 'room-infantil-ludico',
        label: 'Quarto Infantil Lúdico',
        category: 'infantil',
        imageUrl: 'https://images.unsplash.com/photo-1519643381401-22c77e60520e?q=80&w=2000&auto=format&fit=crop',
        walls: [
            {
                id: 'pres-4-wall-1',
                name: 'Parede Principal',
                points: [
                    { x: 150, y: 150 },
                    { x: 1850, y: 150 },
                    { x: 1850, y: 950 },
                    { x: 150, y: 950 }
                ],
                brushStrokes: []
            }
        ]
    }
];
