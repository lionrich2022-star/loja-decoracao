'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Scroll, FileText, Settings, LogOut } from 'lucide-react';

interface AdminSidebarProps {
    onLogout: () => void;
}

export default function AdminSidebar({ onLogout }: AdminSidebarProps) {
    const pathname = usePathname();

    const menuItems = [
        { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
        { label: 'Papéis de Parede', href: '/admin/papeis', icon: Scroll },
        { label: 'Orçamentos', href: '/admin/orcamentos', icon: FileText },
        // { label: 'Configurações', href: '/admin/settings', icon: Settings }, // Future
    ];

    return (
        <aside className="w-64 bg-gray-900 text-white flex flex-col min-h-screen border-r border-gray-800">
            <div className="h-16 flex items-center px-6 border-b border-gray-800">
                <span className="font-serif text-xl font-bold text-gold-400">Decora Admin</span>
            </div>

            <nav className="flex-1 py-6 px-3 space-y-1">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`
                                flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium
                                ${isActive
                                    ? 'bg-gold-500/10 text-gold-400 border border-gold-500/20'
                                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                                }
                            `}
                        >
                            <Icon size={18} />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-gray-800">
                <button
                    onClick={onLogout}
                    className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg w-full transition-colors"
                >
                    <LogOut size={18} />
                    Sair
                </button>
            </div>
        </aside>
    );
}
