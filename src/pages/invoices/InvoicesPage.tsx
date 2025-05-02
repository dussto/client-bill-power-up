
import DashboardLayout from '@/components/layout/DashboardLayout';
import InvoiceList from '@/components/invoices/InvoiceList';

export default function InvoicesPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">
            Manage your invoices and track payments
          </p>
        </div>
        
        <InvoiceList />
      </div>
    </DashboardLayout>
  );
}
