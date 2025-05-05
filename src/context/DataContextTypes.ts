
import { Client, Invoice, User } from '@/types';

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
}
