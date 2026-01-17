import Link from 'next/link';
import { ArrowRight, Star, Sparkles, LayoutTemplate } from 'lucide-react';

export default function Home() {
    return (
        <div className="min-h-screen flex flex-col">
            {/* Header / Nav */}
            <header className="py-6 px-8 flex justify-between items-center max-w-7xl mx-auto w-full">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full border border-gold-400 flex items-center justify-center text-gold-700 font-serif font-bold text-xl bg-gold-50">
                        D
                    </div>
                    <span className="font-serif text-2xl tracking-wide font-bold text-gray-800">
                        DECORA <span className="text-gold-600 font-light">DESIGN</span>
                    </span>
                </div>
                <nav className="gap-8 hidden md:flex text-sm uppercase tracking-widest font-medium text-gray-500">
                    <Link href="/simulador" className="hover:text-gold-700 transition-colors">Simulador</Link>
                    <Link href="#" className="hover:text-gold-700 transition-colors">Papéis</Link>
                    <Link href="#" className="hover:text-gold-700 transition-colors">Projetos</Link>
                    <Link href="/dashboard" className="hover:text-gold-700 transition-colors">Lojista</Link>
                </nav>
            </header>

            {/* Hero Section */}
            <main className="flex-1">
                <section className="relative h-[85vh] flex items-center justify-center overflow-hidden bg-cream-100">
                    {/* Background Decorative Elements */}
                    <div className="absolute top-0 right-0 w-[50vw] h-full bg-[#f0eadd] opacity-40 rounded-l-[100px] -z-10 translate-x-20"></div>

                    <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-8 animate-in slide-in-from-left duration-1000">
                            <span className="inline-block py-1 px-3 border border-gold-300 rounded-full text-xs font-bold tracking-[0.2em] text-gold-800 uppercase bg-gold-50">
                                Interiores & Decoração
                            </span>

                            <h1 className="text-5xl md:text-7xl font-serif text-gray-900 leading-[1.1]">
                                Transforme seu ambiente <span className="italic text-gold-600">sem reforma</span>.
                            </h1>

                            <p className="text-lg text-gray-600 leading-relaxed max-w-lg font-light">
                                Visualize como ficará sua parede antes de comprar.
                                Tecnologia exclusiva Decora Design para você testar papéis, texturas e cores em segundos.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                <Link
                                    href="/simulador"
                                    className="group bg-gray-900 text-white px-8 py-4 rounded-full flex items-center justify-center gap-3 hover:bg-gold-600 transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1"
                                >
                                    <Sparkles size={18} className="text-gold-300" />
                                    <span className="font-medium tracking-wide">TESTAR SIMULADOR</span>
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </Link>
                                <Link
                                    href="#"
                                    className="px-8 py-4 rounded-full border border-gray-300 text-gray-600 hover:border-gold-500 hover:text-gold-700 transition-colors flex items-center justify-center"
                                >
                                    Ver Catálogo
                                </Link>
                            </div>
                        </div>

                        {/* Visual do Simulador (Mockup) */}
                        <div className="relative animate-in slide-in-from-right duration-1000 delay-200 hidden md:block">
                            <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/50">
                                <img
                                    src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=2532&auto=format&fit=crop"
                                    alt="Ambiente Decorado"
                                    className="w-full h-[600px] object-cover"
                                />
                                {/* Overlay Card */}
                                <div className="absolute bottom-8 left-8 bg-white/90 backdrop-blur-md p-6 rounded-xl shadow-lg max-w-xs border border-white">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-gold-100 rounded-full text-gold-700">
                                            <LayoutTemplate size={20} />
                                        </div>
                                        <div className="text-sm font-bold text-gray-800 uppercase tracking-wider">Simulação Real</div>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        Veja exatamente como o papel "Linho Dourado" ficaria na sua sala de jantar.
                                    </p>
                                </div>
                            </div>
                            {/* Decorative Circle */}
                            <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-gold-200 rounded-full blur-3xl opacity-30 -z-10"></div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-24 bg-white">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                            <FeatureCard
                                icon={<Star className="text-gold-500" />}
                                title="Curadoria Premium"
                                description="Selecionamos os papéis das melhores marcas mundiais para sua casa."
                            />
                            <FeatureCard
                                icon={<LayoutTemplate className="text-gold-500" />}
                                title="Visualize Antes"
                                description="Não imagine, veja. Nossa tecnologia aplica o papel na sua foto real."
                            />
                            <FeatureCard
                                icon={<Sparkles className="text-gold-500" />}
                                title="Instalação Rápida"
                                description="Equipe especializada para transformar seu ambiente em poucas horas."
                            />
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <div className="flex flex-col items-center text-center p-6 space-y-4 hover:bg-cream-50 rounded-2xl transition-colors duration-300">
            <div className="w-16 h-16 bg-cream-100 rounded-full flex items-center justify-center mb-2">
                {icon}
            </div>
            <h3 className="text-xl font-serif font-bold text-gray-800">{title}</h3>
            <p className="text-gray-500 leading-relaxed font-light">{description}</p>
        </div>
    );
}
