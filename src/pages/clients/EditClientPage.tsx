
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ClientForm from '@/components/clients/ClientForm';
import { useData } from '@/context/DataContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';

export default function EditClientPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const { getClient } = useData();
  const navigate = useNavigate();
  
  const client = getClient(clientId || '');
  
  useEffect(() => {
    if (!client) {
      navigate('/clients', { replace: true });
    }
  }, [client, navigate]);
  
  if (!client) {
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
            <h1 className="text-3xl font-bold tracking-tight">Edit Client</h1>
            <p className="text-muted-foreground">
              Update client information
            </p>
          </div>
        </div>
        
        <ClientForm client={client} />
      </div>
    </DashboardLayout>
  );
}
