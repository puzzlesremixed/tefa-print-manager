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
  paper_remaining: number;
  primary: boolean;
  status: "ready" | "offline" | "busy";
  paper_sizes: string[];

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