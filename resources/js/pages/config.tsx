import {Button} from '@/components/ui/button';
import {useForm} from "react-hook-form"
import {Card, CardContent} from '@/components/ui/card';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from '@/components/ui/field';
import {Input} from '@/components/ui/input';
import {Switch} from '@/components/ui/switch';
import AppLayout from '@/layouts/app-layout';
import {config} from '@/routes';
import type {BreadcrumbItem} from '@/types';
import {Configuration, ConfigValue, Printer} from '@/types/data';
import {Head, Link, router} from '@inertiajs/react';
import {ChevronRight, RefreshCcw} from 'lucide-react';
import React from "react";
import {store} from "@/actions/App/Http/Controllers/ConfigurationController";

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Configuration',
    href: config().url,
  },
];

interface ConfigProps {
  primaryPrinter?: Printer
  configuration?: ConfigValue
}

function sync() {
  router.post(
    `/api/printers/sync`,
    {},
    {
      preserveState: true,
      preserveScroll: true,
    },
  );
}

type FormType = {

  prices: Prices,
  prinserv_endpoint: string,
  mobilekiosk_endpoint: string,
  whatsappbot_endpoint: string,
  temp_duration: number,
  delete_files: boolean,

}

type Prices = {
  bnw: number,
  color: number
}


export default function Config({primaryPrinter, configuration}: ConfigProps) {
  const form = useForm<FormType>({
    defaultValues: {
      prices: {
        bnw: configuration?.prices?.bnw ?? 500,
        color: configuration?.prices?.color ?? 1500,
      },
      temp_duration: configuration?.temp_duration ?? 86400000,
      delete_files: configuration?.delete_files ?? false,
      prinserv_endpoint: configuration?.prinserv_endpoint ?? '',
      mobilekiosk_endpoint: configuration?.mobilekiosk_endpoint ?? '',
      whatsappbot_endpoint: configuration?.whatsappbot_endpoint ?? '',
    },
  })

  function onSubmit(values: FormType) {
    router.post(
      store().url,
      values,
      {
        preserveScroll: true,
      }
    )
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Configuration"/>
      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        <section className="flex gap-8">
          <div className="w-full text-right lg:w-[40%]">
            <h2 className="mb-2 text-2xl">Printer settings</h2>
            <Link href="/" className="hover:underline">
              More printers <ChevronRight className="inline-block h-4 w-4"/>
            </Link>
          </div>
          <div className="w-full">
            <Button className="" variant={'secondary'} onClick={() => sync()}>
              <RefreshCcw/>
              Sync Printer
            </Button>
            <Card>
              <CardContent>
                <p className="italic">// printer info</p>
              </CardContent>
            </Card>
          </div>
        </section>
        <hr/>
        <form className="flex gap-8" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="w-full lg:w-[40%]">
            <h2 className="text-right text-2xl">Store Settings</h2>
          </div>
          <div className="w-full">
            <FieldGroup>
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
                      <Input placeholder="500"
                             required     {...form.register("prices.bnw", {valueAsNumber: true})}/>
                    </Field>
                    <Field>
                      <FieldLabel>Color</FieldLabel>
                      <Input placeholder="1500"
                             required {...form.register("prices.color", {valueAsNumber: true})}/>
                    </Field>
                  </div>
                </FieldSet>
              </FieldGroup>

              <FieldSeparator/>

              <FieldGroup>
                <FieldSet>
                  <FieldLegend>Schedule</FieldLegend>
                  <FieldDescription>
                    Operational schedule. System will not acecpt user print
                    request outside of these hours.
                  </FieldDescription>
                </FieldSet>
              </FieldGroup>

              <FieldSeparator/>
              <FieldGroup>
                <FieldSet>
                  <FieldLegend>Endpoints</FieldLegend>
                  <FieldDescription>
                    Change where to contact other PriPrinan services. Please enter URL without a
                    trailing slash.
                  </FieldDescription>
                </FieldSet>
                <FieldSet>
                  <Field>
                    <FieldLabel>WhatsApp Bot</FieldLabel>
                    <Input placeholder="/"
                           {...form.register("whatsappbot_endpoint")} required={false}/>
                  </Field>
                </FieldSet>
                <FieldSet>
                  <Field>
                    <FieldLabel>Print Server</FieldLabel>
                    <Input placeholder="/"
                           required {...form.register("prinserv_endpoint")}/>
                  </Field>
                </FieldSet>
                <FieldSet>
                  <Field>
                    <FieldLabel>Mobile Kiosk</FieldLabel>
                    <Input placeholder="/"
                           required={false} {...form.register("mobilekiosk_endpoint")}/>
                  </Field>
                </FieldSet>
              </FieldGroup>

              <FieldSeparator/>

              <FieldGroup className={""}>
                <FieldSet className={"text-nowrap"}>
                  <FieldLegend>Temporary Files Cleanup</FieldLegend>
                  <FieldDescription>
                    Set how print job files are being stored
                  </FieldDescription>
                </FieldSet>

                <FieldSet>
                  <Field>
                    <div className={"flex gap-4"}>
                      <Switch
                        name={"deleteFiles"}
                        checked={form.watch("delete_files")}
                        onCheckedChange={(v) => form.setValue("delete_files", v)}
                      />
                      <FieldLabel>Don't delete files</FieldLabel>
                      <FieldDescription className={"text-nowrap"}>Enable to keep print job
                        files.</FieldDescription>
                    </div>
                  </Field>
                </FieldSet>
                <FieldSet>
                  <Field>
                    <FieldLabel>Duration</FieldLabel>
                    <Input placeholder="1500" required value={configuration?.temp_duration}
                           className={"w-full"}  {...form.register("temp_duration", {valueAsNumber: true})}/>
                    <FieldDescription className={"text-nowrap"}>How long before print job files
                      are being deleted in
                      miliseconds.</FieldDescription>
                  </Field>
                </FieldSet>
              </FieldGroup>

              <Field orientation={'horizontal'}>
                <Button type="submit">
                  Submit
                </Button>
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Field>
            </FieldGroup>
          </div>
        </form>
      </div>
    </AppLayout>
  )
    ;
}
