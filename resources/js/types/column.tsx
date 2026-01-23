import type { ColumnDef } from "@tanstack/react-table";
import type { PrintJob } from "./data";

export const basePrintJobColumns: ColumnDef<PrintJob>[] = [
  {
    accessorKey: 'customer_name',
    header: 'Customer',
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.original.customer_name}</span>
        <span className="text-xs text-muted-foreground">
          {row.original.customer_number}
        </span>
      </div>
    ),
  },
  {
    id: 'files',
    header: 'Files',
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
    accessorKey: 'total_price',
    header: 'Price',
    cell: ({ row }) => {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
      }).format(row.original.total_price);
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Time',
    cell: ({ row }) =>
      new Date(row.original.created_at).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
  },
];
