import { PencilIcon, RefreshCcwDot, Square, Triangle, X } from 'lucide-react';
import React, { useState } from 'react'
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PrinterStatusMap, type Printer, type PrintJob } from '@/types/data';
import { router } from '@inertiajs/react';
import { refresh } from "@/routes/printjobs";
import { updatePaperCount } from '@/actions/App/Http/Controllers/PrinterInfoController';
import { Table, TableBody, TableCaption, TableCell, TableRow } from './ui/table';
import printers from '@/routes/printers';
import { Field } from './ui/field';
import { Input } from './ui/input';

interface props {
  printer?: Printer;
  runningFiles?: PrintJob;
}

const addPages: number[] = [5, 10, 20, 50]

const PrinterCount = ({ printer, runningFiles }: props) => {
  const [isEditing, setIsEditing] = useState(false);
  const [paperCount, setPaperCount] = useState(printer?.paper_remaining || 0);
  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (printer)
      router.post(updatePaperCount(printer.id), {
        "paper_remaining": paperCount
      }, {
        onSuccess: () => setIsEditing(false), // Close field on success
      });
  };
  return (

    <section>
      <div className={"flex flex-col lg:flex-row mb-2 lg:justify-between gap-2"}>
        <h1 className="text-xl">Curently Running Print Job</h1>
        <div className={"flex gap-2"}>
          <Button className="bg-green-700 text-white">
            <Triangle className="rotate-90" />
            Run
          </Button>
          <Button className="" variant={'secondary'}>
            <Square className="" />
            Stop
          </Button>
          <Button className="" variant={'secondary'} onClick={() => router.visit(refresh())}>
            <RefreshCcwDot className="" />
            Refresh Stuck Jobs
          </Button>
        </div>
      </div>
      <Card className="overflow-hidden p-0">
        <Table>
          <TableBody>
            <TableRow enableHover={false} className="w-full">
              <TableCell>
                {runningFiles ? runningFiles.customer_name : "No running print job."}
              </TableCell>
            </TableRow>
            {printer &&
              <TableRow enableHover={false} className='h-full' >
                <TableCell className="w-72">
                  <p className="">{printer?.name ?? "No primary printer"}</p>
                  <p className="text-muted-foreground">{printer?.status ? PrinterStatusMap[printer.status] : "No primary printer"}</p>
                </TableCell>
                <TableCell className='border-s'>
                  <div className='flex items-center flex-row gap-2'>
                    <span>Jumlah kertas:</span>
                    {!isEditing ? (
                      <>
                        <span className="text-sm">
                          {printer && printer.paper_remaining > 0 ? printer.paper_remaining : 'Habis'}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setIsEditing(true)}
                          className="h-8 w-8 p-0"
                        >
                          <PencilIcon className="h-2 w-2" />
                        </Button>
                        <div className="flex gap-2">
                          {addPages.map((number) => (
                            <Button size={"sm"} className='cursor-pointer' variant={"secondary"}
                              onClick={() => router.post(updatePaperCount(printer.id), { "paper_remaining": printer.paper_remaining + number })}>
                              +{number}
                            </Button>))}
                        </div>
                      </>
                    ) : (
                      <>
                        <form onSubmit={handleUpdate} className="flex flex-row items-center gap-2">
                          <Input
                            type="number"
                            className="h-8 w-20"
                            value={paperCount}
                            onChange={(e) => setPaperCount(parseInt(e.target.value) || 0)}
                            autoFocus
                          />
                          <Button type="submit" size="sm" className="h-8 px-2">
                            Save
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 px-2"
                            onClick={() => setIsEditing(false)}
                          >
                            Cancel
                          </Button>
                        </form>
                        
                      </>
                    )}
                  </div>

                </TableCell>
              </TableRow>
            }

          </TableBody>
        </Table>
      </Card>
    </section>
  )
}

export default PrinterCount
