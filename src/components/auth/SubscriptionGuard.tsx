
import { useAuth } from '@/context/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

export default function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const { hasActiveSubscription, isAdmin } = useAuth();

  // Admins always have access
  if (isAdmin) {
    return <>{children}</>;
  }

  // Check for active subscription
  if (!hasActiveSubscription) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="max-w-md w-full">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Subscription Required</AlertTitle>
            <AlertDescription className="mt-2">
              You need an active subscription to access this feature. Please subscribe to a plan to continue.
            </AlertDescription>
          </Alert>
          <div className="mt-4 text-center">
            <Button asChild>
              <Link to="/settings">
                View Subscription Plans
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
