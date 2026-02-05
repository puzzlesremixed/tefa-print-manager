import { DataTable } from '@/components/data-table';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { cancelPrintJob, simulatePayment } from '@/routes/apiPrintJobs';
import { Printer, PrintJob } from '@/types/data';
import { router, usePoll } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { HandCoins, Plus } from 'lucide-react';

interface QueueProps {
  allFiles: PrintJob[];
  waitingPaymentFiles: PrintJob[];
  printer: Printer;
}

const censorNumber = (num: string) => {
  if (num.length < 5) return num;
  const lastThree = num.slice(-4);
  return `08 . . . ${lastThree}`;
};

function CancelCell({ id }: { id: number }) {
  return (
    <Button
      className="cursor-pointer"
      variant={'secondary'}
      onClick={() => router.visit(cancelPrintJob(id.toString()))}
    >
      <Plus className="rotate-45" />
    </Button>
  );
}

function SimulatePaymentCell({ id }: { id: number }) {
  return (
    <Button
      className="cursor-pointer"
      variant={'secondary'}
      onClick={() => router.visit(simulatePayment(id.toString()))}
    >
      <HandCoins className="rotate-45" />
    </Button>
  );
}

const Columns: ColumnDef<PrintJob>[] = [
  {
    accessorKey: 'customer_name',
    header: 'Pelanggan',
    cell: ({ row }) => (
      <div className="group flex flex-col">
        <span className="text-xs font-black text-slate-800 dark:text-gray-300">
          {row.original.customer_name}
        </span>
        <span className="mt-0.5 text-[10px] font-bold tracking-tight text-indigo-500">
          {censorNumber(row.original.customer_number)}
        </span>
      </div>
    ),
  },
  {
    id: 'files',
    header: 'Dokumen',
    cell: ({ row }) => {
      const details = row.original.details;

      if (!details || details.length === 0) {
        return <span className="text-gray-400 italic">No files</span>;
      }

      const firstFile = details[0].asset.basename;
      const remainingCount = details.length - 1;

      return (
        <div className="group flex flex-col">
          <div className="my-1.5 flex items-center gap-2">
            <span
              className="max-w-35 truncate text-[11px] font-bold text-slate-700 dark:text-white"
              title={firstFile}
            >
              {firstFile}
            </span>
            {remainingCount > 0 && (
              <span className="py-0.2 inline-flex items-center justify-center rounded-full border border-slate-400 px-2 text-xs font-medium text-slate-400">
                +{remainingCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="border-black-100 flex items-center gap-2 rounded-full border px-3 py-1.5">
              <span className="text-[9px] leading-none font-black tracking-widest uppercase">
                Hitam 2
              </span>
            </div>
            <div className="border-black-100 flex items-center gap-2 rounded-full border px-3 py-1.5">
              <span className="text-[9px] leading-none font-black text-blue tracking-widest uppercase">
                Warna 2
              </span>
            </div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      return <StatusBadge status={row.original.status} />;

      //   <span className="font-medium">{row.original.status}</span>
    },
  },
];

export default function home({ allFiles }: QueueProps) {
usePoll(2000);
  return (
    <div className="flex h-screen overflow-hidden select-none">
      <section className="relative hidden w-1/2 overflow-hidden border-r border-slate-200 xl:flex">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src="/videos/bg.mp4" type="video/mp4" />
        </video>
      </section>
      <section className="relative flex flex-1 flex-col overflow-hidden dark:text-white">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 px-8 backdrop-blur-md">
          <h2 className="bg text-xs font-black tracking-widest text-slate-800 uppercase dark:text-white">
            Antrian Cetak
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-full border border-green-100 px-3 py-1.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full"></span>
              <span className="text-[9px] leading-none font-black tracking-widest text-green-700 uppercase dark:text-lime-400">
                {/* Printer ({QueueProps.printer.status}) */} Printer Ready
              </span>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="space-y-6">
            {/* Queue Section */}
            <DataTable
              columns={Columns}
              data={allFiles}
              headerStyle="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
