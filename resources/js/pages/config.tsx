import { store } from '@/actions/App/Http/Controllers/ConfigurationController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import AppLayout from '@/layouts/app-layout';
import { config } from '@/routes';
import printers from '@/routes/printers';
import type { BreadcrumbItem } from '@/types';
import { ConfigValue, Printer, PrinterStatusMap } from '@/types/data';
import { Head, Link, router } from '@inertiajs/react';
import { ChevronRight} from 'lucide-react';
import { useForm, UseFormReturn } from 'react-hook-form';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Configuration',
    href: config().url,
  },
];

interface ConfigProps {
  primaryPrinter?: Printer;
  configuration?: ConfigValue;
}


type FormType = {
  prices: Prices;
  prinserv_endpoint: string;
  colorserv_endpoint: string;
  mobilekiosk_endpoint: string;
  whatsappbot_endpoint: string;
  temp_duration: number;
  delete_files: boolean;
};

type Prices = {
  bnw: number;
  color: number;
  full_color: number;
};

export default function Config({primaryPrinter, configuration}: ConfigProps) {
  const form = useForm<FormType>({
    defaultValues: {
      prices: {
        bnw: configuration?.prices?.bnw ?? 500,
        color: configuration?.prices?.color ?? 1000,
        full_color: configuration?.prices?.full_color ?? 1500,
      },
      temp_duration: configuration?.temp_duration ?? 86400000,
      delete_files: configuration?.delete_files ?? false,
      prinserv_endpoint: configuration?.prinserv_endpoint ?? '',
      colorserv_endpoint: configuration?.colorserv_endpoint ?? '',
      mobilekiosk_endpoint: configuration?.mobilekiosk_endpoint ?? '',
      whatsappbot_endpoint: configuration?.whatsappbot_endpoint ?? '',
    },
  });

  function onSubmit(values: FormType) {
    router.post(store().url, values, {
      preserveScroll: true,
      preserveState: true,
    });
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Configuration"/>
      <div
        className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4"
      >
        <section className="flex flex-col gap-8 lg:flex-row">
          <div className="w-full text-left lg:w-[40%] lg:text-right">
            <h2 className="mb-2 text-2xl">Printer Settings</h2>
            <Link href={printers.index()} className="hover:underline">
              More printers <ChevronRight className="inline-block h-4 w-4"/>
            </Link>
          </div>
          <div className="w-full">
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
          </div>
        </section>
        <hr/>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <section className="flex flex-col gap-8 lg:flex-row">
            <div className="w-full text-left lg:w-[40%] lg:text-right">
              <h2 className="mb-2 text-2xl">Store Settings</h2>
            </div>
            <div className="w-full ">
              <FieldGroup>
                <StoreSettings form={form}/>
                <FieldSeparator/>

                <FieldGroup className={"relative"}>
                  <div className="absolute inset-0 bg-gray-400 opacity-20"></div>

                  <FieldSet>
                    <FieldLegend>Schedule</FieldLegend>
                    <FieldDescription>
                      Operational schedule. System will not acecpt user print
                      request outside of these hours.
                    </FieldDescription>
                  </FieldSet>
                </FieldGroup>
              </FieldGroup>
            </div>
          </section>
          <Separator className='my-4'/>
          <section className="flex flex-col gap-8 lg:flex-row">
            <div className="w-full text-left lg:w-[40%] lg:text-right">
              <h2 className="mb-2 text-2xl">Print Manager Settings</h2>
            </div>
            <div className="w-full">
              <PrinManSettings form={form}/>
            </div>
          </section>
          <div className="flex">
            {' '}
            <Field orientation={'horizontal'} className="justify-end">
              <Button variant="outline" type="button">
                Cancel
              </Button>
              <Button type="submit">Submit</Button>
            </Field>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}

function StoreSettings({form}: { form: UseFormReturn<FormType> }) {
  return (
    <FieldGroup>
      <FieldSet>
        <FieldLegend>Per-page pricing</FieldLegend>
        <FieldDescription>
          Values are in Indonesian Rupiahs (IDR)
        </FieldDescription>
      </FieldSet>
      <FieldSet>
        <div className="flex gap-4">
          <Field>
            <FieldLabel>Black & White</FieldLabel>
            <Input
              placeholder="500"
              required
              {...form.register('prices.bnw', {valueAsNumber: true})}
            />
          </Field>
          <Field>
            <FieldLabel>Color</FieldLabel>
            <Input
              placeholder="1000"
              required
              {...form.register('prices.color', {valueAsNumber: true})}
            />
          </Field>
          <Field>
          <FieldLabel>Full Color</FieldLabel>
          <Input
            placeholder="1500"
            required
            {...form.register('prices.full_color', {valueAsNumber: true})}
          />
        </Field>
        </div>
      </FieldSet>
    </FieldGroup>
  );
}

function PrinManSettings({form}: { form: UseFormReturn<FormType> }) {
  return (
    <>
      <FieldGroup>
        <FieldSet>
          <FieldLegend>Endpoints</FieldLegend>
          <FieldDescription>
            Change where to contact other PrinPrinan services. Please enter URL
            without a trailing slash.
          </FieldDescription>
        </FieldSet>
        <FieldSet>
          <Field>
            <FieldLabel>WhatsApp Bot</FieldLabel>
            <Input
              placeholder="/"
              {...form.register('whatsappbot_endpoint')}
              required={false}
            />
          </Field>
        </FieldSet>
        <FieldSet>
          <Field>
            <FieldLabel>Print Server</FieldLabel>
            <Input
              placeholder="/"
              required
              {...form.register('prinserv_endpoint')}
            />
          </Field>
        </FieldSet><FieldSet>
        <Field>
          <FieldLabel>Color Detection Server</FieldLabel>
          <Input
            placeholder="/"
            required
            {...form.register('colorserv_endpoint')}
          />
        </Field>
      </FieldSet>
        <FieldSet>
          <Field>
            <FieldLabel>Mobile Kiosk</FieldLabel>
            <Input
              placeholder="/"
              required={false}
              {...form.register('mobilekiosk_endpoint')}
            />
          </Field>
        </FieldSet>
      </FieldGroup>

      <FieldSeparator className="my-2"/>

      <FieldGroup className={'relative mb-4'}>
        <div className="absolute inset-0 bg-gray-400 opacity-20"></div>
        <FieldSet className={'text-nowrap'}>
          {/* TODO : implement files cleanup */}
          <FieldLegend>Temporary Files Cleanup</FieldLegend>
          <FieldDescription>
            Set how print job files are being stored
          </FieldDescription>
        </FieldSet>

        <FieldSet>
          <Field>
            <div className={'flex gap-4'}>
              <Switch
                name={'deleteFiles'}
                checked={form.watch('delete_files')}
                onCheckedChange={(v) => form.setValue('delete_files', v)}
              />
              <FieldLabel>Keep files</FieldLabel>
              <FieldDescription className={'text-nowrap'}>
                Enable to keep print job files.
              </FieldDescription>
            </div>
          </Field>
        </FieldSet>
        <FieldSet>
          <Field>
            <FieldLabel>Duration</FieldLabel>
            <Input
              placeholder="1500"
              required
              className={'w-full'}
              {...form.register('temp_duration', {
                valueAsNumber: true,
              })}
            />
            <FieldDescription className={'text-nowrap'}>
              How long before print job files are being deleted in miliseconds.
            </FieldDescription>
          </Field>
        </FieldSet>
      </FieldGroup>
    </>
  );
}
