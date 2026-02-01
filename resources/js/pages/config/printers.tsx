import {} from '@/actions/App/Http/Controllers/ConfigurationController';
import { setPrimary } from '@/actions/App/Http/Controllers/PrinterInfoController';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { config } from '@/routes';
import printers from '@/routes/printers';
import type { BreadcrumbItem } from '@/types';
import { Printer, PrinterStatusMap } from '@/types/data';
import { Head, Link, router } from '@inertiajs/react';
import {
  AlertTriangleIcon,
  EllipsisVertical,
  Plus,
  RefreshCcw,
  SquareArrowOutUpRight,
  X,
} from 'lucide-react';
import { useForm } from 'react-hook-form';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Configuration',
    href: config().url,
  },
  {
    title: 'Printers',
    href: printers.index().url,
  },
];

interface ConfigProps {
  primaryPrinter?: Printer;
  printers?: Printer[];
  excludedPrinters?: string[];
  endpoint?: string;
}

export default function Config({
  primaryPrinter,
  printers: printersData,
  excludedPrinters,
  endpoint,
}: ConfigProps) {
  const form = useForm<{ printer_name: string }>({
    defaultValues: {
      printer_name: '',
    },
  });

  function onSubmit(values: { printer_name: string }) {
    router.post(printers.exclude.add().url, values, {
      preserveScroll: true,
      preserveState: true,
    });
  }
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Printer Configuration" />
      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        <section className="flex flex-col gap-8 lg:flex-row">
          <div className="w-full text-left lg:w-[40%] lg:text-right">
            <h2 className="mb-2 text-2xl">Printer List</h2>
          </div>
          <div className="w-full">
            {!endpoint && (
              <Alert className="mb-4 border-yellow-200 bg-yellow-50 text-yellow-900 dark:border-yellow-900 dark:bg-yellow-950/30 dark:text-yellow-50">
                <AlertTriangleIcon />
                <AlertTitle>Heads up!</AlertTitle>
                <AlertDescription>
                  <span>
                    No print server endpoint configured. Add one in the{' '}
                    <Link
                      href={config()}
                      className="inline-block hover:underline"
                    >
                      Print manager settings.
                      <SquareArrowOutUpRight className="ml-2 inline-block h-4 w-4" />
                    </Link>
                  </span>
                </AlertDescription>
              </Alert>
            )}
            <Button
              className="cursor-pointer mb-4"
              variant={'secondary'}
              disabled={!endpoint}
              onClick={() => router.visit(printers.sync())}
            >
              <RefreshCcw />
              Sync Printer
            </Button>
            {primaryPrinter?.name ? (
              <Card className="">
                <CardContent className="flex flex-col items-start justify-between gap-2 lg:flex-row">
                  <div>
                    <p className="font-bold">
                      {primaryPrinter.name}
                      <span className="text-muted-foreground">
                        {' '}
                        / {PrinterStatusMap[primaryPrinter.status]}
                      </span>
                    </p>
                    <p className="text-muted-foreground">
                      {primaryPrinter.paper_sizes &&
                        primaryPrinter.paper_sizes
                          .map((item) => String(item))
                          .join(', ')}
                    </p>
                  </div>
                  <Badge className="bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                    PRIMARY
                  </Badge>
                </CardContent>
              </Card>
            ) : (
              <p className="text-muted-foreground">
                No primary printer set. Add a printer and set it as primary to
                make it the default printer for future print jobs.
              </p>
            )}

            {printersData &&
              printersData.length > 0 &&
              printersData.map((printer) => (
                <Card key={printer.id} className="mt-4">
                  <CardContent className="flex flex-col items-center gap-2 lg:flex-row">
                    <div className="w-full">
                      <p className="font-bold">
                        {printer.name}
                        <span className="text-muted-foreground">
                          {' '}
                          / {PrinterStatusMap[printer.status]}
                        </span>
                      </p>
                      <p className="text-muted-foreground">
                        {printer.paper_sizes &&
                          printer.paper_sizes
                            .map((item) => String(item))
                            .join(', ')}
                      </p>
                    </div>
                    <div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost">
                            <EllipsisVertical />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            onClick={() => router.post(setPrimary(printer.id))}
                          >
                            Set as Primary
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              router.post(
                                printers.exclude.add().url,
                                {
                                  printer_name: printer.name,
                                },
                                {
                                  preserveScroll: true,
                                  preserveState: true,
                                },
                              )
                            }
                          >
                            Add to exclusion list
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </section>
        <hr />
        <section className="flex flex-col gap-8 lg:flex-row">
          <div className="flex w-full flex-col text-left lg:w-[40%] lg:items-end lg:text-right">
            <h2 className="mb-2 text-2xl">Exclusion List</h2>
            <p className="text-justify text-muted-foreground lg:max-w-xs">
              Printers in this list will be excluded from being added to the
              printer list during syncing. This also removes the printer from
              the printer list.
              <br />
              <br /> Printer names are case sensitive.
            </p>
          </div>
          <div className="w-full">
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <FieldGroup className="mb-4">
                <Field>
                  <FieldLabel>Printer Name</FieldLabel>
                  <div className="flex items-center gap-2">
                    <Input
                      className="w-full"
                      {...form.register('printer_name')}
                    />
                    <Button type="submit">
                      <Plus />
                      Add
                    </Button>
                  </div>
                </Field>
              </FieldGroup>
            </form>
            <Card className="overflow-hidden p-0">
              <Table>
                {excludedPrinters && excludedPrinters.length === 0 && (
                  <TableCaption className="w-full">
                    No excluded printers added yet.
                  </TableCaption>
                )}
                <TableBody>
                  {excludedPrinters &&
                    excludedPrinters.map((printer, i) => (
                      <TableRow key={i}>
                        <TableCell className="w-full pl-4 font-medium">
                          {printer}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            onClick={() =>
                              router.post(printers.exclude.remove(printer))
                            }
                            variant={'ghost'}
                          >
                            <X className="inline-block h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
