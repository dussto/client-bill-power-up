
import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Client, Invoice, User } from '@/types';
import { useAuth } from './AuthContext';
import { DataContextProps, InvoiceSettings } from './DataContextTypes';
import { createClientOperations } from './clientOperations';
import { createInvoiceOperations } from './invoiceOperations';
import { generateMockClients, generateMockInvoices } from '@/utils/mockDataGenerator';

const DataContext = createContext<DataContextProps | undefined>(undefined);

const defaultInvoiceSettings: InvoiceSettings = {
  fullName: '',
  email: '',
  phone: '',
  address: '',
  isCompany: false,
  companyName: '',
  logo: '',
  invoicePrefix: 'INV',
  invoiceNumberingScheme: 'year-number',
};

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings>(defaultInvoiceSettings);
  const { user } = useAuth();

  useEffect(() => {
    // Load saved data or initialize with mock data
    if (user) {
      const savedClients = localStorage.getItem(`invoice_app_clients_${user.id}`);
      const savedInvoices = localStorage.getItem(`invoice_app_invoices_${user.id}`);
      const savedInvoiceSettings = localStorage.getItem(`invoice_app_settings_${user.id}`);
      
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
      
      if (savedInvoiceSettings) {
        setInvoiceSettings(JSON.parse(savedInvoiceSettings));
      } else {
        const initialSettings = {
          ...defaultInvoiceSettings,
          fullName: user?.fullName || '',
          email: user?.email || '',
          companyName: user?.company || '',
        };
        setInvoiceSettings(initialSettings);
        localStorage.setItem(`invoice_app_settings_${user.id}`, JSON.stringify(initialSettings));
      }
    } else {
      // Clear data when logged out
      setClients([]);
      setInvoices([]);
      setInvoiceSettings(defaultInvoiceSettings);
    }
  }, [user]);

  // Save data whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem(`invoice_app_clients_${user.id}`, JSON.stringify(clients));
      localStorage.setItem(`invoice_app_invoices_${user.id}`, JSON.stringify(invoices));
      localStorage.setItem(`invoice_app_settings_${user.id}`, JSON.stringify(invoiceSettings));
    }
  }, [clients, invoices, invoiceSettings, user]);

  // Create operations
  const clientOps = createClientOperations(clients, setClients, invoices);
  const invoiceOps = createInvoiceOperations(invoices, setInvoices);

  // Get the current user
  const getUser = () => {
    return user;
  };
  
  // Update invoice settings
  const updateInvoiceSettings = (settings: Partial<InvoiceSettings>) => {
    setInvoiceSettings(prev => ({ ...prev, ...settings }));
  };

  return (
    <DataContext.Provider 
      value={{ 
        clients, 
        invoices, 
        ...clientOps,
        ...invoiceOps,
        getUser,
        invoiceSettings,
        updateInvoiceSettings,
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
