
import { Invoice } from '@/types';

export interface InvoiceOperations {
  addInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt'>) => Invoice;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => Invoice | null;
  deleteInvoice: (id: string) => boolean;
  getInvoice: (id: string) => Invoice | undefined;
  getClientInvoices: (clientId: string) => Invoice[];
}

export const createInvoiceOperations = (
  invoices: Invoice[],
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>
): InvoiceOperations => {
  // Invoice operations
  const addInvoice = (invoiceData: Omit<Invoice, 'id' | 'createdAt'>) => {
    const newInvoice: Invoice = {
      ...invoiceData,
      id: `invoice-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    
    setInvoices(prev => [...prev, newInvoice]);
    return newInvoice;
  };

  const updateInvoice = (id: string, invoiceData: Partial<Invoice>) => {
    let updatedInvoice: Invoice | null = null;
    
    setInvoices(prev => {
      return prev.map(invoice => {
        if (invoice.id === id) {
          updatedInvoice = { ...invoice, ...invoiceData };
          return updatedInvoice;
        }
        return invoice;
      });
    });
    
    return updatedInvoice;
  };

  const deleteInvoice = (id: string) => {
    setInvoices(prev => prev.filter(invoice => invoice.id !== id));
    return true;
  };

  const getInvoice = (id: string) => {
    return invoices.find(invoice => invoice.id === id);
  };

  const getClientInvoices = (clientId: string) => {
    return invoices.filter(invoice => invoice.clientId === clientId);
  };

  return {
    addInvoice,
    updateInvoice,
    deleteInvoice,
    getInvoice,
    getClientInvoices,
  };
};
