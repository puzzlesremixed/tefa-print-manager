import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { basePrintJobColumns } from '@/types/column';
import { PrintJob } from '@/types/data';
import { Head, router, usePage, usePoll } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { HandCoins, Plus, Square, Triangle } from 'lucide-react';

interface QueueProps {
  queuedFiles: PrintJob[];
  pendingFiles: PrintJob[];
  waitingPaymentFiles: PrintJob[];
}

const queueColumns: ColumnDef<PrintJob>[] = [
  ...basePrintJobColumns,
  {
    accessorKey: 'actions',
    header: 'Actions',
  },
];

const pendingColumns: ColumnDef<PrintJob>[] = [
  ...basePrintJobColumns,
  {
    accessorKey: 'actions',
    header: 'Actions',

    cell: ({ row }) => {
      return (
        <div className="flex gap-2">
          <Button
            className=""
            variant={'secondary'}
            onClick={() => cancelPrintJob(row.original.id)}
          >
            <Plus className="rotate-45" />
          </Button>
        </div>
      );
    },
  },
];

const unpaidColumns: ColumnDef<PrintJob>[] = [
  ...basePrintJobColumns,
  {
    accessorKey: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      return (
        <div className="flex gap-2">
          <Button
            className=""
            variant={'secondary'}
            onClick={() => simulatePayment(row.original.id)}
          >
            <HandCoins className="" />
          </Button>

          <Button
            className=""
            variant={'secondary'}
            onClick={() => cancelPrintJob(row.original.id)}
          >
            <Plus className="rotate-45" />
          </Button>
        </div>
      );
    },
  },
];

const breadcrumbs = [{ title: 'Queue', href: '/queue' }];

function simulatePayment(printJobId: number): void {
  router.post(
    `/api/print-job/${printJobId}/pay`,
    {},
    {
      preserveState: true,
      preserveScroll: true,
    },
  );
}

function cancelPrintJob(printJobId: number): void {
  router.post(
    `/api/print-job/${printJobId}/cancel`,
    {},
    {
      preserveState: true,
      preserveScroll: true,
    },
  );
}

export default function Queue({
  queuedFiles,
  pendingFiles,
  waitingPaymentFiles,
}: QueueProps) {
  const { flash } = usePage();
  usePoll(2000)
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Queue" />
      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        <div className="flex items-end justify-between">
          <>
            {flash.toast && <div className="toast">{flash.toast.message}</div>}
          </>

          <h1 className="text-xl">Curently Running Print Job</h1>
          <div>
            <Button className="mr-2 bg-green-700 text-white">
              <Triangle className="rotate-90" />
              Run
            </Button>
            <Button className="" variant={'secondary'}>
              <Square className="" />
              Stop
            </Button>
          </div>
        </div>
        <Card>
          <CardContent>
            <p className="italic">There's no currently running print job.</p>
          </CardContent>
        </Card>
        <Tabs defaultValue="queued" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="queued">
              Queued ({queuedFiles.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({pendingFiles.length})
            </TabsTrigger>
            <TabsTrigger value="payment">
              Unpaid ({waitingPaymentFiles.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="queued">
            <div className="rounded-md border">
              <DataTable columns={queueColumns} data={queuedFiles} />
            </div>
          </TabsContent>

          <TabsContent value="pending">
            <div className="rounded-md border">
              <DataTable columns={pendingColumns} data={pendingFiles} />
            </div>
          </TabsContent>

          <TabsContent value="payment">
            <div className="rounded-md border">
              <DataTable columns={unpaidColumns} data={waitingPaymentFiles} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
