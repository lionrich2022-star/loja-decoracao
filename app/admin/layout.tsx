'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { LogOut } from 'lucide-react';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        // Se estiver na página de login, não precisa verificar
        if (pathname === '/admin/login') {
            setAuthorized(true);
            setLoading(false);
            return;
        }

        checkUser();
    }, [pathname]);

    async function checkUser() {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            router.push('/admin/login');
        } else {
            setAuthorized(true);
        }
        setLoading(false);
    }

    async function handleLogout() {
        await supabase.auth.signOut();
        router.push('/admin/login');
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // Se for página de login, renderiza "puro" (sem header)
    if (pathname === '/admin/login') {
        return <>{children}</>;
    }

    // Para as outras páginas, mostra o layout do Dashboard com Header
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {authorized && (
                <header className="bg-white border-b shadow-sm sticky top-0 z-10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <a href="/" className="font-bold text-xl text-blue-600 flex items-center gap-2">
                                Loja Decor <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Admin</span>
                            </a>
                            <nav className="hidden md:flex gap-4 text-sm font-medium text-gray-600">
                                <a href="/admin/dashboard" className="hover:text-blue-600 transition-colors">Dashboard</a>
                                <a href="/admin/papeis" className="hover:text-blue-600 transition-colors">Papéis</a>
                                <a href="/admin/orcamentos" className="hover:text-blue-600 transition-colors">Orçamentos</a>
                            </nav>
                        </div>

                        <div className="flex items-center gap-4">
                            <a href="/simulador" target="_blank" className="text-sm text-gray-500 hover:text-blue-600 hidden sm:block">
                                Ver Site/Simulador ↗
                            </a>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 text-sm text-red-600 hover:bg-red-50 px-3 py-2 rounded transition-colors"
                            >
                                <LogOut size={16} />
                                <span className="hidden sm:inline">Sair</span>
                            </button>
                        </div>
                    </div>
                </header>
            )}

            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
        </div>
    );
}
