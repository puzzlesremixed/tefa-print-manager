import {StatusBadge} from '@/components/StatusBadge';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle} from '@/components/ui/empty';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Progress} from '@/components/ui/progress';
import {RadioGroup, RadioGroupItem} from '@/components/ui/radio-group';
import {Table, TableHeader, TableRow, TableHead, TableBody, TableCell} from '@/components/ui/table';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import {cn} from '@/lib/utils';
import {queue} from '@/routes';
import assets from '@/routes/assets';
import editRequest from '@/routes/edit-request';
import type {BreadcrumbItem} from '@/types';
import {PrintJob, PrintJobDetail} from '@/types/data';
import {Head, router, useForm} from '@inertiajs/react';
import {
  AlertCircle,
  ArrowDownToLine,
  ArrowUpToLine, Check,
  CheckCircle2,
  Clock,
  CreditCard,
  EllipsisVertical, FilePen,
  FilePlus,
  FileText,
  History,
  ListTodo,
  Loader2,
  Printer,
  SquareArrowOutUpRightIcon,
  X
} from 'lucide-react';
import React, {Dispatch, FormEvent, SetStateAction, useCallback, useEffect, useState} from 'react';
import {useDropzone} from 'react-dropzone';
import pricing from "@/routes/pricing";
import printJob from "@/routes/printJob";

const getEffectivePageNumbers = (
  rangeStr: string | undefined,
  totalFilePages: number,
): number[] => {
  if (!rangeStr) return Array.from({length: totalFilePages}, (_, i) => i + 1);

  const pages = new Set<number>();
  const parts = rangeStr.split(",");

  for (const part of parts) {
    if (part.includes("-")) {
      const [start, end] = part.split("-").map((x) => parseInt(x.trim()));
      if (!isNaN(start) && !isNaN(end) && end >= start) {
        for (let i = start; i <= end; i++) {
          if (i > 0 && i <= totalFilePages) pages.add(i);
        }
      }
    } else {
      const page = parseInt(part.trim());
      if (!isNaN(page) && page > 0 && page <= totalFilePages) pages.add(page);
    }
  }

  if (pages.size === 0) {
    return Array.from({length: totalFilePages}, (_, i) => i + 1);
  }

  return Array.from(pages).sort((a, b) => a - b);
};

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Queue',
    href: queue().url,
  },
  {
    title: 'Details',
    href: "",
  },
];

interface QueueProps {
  detail: PrintJob;
}

export default function PrintJobDetails({detail}: QueueProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PrintJobDetail | null>(null);
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Details"/>
      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{detail.customer_name}<span
              className="text-muted-foreground"> / +{detail.customer_number}<a
              href={`https://wa.me/${detail.customer_number}`} className="group ml-2"
              target='_blank'><SquareArrowOutUpRightIcon
              className='p-1 inline-block group-hover:text-white'/></a></span></h1>
            <p className="text-muted-foreground">Job ID: {detail.id}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={detail.paid_at ? "default" : "outline"} className="px-3 py-1">
              {detail.paid_at ? <CheckCircle2 className="w-3 h-3 mr-1"/> : <Clock className="w-3 h-3 mr-1"/>}
              {detail.paid_at ? "Paid" : "Unpaid"}
            </Badge>
            <StatusBadge status={detail.status}/>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Price</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground"/>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rp {detail.total_price.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Files Count</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground"/>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{detail.details.length} Items</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Paper</CardTitle>
              <Printer className="h-4 w-4 text-muted-foreground"/>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {detail.total_pages} Pages
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Created At</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground"/>
            </CardHeader>
            <CardContent>
              <div className="text-md font-medium">{new Date(detail.created_at).toLocaleDateString()}</div>
              <p className="text-xs text-muted-foreground">{new Date(detail.created_at).toLocaleTimeString()}</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="files" className="w-full">
          <TabsList className="grid w-full max-w-[400px] grid-cols-2">
            <TabsTrigger value="files">Print Items</TabsTrigger>
            <TabsTrigger value="logs">Activity Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="files" className="mt-4">
            <div className='mb-4'>
              <CardTitle>Job Details</CardTitle>
              <CardDescription>Configure and review individual file settings.</CardDescription></div>
            <Card className="p-0">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset ID / File</TableHead>
                      <TableHead>Extension</TableHead>
                      <TableHead>Copies</TableHead>
                      <TableHead>Color</TableHead>
                      <TableHead>Pages</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detail.details.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell
                          className={cn("font-medium  overflow-hidden text-ellipsis", item.modified_asset && "flex flex-col w-full")}>
                          {item.modified_asset ?
                            <>
                              <span className=''>{item.modified_asset.filename}</span>
                              <Badge>Modified</Badge></> : <span className=''>{item.asset.filename}</span>

                          }
                        </TableCell>
                        <TableCell>
                          {item.modified_asset ? <span className="">.{item.modified_asset.extension}</span> :
                            <span className="">.{item.asset.extension}</span>}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">{item.copies}x</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">{item.print_color}</span>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {item.pages_to_print || 'All'}
                            <div className="text-xs text-muted-foreground">{item.paper_count ?? 0} total sheets</div>
                          </div>
                        </TableCell>
                        <TableCell>Rp {item.price.toLocaleString()}</TableCell>
                        <TableCell>
                          <StatusBadge status={item.status}/>
                        </TableCell>
                        <TableCell>
                          <>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost">
                                  <EllipsisVertical/>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>

                                <DropdownMenuItem
                                  onSelect={() => {
                                    setSelectedItem(item);
                                    setDialogOpen(true);
                                  }}
                                  disabled={item.status !== 'request_edit'}
                                >
                                  <ArrowUpToLine className="w-4 h-4 mr-2"/> Upload file
                                </DropdownMenuItem>

                                {item.modified_asset &&
                                  <DropdownMenuItem asChild>
                                  <a href={
                                    assets.download({
                                      asset: item.modified_asset.id.toString(),
                                    }).url
                                  }>
                                    <FilePen className='w-4 h-4 mr-2'/> Download modified file
                                  </a>
                                </DropdownMenuItem>}
                                {item.modified_asset &&
                                  <DropdownMenuItem onClick={()=>router.post(printJob.markDone(item.id))}>
                                    <Check className='w-4 h-4 mr-2'/> Mark as done
                                </DropdownMenuItem>}
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} disabled={!item.edit_notes}>
                                      <ListTodo className='w-4 h-4 mr-2'/> View edit notes
                                    </DropdownMenuItem>
                                  </ DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Edit notes</DialogTitle>
                                      <DialogDescription>
                                        {item.edit_notes}
                                      </DialogDescription>
                                    </DialogHeader>
                                  </DialogContent>
                                </Dialog>
                                <DropdownMenuSeparator/>
                                <DropdownMenuItem asChild>
                                  <a href={
                                    assets.download({
                                      asset: item.asset.id.toString(),
                                    }).url
                                  }>
                                    <ArrowDownToLine className='w-4 h-4 mr-2'/> Download original file
                                  </a>
                                </DropdownMenuItem>

                              </DropdownMenuContent>
                            </DropdownMenu>
                          </>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5"/>
                  <CardTitle>System Logs</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {detail.details.flatMap(d => d.logs || []).length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">No logs recorded for this job.</div>
                ) : (
                  <div
                    className="relative space-y-4 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                    {detail.details.flatMap(d => (d.logs || []).map(log => ({
                      ...log,
                      detail_id_short: d.id.split('-')[0]
                    })))
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .map((log) => (
                        <div key={log.id} className="relative flex items-center gap-4 pl-10">
                          <div
                            className="absolute left-0 flex h-10 w-10 items-center justify-center rounded-full border bg-background shadow-sm">
                            <AlertCircle
                              className={cn("h-4 w-4", log.status === 'failed' ? "text-destructive" : "text-muted-foreground")}/>
                          </div>
                          <div className="flex flex-1 flex-col pb-4 border-b last:border-0">
                            <div className="flex justify-between">
                              <p className="text-sm font-semibold">
                                Item {log.detail_id_short}: <span className="uppercase">{log.status}</span>
                              </p>
                              <time
                                className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</time>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {log.message || "No system message provided."}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        {
          selectedItem && (
            <FileUploadDialog
              item={selectedItem}
              open={dialogOpen}
              onOpenChange={setDialogOpen}
            />
          )
        }
      </div>
    </AppLayout>
  )
    ;
}

interface ColorDetail {
  color: 'full_color' | 'color' | 'black_and_white';
  page: number;
  percentage: number;
  price: number;
}

interface DetectionData {
  colors: ColorDetail[];
  total_pages: number;
  total_price: number;
  type: string;
}

interface DetectionResponse {
  data: DetectionData[];
  success: string;
}

interface FileUploadDialogProps {
  item: PrintJobDetail;
  open: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
}

const FileUploadDialog = ({item, open, onOpenChange}: FileUploadDialogProps) => {
  const [detectionResult, setDetectionResult] = useState<DetectionData | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionError, setDetectionError] = useState<string | null>(null);

  const {data, setData, post, processing, errors, progress, reset} = useForm({
    file: null as File | null,
    print_color: item.print_color || 'bnw',
    copies: item.copies || 1,
    pages_to_print: item.pages_to_print || '',
    price: item.price || 0,
    paper_count: item.paper_count || 0,
    total_pages: 0,
  });

  const fetchDetection = async (file: File) => {
    setIsDetecting(true);
    setDetectionError(null);
    setDetectionResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('print_color', data.print_color);
    formData.append('copies', data.copies.toString());
    formData.append('pages_to_print', data.pages_to_print || '');

    try {
      const response = await fetch(pricing.preview().url, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Failed to analyze the file.');

      const result = await response.json();

      if (!result.success) throw new Error(result.message || 'Analysis failed.');

      setDetectionResult({
        colors: result.colors,
        total_pages: result.total_pages,
        total_price: result.total_price,
        type: result.type
      });

      setData(prev => ({
        ...prev,
        file: file,
        pages_to_print: `1-${result.total_pages}`,
        total_pages: result.total_pages,
      }));

    } catch (error: any) {
      setDetectionError(error.message);
      reset('file');
    } finally {
      setIsDetecting(false);
    }
  };


  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles[0]) {
      fetchDetection(acceptedFiles[0])
    }
  }, []);

  const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop, multiple: false});

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!data.file) return;
    post(editRequest.upload({detail: item.id}).url, {
      onSuccess: () => {
        onOpenChange(false);
        reset();
        setDetectionResult(null);
      },
    });
  };

  const removeFile = () => {
    reset();
    setDetectionResult(null);
    setDetectionError(null);
  };

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) {
      removeFile();
    }
  };

  const renderContent = () => {
    if (isDetecting) {
      return (
        <div className="flex flex-col items-center justify-center p-10">
          <Loader2 className="w-8 h-8 animate-spin text-primary"/>
          <p className="mt-4 text-sm text-muted-foreground">Analyzing your file...</p>
        </div>
      );
    }

    if (detectionError) {
      return (
        <div className="text-center p-10">
          <AlertCircle className="w-8 h-8 mx-auto text-destructive"/>
          <p className="mt-4 text-sm text-destructive">{detectionError}</p>
          <Button variant="outline" className="mt-4" onClick={removeFile}>Try again</Button>
        </div>
      );
    }

    if (data.file && detectionResult) {
      return (
        <div>
          <div className="flex items-center justify-between p-4 border rounded-md">
            <div className='flex items-center gap-2 overflow-hidden'>
              <FileText className="w-6 h-6 flex-shrink-0"/>
              <span className="text-sm font-medium truncate">{data.file.name}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={removeFile} disabled={processing}>
              <X className="w-4 h-4"/>
            </Button>
          </div>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="copies">Copies</Label>
                <Input id="copies" type="number" value={data.copies}
                       onChange={e => setData('copies', parseInt(e.target.value) || 1)} min="1"/>
              </div>
              <div>
                <Label htmlFor="pages_to_print">Page Range</Label>
                <Input id="pages_to_print" type="text" value={data.pages_to_print}
                       onChange={e => setData('pages_to_print', e.target.value)} placeholder={`e.g., 1-5, 8, 11-13`}/>
              </div>
            </div>
            <div>
              <Label>Color Option</Label>
              <RadioGroup value={data.print_color}
                          onValueChange={(value: 'bnw' | 'color') => setData('print_color', value)}
                          className="flex items-center gap-4 mt-2">
                <div className="flex items-center space-x-2"><RadioGroupItem value="bnw" id="bnw"/><Label htmlFor="bnw">Black
                  & White</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="color" id="color"/><Label
                  htmlFor="color">Color</Label></div>
              </RadioGroup>
            </div>
            <Card className="bg-muted">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Estimated Price:</span>
                  <span className="text-lg font-bold">Rp {data.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center mt-1 text-xs text-muted-foreground">
                  <span>Total sheets required:</span>
                  <span>{data.paper_count} sheets</span>
                </div>
              </CardContent>
            </Card>
            {progress && <Progress value={progress.percentage} className="w-full"/>}
            <Button type="submit" disabled={processing} className="w-full">
              {processing ? 'Uploading...' : 'Confirm and Upload'}
            </Button>
            {errors.file && <p className="mt-2 text-sm text-red-500">{errors.file}</p>}
          </form>
        </div>
      );
    }

    return (
      <div {...getRootProps()}
           className={cn("border-2 border-dashed rounded-lg p-10 text-center cursor-pointer", isDragActive && "border-primary bg-muted")}>
        <input {...getInputProps()} />
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon"><FilePlus/></EmptyMedia>
            <EmptyTitle>Drag & drop a file here</EmptyTitle>
            <EmptyDescription>or click to select a file to complete this edit request.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className=" flex flex-col">
        <DialogHeader>
          <DialogTitle className="pb-2">Upload new file</DialogTitle>
        </DialogHeader>
        <DialogDescription asChild className='w-full'>
          {renderContent()}
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
};