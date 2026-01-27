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
import AppLayout from '@/layouts/app-layout';
import { config } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Configuration',
    href: config().url,
  },
];

export default function Config() {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Configuration" />
      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        <section className="flex gap-8">
          <div className="w-full lg:w-[40%] text-right">
              <h2 className="mb-2 text-2xl">Printer settings</h2>
              <Link href="/" className="hover:underline">
                More printers <ChevronRight className="inline-block h-4 w-4" />
              </Link>
          </div>
          <div className="w-full">
            <Card>
              <CardContent>
                <p className="italic">// printer info</p>
              </CardContent>
            </Card>
          </div>
        </section>
        <hr />
        <section className="flex gap-8">
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
                      <Input placeholder="500" required />
                    </Field>
                    <Field>
                      <FieldLabel>Color</FieldLabel>
                      <Input placeholder="1500" required />
                    </Field>
                  </div>
                </FieldSet>
              </FieldGroup>

              <FieldSeparator />

              <FieldGroup>
                <FieldSet>
                  <FieldLegend>Schedule</FieldLegend>
                  <FieldDescription>
                    Operational schedule. System will not acecpt user print
                    request outside of these hours.
                  </FieldDescription>
                </FieldSet>
              </FieldGroup>

              <FieldSeparator />

              <FieldGroup>
                <FieldSet>
                  <FieldLegend>Temporary Files Cleanup</FieldLegend>
                  <FieldDescription>
                    Set how long print job files stays on storage.
                  </FieldDescription>
                </FieldSet>
              </FieldGroup>

              <Field orientation={'horizontal'}>
                <Button type="submit" disabled>
                  Submit
                </Button>
                <Button variant="outline" type="button" disabled>
                  Cancel
                </Button>
              </Field>
            </FieldGroup>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
