export interface Asset {
  id: number;
  basename: string;
  pages: number;
}

export interface PrintJobDetail {
  id: number;
  print_color: 'color' | 'bnw';
  status: string;
  asset: Asset;
}

export interface Printer {
  id: number;
  name: number;
  pages_remaining: number;
  primary: boolean;
  status: "ready"| "offline" | "busy"| "unknown";

}

export interface PrintJob {
  id: number;
  customer_name: string;
  customer_number: string;
  total_price: number;
  status: PrintStatus;
  created_at: string;
  details: PrintJobDetail[];
}

export type PrintStatus =
  | 'pending_payment'
  | 'pending'
  | 'queued'
  | 'running'
  | 'completed'
  | 'partially_failed'
  | 'failed'
  | 'cancelled'