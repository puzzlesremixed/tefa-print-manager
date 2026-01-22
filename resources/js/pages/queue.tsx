import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { queue } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Queue',
        href: queue().url,
    },
];

export default function Queue() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Queue" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <h1>Queue</h1>
                
            </div>
        </AppLayout>
    );
}
