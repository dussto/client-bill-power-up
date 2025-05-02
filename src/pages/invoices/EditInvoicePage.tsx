
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import InvoiceForm from '@/components/invoices/InvoiceForm';
import { useData } from '@/context/DataContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';

export default function EditInvoicePage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const { getInvoice } = useData();
  const navigate = useNavigate();
  
  const invoice = getInvoice(invoiceId || '');
  
  useEffect(() => {
    if (!invoice) {
      navigate('/invoices', { replace: true });
    }
  }, [invoice, navigate]);
  
  if (!invoice) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Invoice</h1>
            <p className="text-muted-foreground">
              Update invoice #{invoice.invoiceNumber}
            </p>
          </div>
        </div>
        
        <InvoiceForm invoice={invoice} />
      </div>
    </DashboardLayout>
  );
}
