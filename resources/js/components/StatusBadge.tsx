import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { PrintStatus } from '@/types/data';



const statusConfig: Record<
  PrintStatus,
  { label: string; className: string }
> = {
  pending_payment: {
    label: 'Menunggu Pembayaran',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  },
  request_edit: {
    label: 'Request Edit',
    className: 'bg-pink-100 text-pink-800 border-pink-300',
  },
  pending: {
    label: 'Proses',
    className: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  queued: {
    label: 'Dalam Antrian',
    className: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  },
  running: {
    label: 'Sedang Berjalan',
    className: 'bg-purple-100 text-purple-800 border-purple-300',
  },
  completed: {
    label: 'Selesai',
    className: 'bg-green-100 text-green-800 border-green-300',
  },
  partially_failed: {
    label: 'Partially Failed',
    className: 'bg-orange-100 text-orange-800 border-orange-300',
  },
  failed: {
    label: 'Gagal',
    className: 'bg-red-100 text-red-800 border-red-300',
  },
  cancelled: {
    label: 'Dibatalkan',
    className: 'bg-gray-100 text-gray-700 border-gray-300',
  },
}

export function StatusBadge({ status }: { status: PrintStatus }) {
  const config = statusConfig[status]

  if (!config) return null

  return (
    <Badge
      variant="secondary"
      className={cn('capitalize border', config.className)}
    >
      {config.label}
    </Badge>
  )
}
