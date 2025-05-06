
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '@/context/DataContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, CreditCard, ArrowLeft, CalendarCheck, Building, User } from 'lucide-react';
import { format } from 'date-fns';

export default function PaymentPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const { getInvoice, getClient, invoiceSettings } = useData();
  const [invoice, setInvoice] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  
  useEffect(() => {
    if (invoiceId) {
      const foundInvoice = getInvoice(invoiceId);
      if (foundInvoice) {
        setInvoice(foundInvoice);
        const foundClient = getClient(foundInvoice.clientId);
        if (foundClient) {
          setClient(foundClient);
        }
      }
    }
  }, [invoiceId, getInvoice, getClient]);
  
  const handlePayNow = () => {
    setIsLoading(true);
    setPaymentStatus('processing');
    
    // Simulate payment processing
    setTimeout(() => {
      // This would be replaced with actual Stripe checkout in a real implementation
      const randomSuccess = Math.random() > 0.2; // 80% success rate for demo
      setPaymentStatus(randomSuccess ? 'success' : 'error');
      setIsLoading(false);
    }, 2000);
  };
  
  if (!invoice || !client) {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="border-b">
          <div className="container flex h-16 items-center px-4 sm:px-6 lg:px-8">
            <Link to="/" className="flex items-center">
              <span className="text-xl font-bold">Invoice Creator</span>
            </Link>
          </div>
        </header>
        <main className="flex-1 container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Invoice Not Found</CardTitle>
              <CardDescription>
                The invoice you are looking for could not be found or has been removed.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button asChild className="w-full">
                <Link to="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Return Home
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </main>
      </div>
    );
  }
  
  const formattedDate = format(new Date(invoice.dueDate), 'MMMM d, yyyy');
  const isOverdue = new Date(invoice.dueDate) < new Date() && invoice.status !== 'paid';
  
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container flex h-16 items-center px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center">
            <span className="text-xl font-bold">Invoice Creator</span>
          </Link>
        </div>
      </header>
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {paymentStatus === 'success' ? (
            <Card>
              <CardHeader className="text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <CardTitle>Payment Successful!</CardTitle>
                <CardDescription>
                  Thank you for your payment. The invoice has been marked as paid.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Invoice Number</p>
                      <p className="font-medium">{invoice.invoiceNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Amount Paid</p>
                      <p className="font-medium">${invoice.total.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Payment Date</p>
                      <p className="font-medium">{format(new Date(), 'MMMM d, yyyy')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <p className="font-medium text-green-600">Paid</p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link to="/">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Return Home
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ) : paymentStatus === 'error' ? (
            <Card>
              <CardHeader className="text-center">
                <XCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
                <CardTitle>Payment Failed</CardTitle>
                <CardDescription>
                  There was an issue processing your payment. Please try again.
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex flex-col gap-2">
                <Button onClick={handlePayNow} className="w-full">
                  Try Again
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Return Home
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <>
              <h1 className="text-3xl font-bold mb-6">Invoice Payment</h1>
              
              <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
                <div className="md:col-span-2 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Invoice #{invoice.invoiceNumber}</CardTitle>
                      <CardDescription>
                        Due {formattedDate}
                        {isOverdue && <span className="text-red-500 ml-2">(Overdue)</span>}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">From</h3>
                          <div className="mt-2">
                            <p className="font-medium">{invoiceSettings.fullName}</p>
                            {invoiceSettings.companyName && <p>{invoiceSettings.companyName}</p>}
                            <p>{invoiceSettings.email}</p>
                            {invoiceSettings.phone && <p>{invoiceSettings.phone}</p>}
                          </div>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">To</h3>
                          <div className="mt-2">
                            <p className="font-medium">{client.fullName}</p>
                            {client.companyName && <p>{client.companyName}</p>}
                            <p>{client.email}</p>
                            {client.phone && <p>{client.phone}</p>}
                          </div>
                        </div>
                      </div>
                      
                      <div className="border-t pt-4">
                        <h3 className="text-sm font-medium mb-3">Items</h3>
                        <div className="space-y-2">
                          {invoice.items.map((item: any, index: number) => (
                            <div key={index} className="grid grid-cols-4 gap-2">
                              <div className="col-span-2">
                                <p className="font-medium">{item.description}</p>
                                {item.details && <p className="text-sm text-muted-foreground">{item.details}</p>}
                              </div>
                              <div className="text-right">
                                {item.quantity} × ${parseFloat(item.rate).toFixed(2)}
                              </div>
                              <div className="text-right font-medium">
                                ${(item.quantity * item.rate).toFixed(2)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="border-t pt-4">
                        <div className="flex justify-between">
                          <span className="font-medium">Subtotal</span>
                          <span>${invoice.subtotal.toFixed(2)}</span>
                        </div>
                        {invoice.taxRate > 0 && (
                          <div className="flex justify-between mt-2">
                            <span>Tax ({invoice.taxRate}%)</span>
                            <span>${invoice.taxAmount.toFixed(2)}</span>
                          </div>
                        )}
                        {invoice.discount > 0 && (
                          <div className="flex justify-between mt-2">
                            <span>Discount</span>
                            <span>-${invoice.discount.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between mt-4 text-lg font-bold">
                          <span>Total</span>
                          <span>${invoice.total.toFixed(2)}</span>
                        </div>
                      </div>
                      
                      {invoice.notes && (
                        <div className="border-t pt-4">
                          <h3 className="text-sm font-medium mb-2">Notes</h3>
                          <p className="text-sm">{invoice.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
                
                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle>Payment Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="border rounded-lg p-4 space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Invoice Total</span>
                          <span className="font-medium">${invoice.total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg">
                          <span>Amount Due</span>
                          <span>${invoice.total.toFixed(2)}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex gap-2 items-center">
                          <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                          <span>Due {formattedDate}</span>
                        </div>
                        <div className="flex gap-2 items-center">
                          {client.companyName ? (
                            <Building className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <User className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span>Billed to {client.companyName || client.fullName}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        onClick={handlePayNow} 
                        className="w-full" 
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>Processing...</>
                        ) : (
                          <>
                            <CreditCard className="h-4 w-4 mr-2" />
                            Pay Now (${invoice.total.toFixed(2)})
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
      
      <footer className="border-t py-6">
        <div className="container px-4 flex justify-center">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Invoice Creator. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
