
import { Client, Invoice } from '@/types';

// Mock data generation
export const generateMockClients = (): Client[] => {
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

export const generateMockInvoices = (): Invoice[] => {
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
