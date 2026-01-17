'use client';

import { Scroll, FileText, TrendingUp, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
    const [visitCount, setVisitCount] = useState(0);

    useEffect(() => {
        const fetchVisits = async () => {
            const { count } = await supabase
                .from('page_views')
                .select('*', { count: 'exact', head: true });
            if (count !== null) setVisitCount(count);
        };
        fetchVisits();
    }, []);
    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-serif text-gray-900 dark:text-white font-bold">Visão Geral</h1>
                <p className="text-gray-500 dark:text-gray-400">Bem-vindo ao painel administrativo da Decora Design.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatsCard
                    title="Total de Papéis"
                    value="24"
                    icon={Scroll}
                    trend="+2 novos"
                    color="blue"
                />
                <StatsCard
                    title="Orçamentos (Hoje)"
                    value="3"
                    icon={FileText}
                    trend="Aguardando"
                    color="gold"
                />
                <StatsCard
                    title="Visitas (Simulador)"
                    value={visitCount.toString()}
                    icon={Users}
                    trend="Total"
                    color="green"
                />
                <StatsCard
                    title="Conversão"
                    value="4.5%"
                    icon={TrendingUp}
                    trend="Estável"
                    color="purple"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <h2 className="font-serif text-lg font-bold mb-4 text-gray-900 dark:text-white">Atalhos Rápidos</h2>
                    <div className="space-y-3">
                        <LinkType href="/admin/papeis" title="Gerenciar Catálogo" desc="Adicionar ou editar papéis de parede." />
                        <LinkType href="/admin/orcamentos" title="Ver Orçamentos" desc="Acompanhar solicitações de clientes." />
                        <LinkType href="/simulador" title="Testar Simulador" desc="Abrir o simulador em nova aba." external />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-xl text-white">
                    <h2 className="font-serif text-lg font-bold mb-2 text-gold-400">Dica do Lojista</h2>
                    <p className="text-gray-300 text-sm mb-4">
                        Mantenha seu catálogo atualizado com fotos de alta qualidade para aumentar a taxa de conversão no simulador.
                    </p>
                    <button className="text-xs bg-gold-500/20 text-gold-300 px-3 py-1 rounded border border-gold-500/30">
                        Ver Guia de Fotos
                    </button>
                </div>
            </div>
        </div>
    );
}

function StatsCard({ title, value, icon: Icon, trend, color }: any) {
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-lg bg-${color}-50 dark:bg-${color}-900/20 text-${color}-600 dark:text-${color}-400`}>
                    <Icon size={20} />
                </div>
                <span className="text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">
                    {trend}
                </span>
            </div>
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">{title}</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        </div>
    );
}

function LinkType({ href, title, desc, external }: any) {
    return (
        <a
            href={href}
            target={external ? '_blank' : undefined}
            className="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
        >
            <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-gold-400 transition-colors">{title}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">{desc}</p>
            </div>
            <span className="text-gray-400 group-hover:translate-x-1 transition-transform">→</span>
        </a>
    )
}
