
import DashboardLayout from '@/components/layout/DashboardLayout';
import InvoiceList from '@/components/invoices/InvoiceList';
import SubscriptionGuard from '@/components/auth/SubscriptionGuard';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';

export default function InvoicesPage() {
  return (
    <DashboardLayout>
      <SubscriptionGuard>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
              <p className="text-muted-foreground">
                Create and manage your invoices
              </p>
            </div>
            <Button asChild>
              <Link to="/invoices/new">
                <Plus className="h-4 w-4 mr-2" />
                Create Invoice
              </Link>
            </Button>
          </div>
          <InvoiceList />
        </div>
      </SubscriptionGuard>
    </DashboardLayout>
  );
}
