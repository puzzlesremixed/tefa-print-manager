import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { queue } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import { PrintJob } from '@/types/data';
import { Head, usePage } from '@inertiajs/react';

// const {}= usePage;
const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Queue',
    href: queue().url,
  },
  {
    title: 'Details',
    href: "",
  },
];

interface QueueProps {
  detail: PrintJob;
}
export default function PrintJobDetails({detail}:QueueProps) {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Details" />
      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        <h1 className='text-xl'>{detail.customer_name}</h1>
        <span className='text-md text-gray-400'>{detail.customer_number}</span>
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
            <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
          </div>
          <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
            <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
          </div>
          <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
            <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
          </div>
        </div>
        <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
          <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
        </div>
      </div>
    </AppLayout>
  );
}
