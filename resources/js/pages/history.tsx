import { DataTable } from '@/components/data-table';
import { StatusBadge } from '@/components/StatusBadge';
import AppLayout from '@/layouts/app-layout';
import { history } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import { basePrintJobColumns } from '@/types/column';
import { PrintJob } from '@/types/data';
import { Head } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'History',
    href: history().url,
  },
];

const columns: ColumnDef<PrintJob>[] = [
  ...basePrintJobColumns,
  {
    accessorKey: 'status',
      header: 'Status',
    cell: ({ row }) => {
      return (
        <StatusBadge status={row.original.status }/>
      );
    },
  },
  {
    accessorKey: 'actions',
    header: 'Actions',
  },
];

interface historyProps {
  pastFiles: PrintJob[];
}

export default function History({ pastFiles }: historyProps) {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="History" />
      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        <DataTable columns={columns} data={pastFiles} />
      </div>
    </AppLayout>
  );
}
