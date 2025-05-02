
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useData } from '@/context/DataContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Edit,
  Printer,
  Send,
  Clock,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function InvoiceDetailPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const { getInvoice, getClient, updateInvoice } = useData();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const invoice = getInvoice(invoiceId || '');
  const [client, setClient] = useState(null);
  
  useEffect(() => {
    if (!invoice) {
      navigate('/invoices', { replace: true });
      return;
    }
    
    setClient(getClient(invoice.clientId));
  }, [invoice, navigate, getClient]);
  
  if (!invoice || !client) {
    return null;
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch (error) {
      return dateString;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <Check className="h-5 w-5 text-green-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'overdue':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return null;
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

  const handleSendInvoice = () => {
    // In a real app, this would send the invoice via email
    toast({
      title: "Invoice sent",
      description: `Invoice #${invoice.invoiceNumber} has been sent to ${client.email}`,
    });
  };

  const handleMarkAsPaid = () => {
    updateInvoice(invoice.id, { status: 'paid' });
    toast({
      title: "Invoice marked as paid",
      description: `Invoice #${invoice.invoiceNumber} has been marked as paid`,
    });
  };

  const handleMarkAsPending = () => {
    updateInvoice(invoice.id, { status: 'pending' });
    toast({
      title: "Invoice status updated",
      description: `Invoice #${invoice.invoiceNumber} has been marked as pending`,
    });
  };

  const handleSendReminder = () => {
    // In a real app, this would send a reminder email
    toast({
      title: "Payment reminder sent",
      description: `A payment reminder for invoice #${invoice.invoiceNumber} has been sent to ${client.email}`,
    });
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
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight">
                  Invoice #{invoice.invoiceNumber}
                </h1>
                {getStatusBadge(invoice.status)}
              </div>
              <p className="text-muted-foreground">
                Issued on {formatDate(invoice.issueDate)} • Due on {formatDate(invoice.dueDate)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link to={`/invoices/${invoice.id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>
            <Button variant="outline">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button onClick={handleSendInvoice}>
              <Send className="h-4 w-4 mr-2" />
              Send Invoice
            </Button>
          </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Invoice Header */}
                <div className="flex justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Invoice</h2>
                    <p className="text-muted-foreground">#{invoice.invoiceNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">Total Amount</p>
                    <p className="text-2xl font-bold">${invoice.total.toFixed(2)}</p>
                  </div>
                </div>
                
                {/* Client & Dates */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Bill To:</p>
                    <p className="font-medium">{client.fullName}</p>
                    {client.companyName && <p>{client.companyName}</p>}
                    <p>{client.address}</p>
                    {client.city && (
                      <p>
                        {client.city}, {client.state} {client.zipCode}
                      </p>
                    )}
                    {client.country && <p>{client.country}</p>}
                    <p>{client.email}</p>
                    {client.phone && <p>{client.phone}</p>}
                  </div>
                  
                  <div>
                    <div className="space-y-1">
                      <div className="grid grid-cols-2">
                        <p className="text-sm text-muted-foreground">Invoice Date:</p>
                        <p>{formatDate(invoice.issueDate)}</p>
                      </div>
                      <div className="grid grid-cols-2">
                        <p className="text-sm text-muted-foreground">Due Date:</p>
                        <p>{formatDate(invoice.dueDate)}</p>
                      </div>
                      <div className="grid grid-cols-2">
                        <p className="text-sm text-muted-foreground">Status:</p>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(invoice.status)}
                          <span className="capitalize">{invoice.status}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Invoice Items */}
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm">Description</th>
                        <th className="px-4 py-2 text-right text-sm w-24">Qty</th>
                        <th className="px-4 py-2 text-right text-sm w-32">Rate</th>
                        <th className="px-4 py-2 text-right text-sm w-32">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.items.map((item) => (
                        <tr key={item.id} className="border-t">
                          <td className="px-4 py-3">{item.description}</td>
                          <td className="px-4 py-3 text-right">{item.quantity}</td>
                          <td className="px-4 py-3 text-right">${item.rate.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right">${item.amount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t">
                        <td colSpan={3} className="px-4 py-3 text-right font-medium">
                          Subtotal
                        </td>
                        <td className="px-4 py-3 text-right">
                          ${invoice.subtotal.toFixed(2)}
                        </td>
                      </tr>
                      {invoice.tax > 0 && (
                        <tr>
                          <td colSpan={3} className="px-4 py-3 text-right font-medium">
                            Tax
                          </td>
                          <td className="px-4 py-3 text-right">
                            ${invoice.tax.toFixed(2)}
                          </td>
                        </tr>
                      )}
                      {invoice.discount > 0 && (
                        <tr>
                          <td colSpan={3} className="px-4 py-3 text-right font-medium">
                            Discount
                          </td>
                          <td className="px-4 py-3 text-right">
                            -${invoice.discount.toFixed(2)}
                          </td>
                        </tr>
                      )}
                      <tr className="border-t">
                        <td colSpan={3} className="px-4 py-3 text-right font-medium">
                          Total
                        </td>
                        <td className="px-4 py-3 text-right font-bold">
                          ${invoice.total.toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                
                {/* Notes */}
                {invoice.notes && (
                  <div className="space-y-2">
                    <p className="font-medium">Notes</p>
                    <p className="text-muted-foreground">{invoice.notes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-medium">Actions</h3>
                
                <div className="space-y-3">
                  {invoice.status !== 'paid' && (
                    <Button onClick={handleMarkAsPaid} className="w-full">
                      <Check className="h-4 w-4 mr-2" />
                      Mark as Paid
                    </Button>
                  )}
                  
                  {invoice.status === 'paid' && (
                    <Button onClick={handleMarkAsPending} className="w-full" variant="outline">
                      <Clock className="h-4 w-4 mr-2" />
                      Mark as Pending
                    </Button>
                  )}
                  
                  <Button onClick={handleSendInvoice} className="w-full" variant="outline">
                    <Send className="h-4 w-4 mr-2" />
                    Send Invoice
                  </Button>
                  
                  {(invoice.status === 'pending' || invoice.status === 'overdue') && (
                    <Button onClick={handleSendReminder} className="w-full" variant="outline">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Send Reminder
                    </Button>
                  )}
                  
                  <Button asChild className="w-full" variant="outline">
                    <Link to={`/invoices/${invoice.id}/edit`}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Invoice
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Client</h3>
                  
                  <div className="space-y-2">
                    <p className="font-medium">{client.fullName}</p>
                    {client.companyName && <p>{client.companyName}</p>}
                    <a
                      href={`mailto:${client.email}`}
                      className="text-primary hover:underline"
                    >
                      {client.email}
                    </a>
                    {client.phone && (
                      <p>
                        <a href={`tel:${client.phone}`} className="hover:underline">
                          {client.phone}
                        </a>
                      </p>
                    )}
                  </div>
                  
                  <Button asChild variant="outline" className="w-full">
                    <Link to={`/clients/${client.id}`}>
                      View Client Details
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
