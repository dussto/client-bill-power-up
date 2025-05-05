
export type User = {
  id: string;
  email: string;
  fullName: string;
  company?: string;
  address?: string;
  phone?: string;
}

export type Client = {
  id: string;
  fullName: string;
  companyName?: string;
  email: string;
  phone?: string;
  address: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  createdAt: string;
}

export type InvoiceItem = {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export type Invoice = {
  id: string;
  clientId: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  tax?: number;
  discount?: number;
  total: number;
  notes?: string;
  status: 'draft' | 'pending' | 'paid' | 'overdue';
  createdAt: string;
}
