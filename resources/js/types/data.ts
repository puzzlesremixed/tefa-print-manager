export interface Asset {
  id: number;
  basename: string;
  path: string;
  filename: string;
  extension: string;
  pages: number;
}


export interface PrintJobDetail {
   id: string;
  asset: Asset;
  modified_asset: Asset;
  paper_count: number | null;
  copies: number;
  paper_size: string | null;
  scale: string | null;
  side: string | null;
  pages_to_print: string | null;
  monochrome_pages: string | null;
  print_color: 'color' | 'bnw' | 'full_color';
  price: number;
  status:PrintStatus;
  edit_notes: string | null;
  logs?: PrintJobLog[];
}

interface PrintJobLog {
  id: string;
  detail_id: string;
  status: PrintStatus;

  message: string | null;
  created_at: string;
  updated_at: string;
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
  total_pages: number;
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
  colorserv_endpoint: string
  mobilekiosk_endpoint: string
  whatsappbot_endpoint: string
  temp_duration: number
  delete_files: boolean
}

export interface Prices {
  bnw: number
  color: number
  full_color: number
}

export const PrinterStatusMap : Record<string, string> = {
  'offline' : 'Offline',
  'ready' : 'Ready',
  'busy' : 'Busy',
}

export interface ApiRequestLogProperties {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS';
  path: string;
  url: string;
  status: number;
  ip: string | null;
  duration: number;
  request: {
    query: Record<string, string | string[]>
    payload: Record<string, unknown>
  }
  route?: string | null;
  response?: ApiErrorResponse | string;
}

export interface ApiErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
  [key: string]: unknown;
}

export interface ActivityLog<TProperties> {
  id: number
  log_name: string
  description: string
  causer_id: number | null
  properties: TProperties
  created_at: string
}

export interface LaravelPagination<T> {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export type ApiRequestLog = ActivityLog<ApiRequestLogProperties>
