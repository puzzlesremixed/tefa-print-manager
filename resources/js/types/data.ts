export interface Asset {
  id: number;
  basename: string;
  pages: number;
}

export interface PrintJobDetail {
   id: string;
  asset_id: string;
  paper_count: number | null;
  copies: number;
  paper_size: string | null;
  scale: string | null;
  side: string | null;
  pages_to_print: string | null;
  monochrome_pages: string | null;
  print_color: 'color' | 'bnw' | 'full_color';
  price: number;
  status: 'pending' | 'queued' | 'printing' | 'completed' | 'failed' | 'cancelled' | 'request_edit';
  edit_notes: string | null;
  logs?: PrintJobLog[];
}

interface PrintJobLog {
  id: string;
  detail_id: string;
  status: string;
  message: string | null;
  created_at: string;
}

export interface Printer {
  id: number;
  name: number;
  paper_remaining: number;
  primary: boolean;
  status: "ready" | "offline" | "busy";
  paper_sizes: string[];

}

export interface PrintJob {
  id: string;
  customer_number: string;
  customer_name: string;
  total_price: number;
  paid_at: string | null;
  status: PrintStatus;
  created_at: string;
  details: PrintJobDetail[];
}

export type PrintStatus =
  | 'pending_payment'
  | 'request_edit'
  | 'pending'
  | 'queued'
  | 'running'
  | 'completed'
  | 'partially_failed'
  | 'failed'
  | 'cancelled'

export interface Configuration {
  value: ConfigValue
  primary: boolean
}

export interface ConfigValue {

  prices: Prices
  prinserv_endpoint: string
  mobilekiosk_endpoint: string
  whatsappbot_endpoint: string
  temp_duration: number
  delete_files: boolean
}

export interface Prices {
  bnw: number
  color: number
}

export const PrinterStatusMap : Record<string, string> = {
  'offline' : 'Offline',
  'ready' : 'Ready',
  'busy' : 'Busy',
}