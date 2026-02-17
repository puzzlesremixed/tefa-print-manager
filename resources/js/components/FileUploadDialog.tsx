import { PrintJobDetail } from "@/types/data";
import editRequest from '@/routes/edit-request';
import { useForm } from '@inertiajs/react';
import {
  Dispatch,
  
  FormEvent,
  SetStateAction,
  useCallback,
  useState,
} from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useDropzone } from 'react-dropzone';
import api from "@/routes/api";
import { AlertCircle, FilePlus, FileText, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
} from '@/components/ui/card';

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

interface FileUploadDialogProps {
  item: PrintJobDetail;
  open: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
}

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

  const { data, setData, post, processing, errors, progress, reset } = useForm({
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
      const response = await fetch(api.pricing.preview().url, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to analyze the file.');

      const result = await response.json();

      if (!result.success)
        throw new Error(result.message || 'Analysis failed.');
      
      setDetectionResult({
        colors: result.colors,
        total_pages: result.total_pages,
        total_price: result.price,
        type: result.type,
      });
      console.log(detectionResult);
      
      setData((prev) => ({
        ...prev,
        file: file,
        pages_to_print: `1-${result.total_pages}`,
        total_pages: result.total_pages,
        price: result.price ?? 0
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
      fetchDetection(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!data.file) return;
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
          <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
          <p className="mt-4 text-sm text-destructive">{detectionError}</p>
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
              <div>
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
              <div>
                <Label htmlFor="pages_to_print">Page Range</Label>
                <Input
                  id="pages_to_print"
                  type="text"
                  value={data.pages_to_print}
                  onChange={(e) => setData('pages_to_print', e.target.value)}
                  placeholder={`e.g., 1-5, 8, 11-13`}
                />
              </div>
            </div>
            <div>
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
                  <RadioGroupItem value="color" id="color" />
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
            <Button type="submit" disabled={processing} className="w-full">
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