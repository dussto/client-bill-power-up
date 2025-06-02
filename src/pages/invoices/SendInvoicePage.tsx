
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useData } from '@/context/DataContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import SendInvoiceForm from '@/components/invoices/SendInvoiceForm';

export default function SendInvoicePage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const { getInvoice, getClient, updateInvoice, getUser } = useData();
  const navigate = useNavigate();
  
  const [pageLoaded, setPageLoaded] = useState(false);
  const [invoice, setInvoice] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const currentUser = getUser();

  // Load invoice data
  useEffect(() => {
    const initializeInvoice = () => {
      if (!invoiceId) {
        navigate('/invoices', { replace: true });
        return;
      }
      
      const invoiceData = getInvoice(invoiceId);
      if (!invoiceData) {
        navigate('/invoices', { replace: true });
        return;
      }
      
      setInvoice(invoiceData);
      
      const clientData = getClient(invoiceData.clientId);
      if (!clientData) {
        navigate('/invoices', { replace: true });
        return;
      }
      
      setClient(clientData);
      setPageLoaded(true);
    };
    
    initializeInvoice();
  }, [invoiceId, getInvoice, getClient, navigate]);

  if (!pageLoaded) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Send Invoice #{invoice?.invoiceNumber}
            </h1>
            <p className="text-muted-foreground">
              Send the invoice to {client?.fullName}
            </p>
          </div>
        </div>
        
        <SendInvoiceForm
          invoice={invoice}
          client={client}
          currentUser={currentUser}
          updateInvoice={updateInvoice}
        />
      </div>
    </DashboardLayout>
  );
}
