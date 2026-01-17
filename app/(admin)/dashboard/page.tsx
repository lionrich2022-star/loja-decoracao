// Dashboard Page - Admin Panel
export default function AdminDashboard() {
    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-6">Painel Administrativo</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="border p-6 rounded shadow-sm">
                    <h2 className="text-xl font-semibold mb-2">Papéis de Parede</h2>
                    <p>Gerencie o catálogo de produtos.</p>
                    <a href="/papeis" className="text-blue-600 hover:underline mt-2 block">Acessar</a>
                </div>
                <div className="border p-6 rounded shadow-sm">
                    <h2 className="text-xl font-semibold mb-2">Orçamentos</h2>
                    <p>Visualize e gerencie solicitações.</p>
                    <a href="/orcamentos" className="text-blue-600 hover:underline mt-2 block">Acessar</a>
                </div>
                <div className="border p-6 rounded shadow-sm">
                    <h2 className="text-xl font-semibold mb-2">Configurações</h2>
                    <p>Ajustes do sistema.</p>
                </div>
            </div>
        </div>
    );
}
