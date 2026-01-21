
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
                    { x: 0, y: 0 },
                    { x: 1300, y: 0 },
                    { x: 1300, y: 750 },
                    { x: 0, y: 750 }
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
                    { x: 280, y: 200 },
                    { x: 1720, y: 200 },
                    { x: 1720, y: 850 },
                    { x: 280, y: 850 }
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
                    { x: 220, y: 150 },
                    { x: 950, y: 280 },
                    { x: 950, y: 850 },
                    { x: 220, y: 920 }
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
                    { x: 130, y: 130 },
                    { x: 1870, y: 130 },
                    { x: 1870, y: 900 },
                    { x: 130, y: 900 }
                ],
                brushStrokes: []
            }
        ]
    }
];
