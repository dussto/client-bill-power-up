
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useData } from '@/context/DataContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Building,
  Edit,
  Plus,
  FileText,
} from 'lucide-react';
import { format } from 'date-fns';

export default function ClientDetailPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const { getClient, getClientInvoices } = useData();
  const navigate = useNavigate();
  
  const client = getClient(clientId || '');
  const [clientInvoices, setClientInvoices] = useState([]);
  
  useEffect(() => {
    if (!client) {
      navigate('/clients', { replace: true });
      return;
    }
    
    setClientInvoices(getClientInvoices(client.id));
  }, [client, navigate, getClientInvoices]);
  
  if (!client) {
    return null;
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch (error) {
      return dateString;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Paid</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Overdue</Badge>;
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Draft</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{client.fullName}</h1>
              {client.companyName && (
                <p className="text-muted-foreground">{client.companyName}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link to={`/clients/${client.id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Client
              </Link>
            </Button>
            <Button asChild>
              <Link to={`/invoices/new?clientId=${client.id}`}>
                <Plus className="h-4 w-4 mr-2" />
                Create Invoice
              </Link>
            </Button>
          </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
              <CardDescription>
                Contact and address details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a
                  href={`mailto:${client.email}`}
                  className="text-sm hover:underline"
                >
                  {client.email}
                </a>
              </div>
              
              {client.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={`tel:${client.phone}`}
                    className="text-sm hover:underline"
                  >
                    {client.phone}
                  </a>
                </div>
              )}
              
              {client.companyName && (
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{client.companyName}</span>
                </div>
              )}
              
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="text-sm">
                  <div>{client.address}</div>
                  {client.city && client.state && (
                    <div>{client.city}, {client.state} {client.zipCode}</div>
                  )}
                  {client.country && <div>{client.country}</div>}
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="text-xs text-muted-foreground">
                  Client since {formatDate(client.createdAt)}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Invoices</CardTitle>
                <CardDescription>
                  {clientInvoices.length} total invoices
                </CardDescription>
              </div>
              <Button asChild>
                <Link to={`/invoices/new?clientId=${client.id}`}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Invoice
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {clientInvoices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <FileText className="h-10 w-10 text-muted-foreground mb-3" />
                  <h3 className="text-lg font-medium">No invoices yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create your first invoice for this client
                  </p>
                  <Button asChild>
                    <Link to={`/invoices/new?clientId=${client.id}`}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Invoice
                    </Link>
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientInvoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>
                          <Link to={`/invoices/${invoice.id}`} className="font-medium hover:underline">
                            {invoice.invoiceNumber}
                          </Link>
                        </TableCell>
                        <TableCell>{formatDate(invoice.issueDate)}</TableCell>
                        <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                        <TableCell>${invoice.total.toFixed(2)}</TableCell>
                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
