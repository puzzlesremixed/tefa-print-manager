import {RefreshCcwDot, Square, Triangle} from 'lucide-react';
import React from 'react'
import {Button} from '@/components/ui/button';
import {Card, CardContent} from '@/components/ui/card';
import type {Printer, PrintJob} from '@/types/data';
import {router} from '@inertiajs/react';
import {refresh} from "@/routes/printjobs";

interface props {
  printer?: Printer;
  runningFiles?: PrintJob;
}

const PrinterCount = ({printer, runningFiles}: props) => {
  return (

    <section>
      <div className={"flex flex-col lg:flex-row mb-2 lg:justify-between gap-2"}>
      <h1 className="text-xl">Curently Running Print Job</h1>
      <div className={"flex gap-2"}>
        <Button className="bg-green-700 text-white">
          <Triangle className="rotate-90"/>
          Run
        </Button>
        <Button className="" variant={'secondary'}>
          <Square className=""/>
          Stop
        </Button>
        <Button className="" variant={'secondary'} onClick={() => router.visit(refresh())}>
          <RefreshCcwDot className=""/>
          Refresh Stuck Jobs
        </Button>
      </div>
      </div>
      <Card>
        <CardContent>
          <p className="text-foreground-muted">{printer?.name ?? "No primary printer"}</p>
          <p>{runningFiles ? runningFiles.customer_name : 'No running files'}</p>
        </CardContent>
      </Card>
    </section>
  )
}

export default PrinterCount
