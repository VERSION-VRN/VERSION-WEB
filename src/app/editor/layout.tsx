import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'VERSION Editor — Creador de Videos IA',
    description: 'Generación de guion, voz y edición de video automatizada en segundos usando IA de grado industrial.',
    openGraph: {
        title: 'VERSION Editor — Creador de Videos IA',
        description: 'Generación de guion, voz y edición de video automatizada en segundos usando IA de grado industrial.',
    }
};

export default function EditorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
