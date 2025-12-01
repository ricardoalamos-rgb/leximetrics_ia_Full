import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context';

export function handleJarvisCommand(text: string, router: AppRouterInstance): string {
    const t = text.toLowerCase();

    if (t.includes('docworks')) {
        router.push('/dashboard/docworks');
        return 'Abriendo DocWorks…';
    }

    if (t.includes('remate') || t.includes('remates')) {
        router.push('/dashboard/remates');
        return 'Mostrando remates…';
    }

    if (t.includes('dashboard') || t.includes('inicio') || t.includes('home')) {
        router.push('/dashboard');
        return 'Volviendo al panel principal…';
    }

    if (t.includes('causa') && t.match(/\d/)) {
        return 'Por ahora, la navegación directa a una causa por voz no está implementada.';
    }

    return 'No entendí el comando. Intenta de nuevo indicando a dónde ir (DocWorks, remates, dashboard).';
}
