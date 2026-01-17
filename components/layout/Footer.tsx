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
                        className="text-xs text-gray-500 hover:text-gold-400 transition-colors flex items-center justify-center md:justify-end gap-1"
                    >
                        Desenvolvido por <span className="font-semibold text-gray-400 hover:text-white transition-colors">Kryon Systems</span>
                    </a>
                </div>
            </div>
        </footer>
    );
}
