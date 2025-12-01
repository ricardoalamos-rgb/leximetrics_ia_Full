import dynamic from 'next/dynamic';
import React from 'react';
import { CardSkeleton } from '../../../components/ui/CardSkeleton';

const DocWorksView = dynamic(
    () => import('../../../components/docworks/DocWorksView'),
    {
        loading: () => (
            <div className="p-6 space-y-4">
                <CardSkeleton />
                <CardSkeleton />
            </div>
        ),
        ssr: false,
    },
);

export default function DocWorksPage() {
    return <DocWorksView />;
}
