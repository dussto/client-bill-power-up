
import { Client, Invoice, User } from '@/types';

export interface InvoiceSettings {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  isCompany: boolean;
  companyName: string;
  logo: string;
  invoicePrefix: string;
  invoiceNumberingScheme: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

export interface DataContextProps {
  clients: Client[];
  invoices: Invoice[];
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => Client;
  updateClient: (id: string, client: Partial<Client>) => Client | null;
  deleteClient: (id: string) => boolean;
  getClient: (id: string) => Client | undefined;
  addInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt'>) => Invoice;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => Invoice | null;
  deleteInvoice: (id: string) => boolean;
  getInvoice: (id: string) => Invoice | undefined;
  getClientInvoices: (clientId: string) => Invoice[];
  getUser: () => User | null;
  invoiceSettings: InvoiceSettings;
  updateInvoiceSettings: (settings: Partial<InvoiceSettings>) => void;
  emailTemplates: EmailTemplate[];
  updateEmailTemplate: (id: string, template: Partial<EmailTemplate>) => void;
  addEmailTemplate: (template: Omit<EmailTemplate, 'id'>) => EmailTemplate;
  deleteEmailTemplate: (id: string) => boolean;
  getEmailTemplate: (id: string) => EmailTemplate | undefined;
}
