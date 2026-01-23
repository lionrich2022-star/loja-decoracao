
import { WallData } from './SimulatorConfig';

export interface RoomPreset {
    id: string;
    label: string;
    imageUrl: string;
    category: 'sala' | 'quarto' | 'escritorio' | 'copa' | 'cozinha' | 'infantil' | 'sala_tv' | 'varanda';
    walls: WallData[];
}

export const ROOM_PRESETS: RoomPreset[] = [
    // --- SALA ---
    {
        id: 'room-sala-moderna',
        label: 'Sala de Estar Moderna',
        category: 'sala',
        imageUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=2000&auto=format&fit=crop',
        walls: [
            {
                id: 'pres-1-wall-1',
                name: 'Parede Fundo',
                points: [{ x: 0, y: 0 }, { x: 1300, y: 0 }, { x: 1300, y: 750 }, { x: 0, y: 750 }],
                brushStrokes: []
            }
        ]
    },

    // --- COPA / JANTAR ---
    {
        id: 'room-copa-jantar',
        label: 'Sala de Jantar Elegante',
        category: 'copa',
        imageUrl: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?q=80&w=2000&auto=format&fit=crop',
        walls: [
            {
                id: 'pres-copa-1',
                name: 'Parede Lateral',
                points: [{ x: 200, y: 100 }, { x: 1800, y: 100 }, { x: 1800, y: 900 }, { x: 200, y: 900 }],
                brushStrokes: []
            }
        ]
    },

    // --- QUARTO ---
    {
        id: 'room-quarto-luxo',
        label: 'Quarto Luxuoso',
        category: 'quarto',
        imageUrl: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=2000&auto=format&fit=crop',
        walls: [
            {
                id: 'pres-2-wall-1',
                name: 'Cabeceira',
                points: [{ x: 280, y: 200 }, { x: 1720, y: 200 }, { x: 1720, y: 850 }, { x: 280, y: 850 }],
                brushStrokes: []
            }
        ]
    },

    // --- ESCRITÓRIOS (3 Modelos) ---
    {
        id: 'room-escritorio-executivo',
        label: 'Escritório Executivo',
        category: 'escritorio',
        imageUrl: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=2000&auto=format&fit=crop',
        walls: [
            {
                id: 'pres-off-1',
                name: 'Parede Principal',
                points: [{ x: 100, y: 100 }, { x: 1900, y: 100 }, { x: 1900, y: 800 }, { x: 100, y: 800 }],
                brushStrokes: []
            }
        ]
    },
    {
        id: 'room-escritorio-home',
        label: 'Home Office Clean',
        category: 'escritorio',
        imageUrl: 'https://images.unsplash.com/photo-1593642532400-2682810df593?q=80&w=2000&auto=format&fit=crop',
        walls: [
            {
                id: 'pres-off-2',
                name: 'Fundo',
                points: [{ x: 400, y: 0 }, { x: 1600, y: 0 }, { x: 1600, y: 600 }, { x: 400, y: 600 }],
                brushStrokes: []
            }
        ]
    },
    {
        id: 'room-escritorio-criativo',
        label: 'Workspace Criativo',
        category: 'escritorio',
        imageUrl: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?q=80&w=2000&auto=format&fit=crop',
        walls: [
            {
                id: 'pres-off-3',
                name: 'Parede Lateral',
                points: [{ x: 0, y: 0 }, { x: 1000, y: 0 }, { x: 1000, y: 1000 }, { x: 0, y: 1000 }],
                brushStrokes: []
            }
        ]
    },

    // --- SALA DE TV ---
    {
        id: 'room-sala-tv',
        label: 'Sala de TV / Home Theater',
        category: 'sala_tv',
        imageUrl: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?q=80&w=2000&auto=format&fit=crop',
        walls: [
            {
                id: 'pres-tv-1',
                name: 'Parede Painel',
                points: [{ x: 200, y: 100 }, { x: 1800, y: 100 }, { x: 1800, y: 800 }, { x: 200, y: 800 }],
                brushStrokes: []
            }
        ]
    },

    // --- VARANDA ---
    {
        id: 'room-varanda',
        label: 'Varanda Gourmet',
        category: 'varanda',
        imageUrl: 'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?q=80&w=2000&auto=format&fit=crop',
        walls: [
            {
                id: 'pres-var-1',
                name: 'Parede Externa',
                points: [{ x: 500, y: 100 }, { x: 1500, y: 100 }, { x: 1500, y: 900 }, { x: 500, y: 900 }],
                brushStrokes: []
            }
        ]
    },

    // --- INFANTIL ---
    {
        id: 'room-infantil-ludico',
        label: 'Quarto Infantil Lúdico',
        category: 'infantil',
        imageUrl: 'https://images.unsplash.com/photo-1519643381401-22c77e60520e?q=80&w=2000&auto=format&fit=crop',
        walls: [
            {
                id: 'pres-4-wall-1',
                name: 'Parede Principal',
                points: [{ x: 130, y: 130 }, { x: 1870, y: 130 }, { x: 1870, y: 900 }, { x: 130, y: 900 }],
                brushStrokes: []
            }
        ]
    },
    {
        id: 'room-infantil-bebe',
        label: 'Quarto Bebê Clean',
        category: 'infantil',
        imageUrl: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?q=80&w=2000&auto=format&fit=crop',
        walls: [
            {
                id: 'pres-inf-2-w1',
                name: 'Parede Berço',
                points: [{ x: 300, y: 150 }, { x: 1700, y: 150 }, { x: 1700, y: 900 }, { x: 300, y: 900 }],
                brushStrokes: []
            }
        ]
    },

    // --- SALA EXTRA ---
    {
        id: 'room-sala-minimalista',
        label: 'Sala Minimalista',
        category: 'sala',
        imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=2000&auto=format&fit=crop',
        walls: [
            {
                id: 'pres-sala-2-w1',
                name: 'Parede Central',
                points: [{ x: 400, y: 200 }, { x: 1600, y: 200 }, { x: 1600, y: 800 }, { x: 400, y: 800 }],
                brushStrokes: []
            }
        ]
    }
];
