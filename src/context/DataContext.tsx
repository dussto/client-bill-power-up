
import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Client, Invoice, User } from '@/types';
import { useAuth } from './AuthContext';
import { DataContextProps } from './DataContextTypes';
import { createClientOperations } from './clientOperations';
import { createInvoiceOperations } from './invoiceOperations';
import { generateMockClients, generateMockInvoices } from '@/utils/mockDataGenerator';

const DataContext = createContext<DataContextProps | undefined>(undefined);

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

  // Create operations
  const clientOps = createClientOperations(clients, setClients, invoices);
  const invoiceOps = createInvoiceOperations(invoices, setInvoices);

  // Get the current user
  const getUser = () => {
    return user;
  };

  return (
    <DataContext.Provider 
      value={{ 
        clients, 
        invoices, 
        ...clientOps,
        ...invoiceOps,
        getUser,
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
