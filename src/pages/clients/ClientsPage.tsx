
import DashboardLayout from '@/components/layout/DashboardLayout';
import ClientList from '@/components/clients/ClientList';
import SubscriptionGuard from '@/components/auth/SubscriptionGuard';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';

export default function ClientsPage() {
  return (
    <DashboardLayout>
      <SubscriptionGuard>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
              <p className="text-muted-foreground">
                Manage your client database
              </p>
            </div>
            <Button asChild>
              <Link to="/clients/new">
                <Plus className="h-4 w-4 mr-2" />
                Add Client
              </Link>
            </Button>
          </div>
          <ClientList />
        </div>
      </SubscriptionGuard>
    </DashboardLayout>
  );
}
