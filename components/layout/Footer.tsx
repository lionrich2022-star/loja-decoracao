import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="bg-gray-900 text-white py-8 border-t border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-center md:text-left">
                    <span className="font-serif text-lg font-bold text-gold-400">Decora Design</span>
                    <p className="text-gray-400 text-sm mt-1">Transformando ambientes com elegância.</p>
                </div>

                <div className="text-center md:text-right">
                    <p className="text-gray-500 text-xs mb-1">
                        &copy; {new Date().getFullYear()} Decora Design. Todos os direitos reservados.
                    </p>

                    <a
                        href="https://www.kryonsystems.com.br/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center md:items-end gap-2 group mt-3"
                    >
                        <span className="text-[10px] text-gray-600 group-hover:text-gold-500 transition-colors uppercase tracking-widest">Desenvolvido por</span>
                        <img src="/kryon-logo.png" alt="Kryon Systems" className="h-8 w-auto object-contain opacity-70 group-hover:opacity-100 transition-opacity" />
                    </a>
                </div>
            </div>
        </footer >
    );
}
