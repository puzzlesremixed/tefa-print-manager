import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { logs } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import { ApiRequestLog } from '@/types/data';
import { Head } from '@inertiajs/react';

interface Props {
  log: ApiRequestLog;
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Logs',
    href: logs().url,
  },
  {
    title: 'Log detail',
    href: logs().url,
  },
];

export default function ApiLogShow({ log }: Props) {
  const p = log.properties;

  return (
      <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={'Log details'} />
        <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
      <div className="space-y-4">
        <h1 className="text-xl">API Log Detail</h1>

        <Card>
          <CardHeader className="flex flex-row gap-2">
            <Badge>{p.method}</Badge>
            <Badge variant={p.status >= 400 ? 'destructive' : 'secondary'}>
              {p.status}
            </Badge>
          </CardHeader>

          <CardContent className="space-y-4 text-sm">
            <div>
              <div className="text-muted-foreground">Path</div>
              <div className="font-mono">{p.path}</div>
            </div>

            <div>
              <div className="text-muted-foreground">URL</div>
              <div className="font-mono break-all">{p.url}</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-muted-foreground">IP</div>
                <div>{p.ip ?? '-'}</div>
              </div>

              <div>
                <div className="text-muted-foreground">Duration</div>
                <div>{p.duration} ms</div>
              </div>
            </div>

            <div>
              <div className="mb-1 text-muted-foreground">Query</div>
              <pre className="overflow-auto rounded bg-muted p-2 text-xs">
                {JSON.stringify(p.query, null, 2)}
              </pre>
            </div>

            <div>
              <div className="mb-1 text-muted-foreground">Payload</div>
              <pre className="overflow-auto rounded bg-muted p-2 text-xs">
                {JSON.stringify(p.payload, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
        </div>
    </AppLayout>
  );
}
