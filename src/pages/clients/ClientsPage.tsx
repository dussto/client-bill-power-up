
import DashboardLayout from '@/components/layout/DashboardLayout';
import ClientList from '@/components/clients/ClientList';

export default function ClientsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground">
            Manage your clients and their contact information
          </p>
        </div>
        
        <ClientList />
      </div>
    </DashboardLayout>
  );
}
