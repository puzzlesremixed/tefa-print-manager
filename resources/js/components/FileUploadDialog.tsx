import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import api from '@/routes/api';
import editRequest from '@/routes/edit-request';
import { PrintJobDetail } from '@/types/data';
import { useForm } from '@inertiajs/react';
import { AlertCircle, FilePlus, FileText, Loader2, X } from 'lucide-react';
import {
  Dispatch,
  FormEvent,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { useDropzone } from 'react-dropzone';

interface ColorDetail {
  color: 'full_color' | 'color' | 'black_and_white';
  page: number;
  percentage: number;
  price: number;
  price_bnw: number;
}

interface DetectionData {
  data: ColorDetail[];
  filename: string;
  total_pages: number;
  total_price: number;
  total_price_bnw: number;
  type: string;
}

interface FileUploadDialogProps {
  item: PrintJobDetail;
  open: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
}

/**
 * Parses a page range string and validates it against the total number of pages.
 * @param rangeStr The input string (e.g., "1-3, 5, 8").
 * @param totalPages The maximum number of pages in the document.
 * @returns An object containing the array of page numbers or an error message.
 */
const parsePageRange = (
  rangeStr: string,
  totalPages: number,
): { pages: number[] | null; error: string | null } => {
  if (!rangeStr.trim()) {
    return {
      pages: Array.from({ length: totalPages }, (_, i) => i + 1),
      error: null,
    };
  }

  const pages = new Set<number>();
  const parts = rangeStr.split(',');

  for (const part of parts) {
    const trimmedPart = part.trim();
    if (!trimmedPart) continue;

    if (/^\d+-\d+$/.test(trimmedPart)) {
      const [start, end] = trimmedPart.split('-').map(Number);
      if (isNaN(start) || isNaN(end) || start <= 0 || end <= 0 || start > end) {
        return { pages: null, error: `Invalid range: "${trimmedPart}"` };
      }
      if (end > totalPages) {
        return {
          pages: null,
          error: `Page ${end} exceeds total pages (${totalPages})`,
        };
      }
      for (let i = start; i <= end; i++) pages.add(i);
    } else if (/^\d+$/.test(trimmedPart)) {
      const page = Number(trimmedPart);
      if (page <= 0)
        return { pages: null, error: `Invalid page number: "${trimmedPart}"` };
      if (page > totalPages)
        return {
          pages: null,
          error: `Page ${page} exceeds total pages (${totalPages})`,
        };
      pages.add(page);
    } else {
      return { pages: null, error: `Invalid format: "${trimmedPart}"` };
    }
  }

  if (pages.size === 0) {
    return { pages: null, error: 'Please enter a valid page range.' };
  }

  return { pages: Array.from(pages).sort((a, b) => a - b), error: null };
};

export const FileUploadDialog = ({
  item,
  open,
  onOpenChange,
}: FileUploadDialogProps) => {
  const [detectionResult, setDetectionResult] = useState<DetectionData | null>(
    null,
  );
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionError, setDetectionError] = useState<string | null>(null);
  const [pageRangeError, setPageRangeError] = useState<string | null>(null);

  const { data, setData, post, processing, errors, progress, reset } = useForm({
    file: null as File | null,
    print_color: item.print_color || 'bnw',
    copies: item.copies || 1,
    pages_to_print: item.pages_to_print || '',
    price: item.price || 0,
    paper_count: item.paper_count || 0,
    total_pages: 0,
  });

  useEffect(() => {
  if (!detectionResult) return;

  const { pages, error } = parsePageRange(
    data.pages_to_print,
    detectionResult.total_pages
  );

  setPageRangeError(error);

  if (!pages || error) {
    setData(prev => ({
      ...prev,
      price: 0,
      paper_count: 0,
    }));
    return;
  }

  // Map page -> prices
  const priceMap = new Map(
    detectionResult.data.map(p => [
      p.page,
      {
        color: p.price,
        bnw: p.price_bnw,
      },
    ])
  );

  const pricePerCopy = pages.reduce((sum, page) => {
    const pagePrice = priceMap.get(page);
    if (!pagePrice) return sum;

    return sum + (
      data.print_color === 'color'
        ? pagePrice.color
        : pagePrice.bnw
    );
  }, 0);

  setData(prev => ({
    ...prev,
    price: pricePerCopy * data.copies,
    paper_count: pages.length * data.copies,
  }));
}, [
  detectionResult,
  data.pages_to_print,
  data.print_color,
  data.copies,
]);


  const fetchInitialDetection = async (file: File) => {
    setIsDetecting(true);
    setDetectionError(null);
    setDetectionResult(null);
    setPageRangeError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(api.pricing.preview().url, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(
          'Failed to analyze the file. Please check the file and try again.',
        );
      }

      const result = await response.json();

      if (!result.success || !result.data?.[0]) {
        throw new Error(
          result.message || 'Analysis failed. The file may be unsupported.',
        );
      }

      const detectionData = result;
      setDetectionResult(detectionData);

      setData((prev) => ({
        ...prev,
        file,
        pages_to_print: `1-${detectionData.total_pages}`,
        total_pages: detectionData.total_pages,
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
      fetchInitialDetection(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!data.file || pageRangeError) return;
    post(editRequest.upload({ detail: item.id }).url, {
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
    setPageRangeError(null);
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
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">
            Analyzing your file...
          </p>
        </div>
      );
    }

    if (detectionError) {
      return (
        <div className="p-10 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-destructive-foreground" />
          <p className="mt-4 text-sm text-destructive-foreground">{detectionError}</p>
          <Button variant="outline" className="mt-4" onClick={removeFile}>
            Try again
          </Button>
        </div>
      );
    }

    if (data.file && detectionResult) {
      return (
        <div>
          <div className="flex items-center justify-between rounded-md border p-4">
            <div className="flex items-center gap-2 overflow-hidden">
              <FileText className="h-6 w-6 flex-shrink-0" />
              <span className="truncate text-sm font-medium">
                {data.file.name}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={removeFile}
              disabled={processing}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="copies">Copies</Label>
                <Input
                  id="copies"
                  type="number"
                  value={data.copies}
                  onChange={(e) =>
                    setData('copies', parseInt(e.target.value) || 1)
                  }
                  min="1"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="pages_to_print">Page Range</Label>
                <Input
                  id="pages_to_print"
                  type="text"
                  value={data.pages_to_print}
                  onChange={(e) => setData('pages_to_print', e.target.value)}
                  placeholder={`e.g., 1-5, 8`}
                  className={cn(
                    pageRangeError &&
                      'border-destructive focus-visible:ring-destructive',
                  )}
                />
                {pageRangeError && (
                  <p className="text-xs text-destructive-foreground">{pageRangeError}</p>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <Label>Color Option</Label>
              <RadioGroup
                value={data.print_color}
                onValueChange={(value: 'bnw' | 'color') =>
                  setData('print_color', value)
                }
                className="mt-2 flex items-center gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="bnw" id="bnw" />
                  <Label htmlFor="bnw">Black & White</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="color" id="color" disabled={!detectionResult.data.some(p => p.price > p.price_bnw)}/>
                  <Label htmlFor="color">Color</Label>
                </div>
              </RadioGroup>
            </div>
            <Card className="bg-muted">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Estimated Price:</span>
                  <span className="text-lg font-bold">
                    Rp {data.price.toLocaleString()}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Total sheets required:</span>
                  <span>{data.paper_count} sheets</span>
                </div>
              </CardContent>
            </Card>
            {progress && (
              <Progress value={progress.percentage} className="w-full" />
            )}
            <Button
              type="submit"
              disabled={processing || !!pageRangeError}
              className="w-full"
            >
              {processing ? 'Uploading...' : 'Confirm and Upload'}
            </Button>
            {errors.file && (
              <p className="mt-2 text-sm text-red-500">{errors.file}</p>
            )}
          </form>
        </div>
      );
    }

    return (
      <div
        {...getRootProps()}
        className={cn(
          'cursor-pointer rounded-lg border-2 border-dashed p-10 text-center',
          isDragActive && 'border-primary bg-muted',
        )}
      >
        <input {...getInputProps()} />
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FilePlus />
            </EmptyMedia>
            <EmptyTitle>Drag & drop a file here</EmptyTitle>
            <EmptyDescription>
              or click to select a file to complete this edit request.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex flex-col">
        <DialogHeader>
          <DialogTitle className="pb-2">Upload new file</DialogTitle>
        </DialogHeader>
        <DialogDescription asChild className="w-full">
          {renderContent()}
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
};
