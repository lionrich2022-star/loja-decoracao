import Link from 'next/link';

export default function PublicHeader() {
    return (
        <header className="bg-white border-b sticky top-0 z-50">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="font-bold text-xl text-blue-900">
                    Loja Decor
                </Link>
                <nav className="hidden md:flex gap-6 text-sm text-gray-600">
                    <Link href="/simulador" className="hover:text-blue-600">Simulador</Link>
                    <Link href="#" className="hover:text-blue-600">Catálogo</Link>
                    <Link href="#" className="hover:text-blue-600">Sobre</Link>
                </nav>
                <Link
                    href="/admin/login"
                    className="text-sm border px-3 py-1.5 rounded hover:bg-gray-50 text-gray-600"
                >
                    Área do Lojista
                </Link>
            </div>
        </header>
    );
}
