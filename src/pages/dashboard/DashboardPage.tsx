
import { useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DashboardStats from '@/components/dashboard/DashboardStats';
import { useData } from '@/context/DataContext';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function DashboardPage() {
  const { invoices, clients } = useData();

  // Get the 5 most recent invoices
  const recentInvoices = [...invoices]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Get clients with pending invoices
  const clientsWithPendingInvoices = clients.filter(client => 
    invoices.some(invoice => 
      invoice.clientId === client.id && (invoice.status === 'pending' || invoice.status === 'overdue')
    )
  ).slice(0, 5);

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.fullName : 'Unknown Client';
  };

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
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link to="/invoices/new">Create Invoice</Link>
            </Button>
            <Button asChild>
              <Link to="/clients/new">Add Client</Link>
            </Button>
          </div>
        </div>

        <DashboardStats />

        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Invoices */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Invoices</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/invoices">View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentInvoices.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No invoices created yet
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentInvoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>
                          <Link to={`/invoices/${invoice.id}`} className="font-medium hover:underline">
                            {invoice.invoiceNumber}
                          </Link>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(invoice.issueDate)}
                          </div>
                        </TableCell>
                        <TableCell>{getClientName(invoice.clientId)}</TableCell>
                        <TableCell>${invoice.total.toFixed(2)}</TableCell>
                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Clients with Pending Invoices */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Clients with Pending Invoices</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/clients">View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {clientsWithPendingInvoices.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No clients with pending invoices
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientsWithPendingInvoices.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell>
                          <Link to={`/clients/${client.id}`} className="font-medium hover:underline">
                            {client.fullName}
                          </Link>
                          {client.companyName && (
                            <div className="text-xs text-muted-foreground">
                              {client.companyName}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <a
                            href={`mailto:${client.email}`}
                            className="text-sm hover:underline text-muted-foreground"
                          >
                            {client.email}
                          </a>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/invoices/new?clientId=${client.id}`}>
                              Send Invoice
                            </Link>
                          </Button>
                        </TableCell>
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
