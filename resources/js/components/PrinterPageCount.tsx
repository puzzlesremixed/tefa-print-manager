import {RefreshCcwDot, Square, Triangle} from 'lucide-react';
import React from 'react'
import {Button} from '@/components/ui/button';
import {Card, CardContent} from '@/components/ui/card';
import type {Printer, PrintJob} from '@/types/data';
import {router} from '@inertiajs/react';
import {refresh} from "@/routes/printjobs";
import { updatePaperCount } from '@/actions/App/Http/Controllers/PrinterInfoController';

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
          <p>Paper Count: {printer ? printer.paper_remaining : 'habis'}</p>

          {printer &&
          <Button className='m-2 px-6' onClick={() => router.post(updatePaperCount(printer.id), {"paper_remaining" : printer.paper_remaining + 5})}>+5</Button>}
          {printer &&
          <Button className='m-2 px-6' onClick={() => router.post(updatePaperCount(printer.id), {"paper_remaining" : printer.paper_remaining + 10})}>+10</Button>}
          {printer &&
          <Button className='m-2 px-6' onClick={() => router.post(updatePaperCount(printer.id), {"paper_remaining" : printer.paper_remaining + 20})}>+20</Button>}
          {printer &&
          <Button className='m-2 px-6' onClick={() => router.post(updatePaperCount(printer.id), {"paper_remaining" : printer.paper_remaining + 50})}>+50</Button>}
        </CardContent>
      </Card>
    </section>
  )
}

export default PrinterCount
