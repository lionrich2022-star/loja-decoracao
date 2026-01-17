'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { LogOut } from 'lucide-react';
import AdminSidebar from '@/components/admin/AdminSidebar';

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

    // Se for página de login, renderiza "puro" (sem sidebar)
    if (pathname === '/admin/login') {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
            {/* Sidebar (Desktop) */}
            <div className="hidden md:block fixed inset-y-0 left-0 z-20">
                <AdminSidebar onLogout={handleLogout} />
            </div>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 p-8 overflow-y-auto h-screen">
                {/* Mobile Header (Simplified) */}
                <div className="md:hidden mb-6 flex justify-between items-center">
                    <span className="font-serif font-bold text-gray-900 dark:text-white">Loja Decor</span>
                    <button onClick={handleLogout} className="text-red-500"><LogOut size={20} /></button>
                </div>

                {children}
            </main>
        </div>
    );
}

