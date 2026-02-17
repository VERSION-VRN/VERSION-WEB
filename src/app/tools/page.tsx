
import Link from "next/link";

export default function ToolsPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6">
                Herramientas de <span className="text-red-500">Alta Potencia</span>
            </h1>
            <p className="text-gray-400 max-w-2xl text-lg mb-12">
                Accede a la suite de utilidades exclusivas de VERSION para maximizar tu alcance viral.
            </p>

            <div className="grid md:grid-cols-2 gap-6 w-full max-w-4xl">
                <Link
                    href="/tools/script-generator"
                    className="group relative bg-[#111] border border-white/10 p-8 rounded-2xl hover:border-red-500/50 transition-all duration-300 hover:bg-[#151515]"
                >
                    <div className="absolute top-4 right-4 text-xs font-bold bg-red-500/10 text-red-500 px-2 py-1 rounded-full border border-red-500/20">
                        POPULAR
                    </div>
                    <h2 className="text-2xl font-bold mb-2 group-hover:text-red-500 transition-colors">Guionista AI 2.0</h2>
                    <p className="text-gray-400 text-sm leading-relaxed">
                        Genera guiones profundos y estructurados con la metodología de retención de VERSION.
                        Soporta modo "Mega" para videos largos.
                    </p>
                </Link>

                <Link
                    href="/tools/seo-assistant"
                    className="group bg-[#111] border border-white/10 p-8 rounded-2xl hover:border-green-500/50 transition-all duration-300 hover:bg-[#151515]"
                >
                    <h2 className="text-2xl font-bold mb-2 group-hover:text-green-500 transition-colors">SEO Viral</h2>
                    <p className="text-gray-400 text-sm leading-relaxed">
                        Optimiza títulos, etiquetas y descripciones para dominar el algoritmo de búsqueda.
                    </p>
                </Link>
            </div>
        </div>
    );
}
