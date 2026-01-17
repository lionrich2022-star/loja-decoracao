import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({ message: 'Listagem de orçamentos' });
}

export async function POST(request: Request) {
    return NextResponse.json({ message: 'Orçamento criado' }, { status: 201 });
}
