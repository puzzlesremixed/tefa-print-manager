import {RefreshCcwDot, Square, Triangle} from 'lucide-react';
import React from 'react'
import {Button} from '@/components/ui/button';
import {Card, CardContent} from '@/components/ui/card';
import type {Printer} from '@/types/data';
import {router} from '@inertiajs/react';
import {refresh} from "@/routes/printjobs";

interface props {
    printer?: Printer;
}

const PrinterCount = ({printer}: props) => {
    return (

        <section>
            <h1 className="text-xl">Curently Running Print Job</h1>
            <>
                <Button className="mr-2 bg-green-700 text-white">
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
            </>
            <Card>
                <CardContent>
                     <p className="text-foreground-muted">{printer?.name ??  "No primary printer"}</p>
                </CardContent>
            </Card>
        </section>
    )
}

export default PrinterCount
