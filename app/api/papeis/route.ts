import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({ message: 'Listagem de papéis de parede' });
}

export async function POST(request: Request) {
    return NextResponse.json({ message: 'Novo papel de parede criado' }, { status: 201 });
}
