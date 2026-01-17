// Dashboard Page - Admin Panel
export default function AdminDashboard() {
    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-6 text-gray-900">Painel Administrativo</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="border p-6 rounded shadow-sm bg-white">
                    <h2 className="text-xl font-semibold mb-2 text-gray-800">Papéis de Parede</h2>
                    <p className="text-gray-600">Gerencie o catálogo de produtos.</p>
                    <a href="/admin/papeis" className="text-blue-600 hover:underline mt-2 block">Acessar</a>
                </div>
                <div className="border p-6 rounded shadow-sm bg-white">
                    <h2 className="text-xl font-semibold mb-2 text-gray-800">Orçamentos</h2>
                    <p className="text-gray-600">Visualize e gerencie solicitações.</p>
                    <a href="/admin/orcamentos" className="text-blue-600 hover:underline mt-2 block">Acessar</a>
                </div>
                <div className="border p-6 rounded shadow-sm bg-white">
                    <h2 className="text-xl font-semibold mb-2 text-gray-800">Configurações</h2>
                    <p className="text-gray-600">Ajustes do sistema.</p>
                </div>
            </div>
        </div>
    );
}
