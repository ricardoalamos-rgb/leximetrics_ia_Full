'use client';

import React from 'react';

type Props = {
    children: React.ReactNode;
};

type State = {
    hasError: boolean;
};

export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(): State {
        return { hasError: true };
    }

    componentDidCatch(error: any, info: any) {
        // Aquí puedes integrar con Sentry si quieres
        console.error('ErrorBoundary atrapó un error', error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-6 text-center">
                    <h2 className="text-lg font-semibold mb-2">Algo salió mal</h2>
                    <p className="text-sm text-gray-500">
                        Hemos encontrado un error inesperado. Intenta recargar la página.
                    </p>
                </div>
            );
        }
        return this.props.children;
    }
}
