
import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

interface PublicLayoutProps {
  children: ReactNode;
  fullHeight?: boolean;
}

export default function PublicLayout({ children, fullHeight }: PublicLayoutProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="py-4 border-b">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Link to="/" className="text-xl font-bold text-primary">
            InvoiceFlow
          </Link>
          <nav className="flex items-center gap-4">
            {!isAuthenticated ? (
              <>
                {location.pathname !== '/login' && (
                  <Button variant="outline" asChild>
                    <Link to="/login">Log in</Link>
                  </Button>
                )}
                {location.pathname !== '/signup' && (
                  <Button asChild>
                    <Link to="/signup">Sign up</Link>
                  </Button>
                )}
              </>
            ) : (
              <Button asChild>
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            )}
          </nav>
        </div>
      </header>

      <main className={fullHeight ? "flex-1 flex" : "flex-1"}>
        {children}
      </main>

      <footer className="py-6 bg-muted mt-auto">
        <div className="container mx-auto px-4">
          <div className="text-center text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} InvoiceFlow. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
