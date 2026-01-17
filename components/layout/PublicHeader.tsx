'use client';

import ThemeToggle from '../ui/ThemeToggle';
import Link from 'next/link';

export default function PublicHeader() {
    return (
        <header className="bg-white dark:bg-gray-900 border-b dark:border-gray-800 sticky top-0 z-50 transition-colors">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="font-bold text-xl text-blue-900 dark:text-gold-400 font-serif">
                    Decora Design
                </Link>
                <nav className="hidden md:flex gap-6 text-sm text-gray-600 dark:text-gray-300">
                    <Link href="/simulador" className="hover:text-blue-600 dark:hover:text-gold-400 transition-colors">Simulador</Link>
                    <Link href="#" className="hover:text-blue-600 dark:hover:text-gold-400 transition-colors">Catálogo</Link>
                    <Link href="#" className="hover:text-blue-600 dark:hover:text-gold-400 transition-colors">Sobre</Link>
                </nav>
                <div className="flex items-center gap-4">
                    <ThemeToggle />
                    <Link
                        href="/admin/login"
                        className="text-sm border px-3 py-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors border-gray-200 dark:border-gray-700"
                    >
                        Área do Lojista
                    </Link>
                </div>
            </div>
        </header>
    );
}
