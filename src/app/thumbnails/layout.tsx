import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'VERSION Thumbnails — Creador de Miniaturas IA',
    description: 'Diseño de miniaturas virales con análisis de CTR por IA y herramientas de edición profesionales.',
    openGraph: {
        title: 'VERSION Thumbnails — Creador de Miniaturas IA',
        description: 'Diseño de miniaturas virales con análisis de CTR por IA y herramientas de edición profesionales.',
    }
};

export default function ThumbnailsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
