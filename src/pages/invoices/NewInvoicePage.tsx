
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import InvoiceForm from '@/components/invoices/InvoiceForm';

export default function NewInvoicePage() {
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get('clientId');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Invoice</h1>
          <p className="text-muted-foreground">
            Create a new invoice for your client
          </p>
        </div>
        
        <InvoiceForm defaultClientId={clientId || undefined} />
      </div>
    </DashboardLayout>
  );
}
