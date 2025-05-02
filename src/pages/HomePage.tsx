
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import PublicLayout from '@/components/layout/PublicLayout';
import { useAuth } from '@/context/AuthContext';
import { FileText, Users, CreditCard, BarChartBig } from "lucide-react";

export default function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <PublicLayout fullHeight>
      <div className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-r from-primary/90 to-primary py-20 text-white">
          <div className="container mx-auto px-4 flex flex-col items-center text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">Professional Invoicing Made Simple</h1>
            <p className="text-xl max-w-2xl mb-8">
              Create, send, and track invoices with ease. Get paid faster and manage your clients all in one place.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              {isAuthenticated ? (
                <Button size="lg" asChild>
                  <Link to="/dashboard">Go to Dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button size="lg" asChild>
                    <Link to="/signup">Get Started</Link>
                  </Button>
                  <Button size="lg" variant="outline" className="bg-white/10" asChild>
                    <Link to="/login">Log In</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Simplify Your Invoicing Process</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="flex flex-col items-center text-center p-6 bg-card rounded-lg shadow-sm">
                <div className="bg-primary/10 p-3 rounded-full mb-4">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Easy Invoice Creation</h3>
                <p className="text-muted-foreground">
                  Create professional invoices in seconds with our intuitive interface
                </p>
              </div>
              
              <div className="flex flex-col items-center text-center p-6 bg-card rounded-lg shadow-sm">
                <div className="bg-primary/10 p-3 rounded-full mb-4">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Client Management</h3>
                <p className="text-muted-foreground">
                  Keep all your client information organized in one place
                </p>
              </div>
              
              <div className="flex flex-col items-center text-center p-6 bg-card rounded-lg shadow-sm">
                <div className="bg-primary/10 p-3 rounded-full mb-4">
                  <CreditCard className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Payment Tracking</h3>
                <p className="text-muted-foreground">
                  Track payment status and send automatic reminders
                </p>
              </div>
              
              <div className="flex flex-col items-center text-center p-6 bg-card rounded-lg shadow-sm">
                <div className="bg-primary/10 p-3 rounded-full mb-4">
                  <BarChartBig className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Insightful Reports</h3>
                <p className="text-muted-foreground">
                  Gain valuable insights into your business performance
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-muted">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to streamline your invoicing?</h2>
            <p className="text-xl max-w-2xl mx-auto mb-8">
              Join thousands of businesses that use InvoiceFlow to manage their invoicing and get paid faster.
            </p>
            {!isAuthenticated && (
              <Button size="lg" asChild>
                <Link to="/signup">Sign Up for Free</Link>
              </Button>
            )}
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
