
import { Client, Invoice } from '@/types';

export interface ClientOperations {
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => Client;
  updateClient: (id: string, client: Partial<Client>) => Client | null;
  deleteClient: (id: string) => boolean;
  getClient: (id: string) => Client | undefined;
}

export const createClientOperations = (
  clients: Client[],
  setClients: React.Dispatch<React.SetStateAction<Client[]>>,
  invoices: Invoice[]
): ClientOperations => {
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

  return {
    addClient,
    updateClient,
    deleteClient,
    getClient,
  };
};
