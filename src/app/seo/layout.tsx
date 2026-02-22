import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'VERSION SEO — Dominio de Algoritmos',
    description: 'Optimización de palabras clave, etiquetas y descripciones para dominar las búsquedas en YouTube.',
    openGraph: {
        title: 'VERSION SEO — Dominio de Algoritmos',
        description: 'Optimización de palabras clave, etiquetas y descripciones para dominar las búsquedas en YouTube.',
    }
};

export default function SeoLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
