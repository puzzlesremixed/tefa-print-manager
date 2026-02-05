import type { ColumnDef } from "@tanstack/react-table";
import type { PrintJob } from "./data";
import { Link } from "@inertiajs/react";
import {detail} from "@/routes/printJob";

export const homePrintJobColumns: ColumnDef<PrintJob>[] = [
  {
    accessorKey: 'customer_name',
    header: 'Pelanggan',
    cell: ({ row }) => (
      <Link className="flex flex-col group" href={detail(row.original.id.toString())} prefetch>
        <span className="font-medium group-hover:underline">{row.original.customer_name}</span>
        <span className="text-xs text-muted-foreground">
          {row.original.customer_number}
        </span>
      </Link>
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
        <div className="flex items-center gap-2">
          <span className="max-w-50 truncate" title={firstFile}>
            {firstFile}
          </span>
          {remainingCount > 0 && (
            <span className="inline-flex items-center justify-center rounded-full border border-slate-400 px-2 py-0.5 text-xs font-medium text-slate-400">
              +{remainingCount}
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Price',
    cell: ({ row }) => (
      <span className="font-medium">{row.original.total_price}</span>
    )
  },
//   {
//     accessorKey: 'created_at',
//     header: 'Time',
//     cell: ({ row }) =>
//       new Date(row.original.created_at).toLocaleTimeString([], {
//         hour: '2-digit',
//         minute: '2-digit',
//       }),
//   },
];
