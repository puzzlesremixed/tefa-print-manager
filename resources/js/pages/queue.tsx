import {DataTable} from '@/components/data-table';
import PrinterCount from '@/components/PrinterPageCount';
import {StatusBadge} from '@/components/StatusBadge';
import {Button} from '@/components/ui/button';

import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import {basePrintJobColumns} from '@/types/column';
import {Printer, PrintJob} from '@/types/data';
import {Head, router, usePage, usePoll} from '@inertiajs/react';
import type {ColumnDef} from '@tanstack/react-table';
import {HandCoins, ListStart, Plus} from 'lucide-react';
import {cancelPrintJob, dispatchJob, simulatePayment} from "@/actions/App/Http/Controllers/PrintJobController";

interface QueueProps {
    queuedFiles: PrintJob[];
    pendingFiles: PrintJob[];
    waitingPaymentFiles: PrintJob[];
    printer: Printer;
}

function CancelCell({id}: { id: number }) {
    return (
        <Button
            className="cursor-pointer"
            variant={'secondary'}
            onClick={() => router.visit(cancelPrintJob(id.toString()))}
        >
            <Plus className="rotate-45"/>
        </Button>
    )
}

function SimulatePaymentCell({id}: { id: number }) {
    return (
        <Button
            className="cursor-pointer"
            variant={'secondary'}
            onClick={() => router.visit(simulatePayment(id.toString()))}
        >
            <HandCoins className="rotate-45"/>
        </Button>

    )
}

const queueColumns: ColumnDef<PrintJob>[] = [
    ...basePrintJobColumns,
    {
        accessorKey: 'status',
        header: 'Status',
        cell: ({row}) => {
            return (
                <StatusBadge status={row.original.status}/>
            );
        },
    },
    {
        accessorKey: 'actions',
        header: 'Actions',

        cell: ({row}) => {
            return (
                <div className="flex gap-2">
                    <CancelCell id={row.original.id}/>
                </div>
            );
        },
    },
];

const pendingColumns: ColumnDef<PrintJob>[] = [
    ...basePrintJobColumns,
    {
        accessorKey: 'actions',
        header: 'Actions',

        cell: ({row}) => {
            return (
                <div className="flex gap-2">
                    <Button
                        className="cursor-pointer"
                        variant={'secondary'}
                        onClick={() => router.visit(dispatchJob(row.original.id.toString()))}
                    >

                        <ListStart/>
                    </Button>

                    <CancelCell id={row.original.id}/>
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
        cell: ({row}) => {
            return (
                <div className="flex gap-2">
                    <SimulatePaymentCell id={row.original.id}/>
                    <CancelCell id={row.original.id}/>
                </div>
            );
        },
    },
];

const breadcrumbs = [{title: 'Queue', href: '/queue'}];


export default function Queue({
                                  queuedFiles,
                                  pendingFiles,
                                  waitingPaymentFiles, printer
                              }: QueueProps) {
    const {flash} = usePage();
    usePoll(2000);
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Queue"/>
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">

                <PrinterCount printer={printer}/>

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
                            <DataTable columns={queueColumns} data={queuedFiles}/>
                        </div>
                    </TabsContent>

                    <TabsContent value="pending">
                        <div className="rounded-md border">
                            <DataTable columns={pendingColumns} data={pendingFiles}/>
                        </div>
                    </TabsContent>

                    <TabsContent value="payment">
                        <div className="rounded-md border">
                            <DataTable columns={unpaidColumns} data={waitingPaymentFiles}/>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
