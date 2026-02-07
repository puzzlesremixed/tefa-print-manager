import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { logs as logsRoute } from '@/routes';
import { detail } from '@/routes/logs';
import type { BreadcrumbItem } from '@/types';
import { ApiRequestLog, LaravelPagination } from '@/types/data';
import { Head, Link, usePoll } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/data-table';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Logs',
    href: logsRoute().url,
  },
];

//  <TableHead>Method</TableHead>
//                 <TableHead>Path</TableHead>
//                 <TableHead>Status</TableHead>
//                 <TableHead>Duration</TableHead>
//                 <TableHead>Time</TableHead>


export const apiLogColumns: ColumnDef<ApiRequestLog>[] = [
  {
    accessorKey: 'properties.method',
    header: 'Method',
    cell: ({ row }) => (
      <Badge variant="outline">{row.original.properties.method}</Badge>
    ),
  },
  {
    accessorKey: 'properties.path',
    header: 'Path',
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.properties.path}</span>
    ),
  },
  {
    accessorKey: 'properties.status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.properties.status;

      return (
        <Badge variant={status >= 400 ? 'destructive' : 'secondary'}>
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'properties.duration',
    header: 'Duration',
    cell: ({ row }) => <span>{row.original.properties.duration} ms</span>,
  },
  {
    accessorKey: 'created_at',
    header: 'Time',
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">
        {new Date(row.original.created_at).toLocaleString()}
      </span>
    ),
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <Button asChild size="sm" variant="ghost">
        <Link href={detail(row.original.id)}>View</Link>
      </Button>
    ),
  },
];

export default function ApiLogIndex({
  logs,
}: {
  logs: LaravelPagination<ApiRequestLog>;
}) {
  usePoll(2000);
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={'Logs'} />
      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        <div className="space-y-4">
          <h1 className="text-xl">API Request Logs</h1>

          <DataTable
            columns={apiLogColumns}
            data={logs.data}
          />

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Page {logs.current_page} of {logs.last_page}
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={logs.current_page === 1}
                asChild
              >
                <Link href={`?page=${logs.current_page - 1}`}>Previous</Link>
              </Button>

              <Button
                size="sm"
                variant="outline"
                disabled={logs.current_page === logs.last_page}
                asChild
              >
                <Link href={`?page=${logs.current_page + 1}`}>Next</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
