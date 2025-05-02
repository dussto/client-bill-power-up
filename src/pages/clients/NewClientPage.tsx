
import DashboardLayout from '@/components/layout/DashboardLayout';
import ClientForm from '@/components/clients/ClientForm';

export default function NewClientPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New Client</h1>
          <p className="text-muted-foreground">
            Create a new client profile
          </p>
        </div>
        
        <ClientForm />
      </div>
    </DashboardLayout>
  );
}
