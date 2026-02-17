import { simulatePayment } from '@/actions/App/Http/Controllers/PrintJobController';
import { FileUploadDialog } from '@/components/FileUploadDialog';
import { SimulateChangeContainer } from '@/components/SimulateChange';
import { StatusBadge } from '@/components/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { queue } from '@/routes';
import assets from '@/routes/assets';

import printJob, { cancelPrintJob } from '@/routes/printJob';
import type { BreadcrumbItem } from '@/types';
import type { PrintJob, PrintJobDetail } from '@/types/data';
import { Head, router } from '@inertiajs/react';
import {
  AlertCircle,
  ArrowDownToLine,
  ArrowUpToLine,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  EllipsisVertical,
  FilePen,
  FileText,
  HandCoins,
  History,
  ListStart,
  ListTodo,
  Plus,
  Printer,
  SquareArrowOutUpRightIcon,
} from 'lucide-react';
import { Fragment, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Queue',
    href: queue().url,
  },
  {
    title: 'Details',
    href: '',
  },
];

interface QueueProps {
  detail: PrintJob;
}

export default function PrintJobDetails({ detail }: QueueProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PrintJobDetail | null>(null);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Details" />
      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        {/* Header Section */}
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {detail.customer_name}
              <span className="text-muted-foreground">
                {' '}
                / +{detail.customer_number}
                <a
                  href={`https://wa.me/${detail.customer_number}`}
                  className="group ml-2"
                  target="_blank"
                >
                  <SquareArrowOutUpRightIcon className="inline-block p-1 group-hover:text-white" />
                </a>
              </span>
            </h1>
            <p className="text-muted-foreground">Job ID: {detail.id}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              variant={detail.paid_at ? 'default' : 'outline'}
              className="px-3 py-1"
            >
              {detail.paid_at ? (
                <CheckCircle2 className="mr-1 h-3 w-3" />
              ) : (
                <Clock className="mr-1 h-3 w-3" />
              )}
              {detail.paid_at ? 'Paid' : 'Unpaid'}
            </Badge>
            <StatusBadge status={detail.status} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost">
                  <EllipsisVertical />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {detail.status == 'pending_payment' ? (
                  <Fragment>
                    <SimulateChangeContainer type="context" printJob={detail} />
                    <DropdownMenuItem
                      onClick={() =>
                        router.visit(simulatePayment(detail.id.toString()), {
                          preserveState: true,
                        })
                      }
                    >
                      <HandCoins className="h-4 w-4" />
                      Mark as paid
                    </DropdownMenuItem>
                  </Fragment>
                ) : (
                  <DropdownMenuItem>
                    <ListStart className="h-4 w-4" />
                    Move to queue
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() =>
                    router.visit(cancelPrintJob(detail.id.toString()), {
                      preserveState: true,
                    })
                  }
                >
                  <Plus className="h-4 w-4 rotate-45" />
                  Cancel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Price</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                Rp {detail.total_price.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Files Count</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {detail.details.length} Items
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Paper</CardTitle>
              <Printer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {detail.total_pages} Pages
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Created At</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-md font-medium">
                {new Date(detail.created_at).toLocaleDateString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date(detail.created_at).toLocaleTimeString()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="files" className="w-full">
          <TabsList className="grid w-full max-w-[400px] grid-cols-2">
            <TabsTrigger value="files">Print Items</TabsTrigger>
            <TabsTrigger value="logs">Activity Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="files" className="mt-4">
            <div className="mb-4">
              <CardTitle>Job Details</CardTitle>
              <CardDescription>
                Configure and review individual file settings.
              </CardDescription>
            </div>
            <Card className="p-0">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset ID / File</TableHead>
                      <TableHead>Extension</TableHead>
                      <TableHead>Copies</TableHead>
                      <TableHead>Color</TableHead>
                      <TableHead>Pages</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detail.details.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell
                          className={cn(
                            'overflow-hidden font-medium text-ellipsis',
                            item.modified_asset && 'flex w-full flex-col',
                          )}
                        >
                          {item.modified_asset ? (
                            <>
                              <span className="">
                                {item.modified_asset.filename}
                              </span>
                              <Badge>Modified</Badge>
                            </>
                          ) : (
                            <span className="">{item.asset.filename}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.modified_asset ? (
                            <span className="">
                              .{item.modified_asset.extension}
                            </span>
                          ) : (
                            <span className="">.{item.asset.extension}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">
                            {item.copies}x
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">
                            {item.print_color}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {item.pages_to_print || 'All'}
                            <div className="text-xs text-muted-foreground">
                              {item.paper_count ?? 0} total sheets
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>Rp {item.price.toLocaleString()}</TableCell>
                        <TableCell>
                          <StatusBadge status={item.status} />
                        </TableCell>
                        <TableCell>
                          <>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost">
                                  <EllipsisVertical />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem
                                  onSelect={() => {
                                    setSelectedItem(item);
                                    setDialogOpen(true);
                                  }}
                                  disabled={item.status !== 'request_edit'}
                                >
                                  <ArrowUpToLine className="mr-2 h-4 w-4" />{' '}
                                  Upload file
                                </DropdownMenuItem>

                                {item.modified_asset && (
                                  <DropdownMenuItem asChild>
                                    <a
                                      href={
                                        assets.download({
                                          asset:
                                            item.modified_asset.id.toString(),
                                        }).url
                                      }
                                    >
                                      <FilePen className="mr-2 h-4 w-4" />{' '}
                                      Download modified file
                                    </a>
                                  </DropdownMenuItem>
                                )}
                                {item.modified_asset && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      router.post(printJob.markDone(item.id))
                                    }
                                    disabled={item.status != 'request_edit'}
                                  >
                                    <Check className="mr-2 h-4 w-4" /> Mark as
                                    done
                                  </DropdownMenuItem>
                                )}
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <DropdownMenuItem
                                      onSelect={(e) => e.preventDefault()}
                                      disabled={!item.edit_notes}
                                    >
                                      <ListTodo className="mr-2 h-4 w-4" /> View
                                      edit notes
                                    </DropdownMenuItem>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Edit notes</DialogTitle>
                                      <DialogDescription>
                                        {item.edit_notes}
                                      </DialogDescription>
                                    </DialogHeader>
                                  </DialogContent>
                                </Dialog>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                  <a
                                    href={
                                      assets.download({
                                        asset: item.asset.id.toString(),
                                      }).url
                                    }
                                  >
                                    <ArrowDownToLine className="mr-2 h-4 w-4" />{' '}
                                    Download original file
                                  </a>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  <CardTitle>System Logs</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {detail.details.flatMap((d) => d.logs || []).length === 0 ? (
                  <div className="py-10 text-center text-muted-foreground">
                    No logs recorded for this job.
                  </div>
                ) : (
                  <div className="relative space-y-4 before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:-translate-x-px before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                    {detail.details
                      .flatMap((d) =>
                        (d.logs || []).map((log) => ({
                          ...log,
                          detail_id_short: d.id.split('-')[0],
                        })),
                      )
                      .sort(
                        (a, b) =>
                          new Date(b.created_at).getTime() -
                          new Date(a.created_at).getTime(),
                      )
                      .map((log) => (
                        <div
                          key={log.id}
                          className="relative flex items-center gap-4 pl-10"
                        >
                          <div className="absolute left-0 flex h-10 w-10 items-center justify-center rounded-full border bg-background shadow-sm">
                            <AlertCircle
                              className={cn(
                                'h-4 w-4',
                                log.status === 'failed'
                                  ? 'text-destructive'
                                  : 'text-muted-foreground',
                              )}
                            />
                          </div>
                          <div className="flex flex-1 flex-col border-b pb-4 last:border-0">
                            <div className="flex justify-between">
                              <p className="text-sm font-semibold">
                                Item {log.detail_id_short}:{' '}
                                <span className="uppercase">{log.status}</span>
                              </p>
                              <time className="text-xs text-muted-foreground">
                                {new Date(log.created_at).toLocaleString()}
                              </time>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {log.message || 'No system message provided.'}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        {selectedItem && (
          <FileUploadDialog
            item={selectedItem}
            open={dialogOpen}
            onOpenChange={setDialogOpen}
          />
        )}
      </div>
    </AppLayout>
  );
}
