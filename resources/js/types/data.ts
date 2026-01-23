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

export interface PrintJob {
  id: number;
  customer_name: string;
  customer_number: string;
  total_price: number;
  status: string;
  created_at: string;
  details: PrintJobDetail[];
}

