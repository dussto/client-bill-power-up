
import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Client, Invoice, User } from '@/types';
import { useAuth } from './AuthContext';
import { DataContextProps, EmailTemplate, InvoiceSettings } from './DataContextTypes';
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

const defaultEmailTemplates: EmailTemplate[] = [
  {
    id: 'new-invoice',
    name: 'New Invoice',
    subject: 'New Invoice #{{invoiceNumber}} from {{companyName}}',
    body: 'Dear {{clientName}},\n\nPlease find attached invoice #{{invoiceNumber}} for ${{amount}}.\n\nPayment is due by {{dueDate}}.\n\nThank you for your business.\n\nSincerely,\n{{userName}}\n{{companyName}}'
  },
  {
    id: 'payment-reminder',
    name: 'Payment Reminder',
    subject: 'Reminder: Invoice #{{invoiceNumber}} Payment Due',
    body: 'Dear {{clientName}},\n\nThis is a friendly reminder that payment for invoice #{{invoiceNumber}} in the amount of ${{amount}} is due on {{dueDate}}.\n\nIf you have already made the payment, please disregard this message.\n\nThank you for your business.\n\nSincerely,\n{{userName}}\n{{companyName}}'
  },
  {
    id: 'payment-received',
    name: 'Payment Received',
    subject: 'Payment Received for Invoice #{{invoiceNumber}}',
    body: 'Dear {{clientName}},\n\nThank you for your payment of ${{amount}} for invoice #{{invoiceNumber}}.\n\nWe appreciate your business.\n\nSincerely,\n{{userName}}\n{{companyName}}'
  }
];

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings>(defaultInvoiceSettings);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>(defaultEmailTemplates);
  const { user } = useAuth();

  useEffect(() => {
    // Load saved data or initialize with mock data
    if (user) {
      const savedClients = localStorage.getItem(`invoice_app_clients_${user.id}`);
      const savedInvoices = localStorage.getItem(`invoice_app_invoices_${user.id}`);
      const savedInvoiceSettings = localStorage.getItem(`invoice_app_settings_${user.id}`);
      const savedEmailTemplates = localStorage.getItem(`invoice_app_email_templates_${user.id}`);
      
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
      
      if (savedEmailTemplates) {
        setEmailTemplates(JSON.parse(savedEmailTemplates));
      } else {
        localStorage.setItem(`invoice_app_email_templates_${user.id}`, JSON.stringify(defaultEmailTemplates));
      }
    } else {
      // Clear data when logged out
      setClients([]);
      setInvoices([]);
      setInvoiceSettings(defaultInvoiceSettings);
      setEmailTemplates(defaultEmailTemplates);
    }
  }, [user]);

  // Save data whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem(`invoice_app_clients_${user.id}`, JSON.stringify(clients));
      localStorage.setItem(`invoice_app_invoices_${user.id}`, JSON.stringify(invoices));
      localStorage.setItem(`invoice_app_settings_${user.id}`, JSON.stringify(invoiceSettings));
      localStorage.setItem(`invoice_app_email_templates_${user.id}`, JSON.stringify(emailTemplates));
    }
  }, [clients, invoices, invoiceSettings, emailTemplates, user]);

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
  
  // Email template operations
  const addEmailTemplate = (templateData: Omit<EmailTemplate, 'id'>) => {
    const newTemplate: EmailTemplate = {
      ...templateData,
      id: `template-${Date.now()}`,
    };
    
    setEmailTemplates(prev => [...prev, newTemplate]);
    return newTemplate;
  };
  
  const updateEmailTemplate = (id: string, templateData: Partial<EmailTemplate>) => {
    setEmailTemplates(prev => 
      prev.map(template => 
        template.id === id ? { ...template, ...templateData } : template
      )
    );
  };
  
  const deleteEmailTemplate = (id: string) => {
    // Don't allow deletion of default templates
    if (['new-invoice', 'payment-reminder', 'payment-received'].includes(id)) {
      return false;
    }
    
    setEmailTemplates(prev => prev.filter(template => template.id !== id));
    return true;
  };
  
  const getEmailTemplate = (id: string) => {
    return emailTemplates.find(template => template.id === id);
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
        emailTemplates,
        addEmailTemplate,
        updateEmailTemplate,
        deleteEmailTemplate,
        getEmailTemplate,
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
