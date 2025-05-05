
import { Card, CardContent } from '@/components/ui/card';
import { Invoice, User, Client } from '@/types';
import { formatDate, getStatusBadge } from './InvoiceHeader';
import { Check, Clock, AlertTriangle } from 'lucide-react';
import { forwardRef } from 'react';

interface InvoiceContentProps {
  invoice: Invoice;
  client: Client;
  currentUser: User | null;
}

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

const InvoiceContent = forwardRef<HTMLDivElement, InvoiceContentProps>(
  ({ invoice, client, currentUser }, ref) => {
    return (
      <Card>
        <CardContent className="p-6" ref={ref}>
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
            
            {/* From and To Information */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">From:</p>
                <p className="font-medium">{currentUser?.fullName}</p>
                {currentUser?.company && <p>{currentUser.company}</p>}
                {currentUser?.address && <p>{currentUser.address}</p>}
                {currentUser?.email && <p>{currentUser.email}</p>}
                {currentUser?.phone && <p>{currentUser.phone}</p>}
              </div>
              
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
            </div>
            
            {/* Invoice Details */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <div className="grid grid-cols-2">
                  <p className="text-sm text-muted-foreground">Invoice Number:</p>
                  <p>#{invoice.invoiceNumber}</p>
                </div>
                <div className="grid grid-cols-2">
                  <p className="text-sm text-muted-foreground">Invoice Date:</p>
                  <p>{formatDate(invoice.issueDate)}</p>
                </div>
                <div className="grid grid-cols-2">
                  <p className="text-sm text-muted-foreground">Due Date:</p>
                  <p>{formatDate(invoice.dueDate)}</p>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="grid grid-cols-2">
                  <p className="text-sm text-muted-foreground">Status:</p>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(invoice.status)}
                    <span className="capitalize">{invoice.status}</span>
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
    );
  }
);

InvoiceContent.displayName = "InvoiceContent";

export default InvoiceContent;
