import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Client, Invoice, User } from '@/types';
import { useAuth } from './AuthContext';

interface DataContextProps {
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
  getUser: () => User | null; // Added the getUser function to the interface
}

const DataContext = createContext<DataContextProps | undefined>(undefined);

// Mock data generation
const generateMockClients = (): Client[] => {
  return [
    {
      id: 'client-1',
      fullName: 'John Smith',
      companyName: 'Acme Corporation',
      email: 'john@acmecorp.com',
      phone: '(555) 123-4567',
      address: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'client-2',
      fullName: 'Jane Doe',
      companyName: 'Globex Industries',
      email: 'jane@globex.com',
      phone: '(555) 987-6543',
      address: '456 Broadway',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94105',
      country: 'USA',
      createdAt: new Date().toISOString(),
    },
  ];
};

const generateMockInvoices = (): Invoice[] => {
  return [
    {
      id: 'invoice-1',
      clientId: 'client-1',
      invoiceNumber: 'INV-2023-001',
      issueDate: '2023-05-01',
      dueDate: '2023-05-15',
      items: [
        {
          id: 'item-1',
          description: 'Web Design Services',
          quantity: 1,
          rate: 1200,
          amount: 1200,
        },
        {
          id: 'item-2',
          description: 'Hosting (Annual)',
          quantity: 1,
          rate: 300,
          amount: 300,
        },
      ],
      subtotal: 1500,
      tax: 0,
      total: 1500,
      notes: 'Thank you for your business!',
      status: 'paid',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'invoice-2',
      clientId: 'client-2',
      invoiceNumber: 'INV-2023-002',
      issueDate: '2023-05-10',
      dueDate: '2023-05-24',
      items: [
        {
          id: 'item-3',
          description: 'SEO Consultation',
          quantity: 5,
          rate: 150,
          amount: 750,
        },
      ],
      subtotal: 750,
      tax: 75,
      total: 825,
      status: 'pending',
      createdAt: new Date().toISOString(),
    },
  ];
};

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    // Load saved data or initialize with mock data
    if (user) {
      const savedClients = localStorage.getItem(`invoice_app_clients_${user.id}`);
      const savedInvoices = localStorage.getItem(`invoice_app_invoices_${user.id}`);
      
      if (savedClients) {
        setClients(JSON.parse(savedClients));
      } else {
        const mockClients = generateMockClients();
        setClients(mockClients);
        localStorage.setItem(`invoice_app_clients_${user.id}`, JSON.stringify(mockClients));
      }
      
      if (savedInvoices) {
        setInvoices(JSON.parse(savedInvoices));
      } else {
        const mockInvoices = generateMockInvoices();
        setInvoices(mockInvoices);
        localStorage.setItem(`invoice_app_invoices_${user.id}`, JSON.stringify(mockInvoices));
      }
    } else {
      // Clear data when logged out
      setClients([]);
      setInvoices([]);
    }
  }, [user]);

  // Save data whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem(`invoice_app_clients_${user.id}`, JSON.stringify(clients));
      localStorage.setItem(`invoice_app_invoices_${user.id}`, JSON.stringify(invoices));
    }
  }, [clients, invoices, user]);

  // Client operations
  const addClient = (clientData: Omit<Client, 'id' | 'createdAt'>) => {
    const newClient: Client = {
      ...clientData,
      id: `client-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    
    setClients(prev => [...prev, newClient]);
    return newClient;
  };

  const updateClient = (id: string, clientData: Partial<Client>) => {
    let updatedClient: Client | null = null;
    
    setClients(prev => {
      return prev.map(client => {
        if (client.id === id) {
          updatedClient = { ...client, ...clientData };
          return updatedClient;
        }
        return client;
      });
    });
    
    return updatedClient;
  };

  const deleteClient = (id: string) => {
    // First check if client has invoices
    const hasInvoices = invoices.some(invoice => invoice.clientId === id);
    
    if (hasInvoices) {
      return false; // Can't delete a client with invoices
    }
    
    setClients(prev => prev.filter(client => client.id !== id));
    return true;
  };

  const getClient = (id: string) => {
    return clients.find(client => client.id === id);
  };

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

  // Get the current user
  const getUser = () => {
    return user;
  };

  return (
    <DataContext.Provider 
      value={{ 
        clients, 
        invoices, 
        addClient, 
        updateClient, 
        deleteClient, 
        getClient,
        addInvoice,
        updateInvoice,
        deleteInvoice,
        getInvoice,
        getClientInvoices,
        getUser, // Add the getUser function to the context value
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  
  return context;
};
