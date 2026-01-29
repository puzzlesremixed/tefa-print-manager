import { RefreshCcwDot, Square, Triangle } from 'lucide-react';
import React from 'react'
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Printer } from '@/types/data';
import { router } from '@inertiajs/react';

interface props {
  printer : Printer;
}

function refreshPrintJob(): void {
  router.post(
    `/api/print-job/refresh`,
    {},
    {
      preserveState: true,
      preserveScroll: true,
    },
  );
}

const PrinterCount = ({printer}: props) => {
  console.log(printer)
  return (
    
        <section>
          <h1 className="text-xl">Curently Running Print Job</h1>
          <>
            <Button className="mr-2 bg-green-700 text-white">
              <Triangle className="rotate-90" />
              Run
            </Button>
            <Button className="" variant={'secondary'}>
              <Square className="" />
              Stop
            </Button>
            <Button className="" variant={'secondary'} onClick={refreshPrintJob}>
              <RefreshCcwDot className="" />
              Refresh Stuck Jobs
            </Button>
          </>
          <Card>
            <CardContent>
              {/* <p className="italic">{printer.name ? printer.name :  "No primary printer"}</p> */}
            </CardContent>
          </Card>
        </section>
  )
}

export default PrinterCount