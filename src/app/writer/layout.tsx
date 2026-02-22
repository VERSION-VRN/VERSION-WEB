import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'VERSION Writer — Generador de Guiones IA',
    description: 'Crea guiones virales para YouTube con estructura de retención y análisis semántico avanzado.',
    openGraph: {
        title: 'VERSION Writer — Generador de Guiones IA',
        description: 'Crea guiones virales para YouTube con estructura de retención y análisis semántico avanzado.',
    }
};

export default function WriterLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
