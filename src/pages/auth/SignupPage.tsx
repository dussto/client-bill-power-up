
import PublicLayout from '@/components/layout/PublicLayout';
import SignupForm from '@/components/auth/SignupForm';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';

export default function SignupPage() {
  const { isAuthenticated } = useAuth();
  
  // Ensure that packages are loaded for signup
  useEffect(() => {
    // Check if packages exist, if not use defaults
    const storedPackages = localStorage.getItem('servicePackages');
    if (!storedPackages) {
      // Set default packages if none exist
      const defaultPackages = [
        {
          id: 'basic',
          name: 'Basic',
          description: 'Essential features for small businesses',
          price: 9.99,
          billingCycle: 'monthly',
          features: {
            stripeIntegration: false,
            sendingDomains: 1,
            serviceCreation: false,
            paymentOptions: {
              offline: true,
              stripe: false,
            },
            paymentTerms: {
              oneOffs: true,
              monthly: false,
              annually: false,
            },
          },
        },
        {
          id: 'pro',
          name: 'Professional',
          description: 'Advanced features for growing businesses',
          price: 29.99,
          billingCycle: 'monthly',
          features: {
            stripeIntegration: true,
            sendingDomains: 3,
            serviceCreation: true,
            paymentOptions: {
              offline: true,
              stripe: true,
            },
            paymentTerms: {
              oneOffs: true,
              monthly: true,
              annually: false,
            },
          },
        },
      ];
      localStorage.setItem('servicePackages', JSON.stringify(defaultPackages));
    }
  }, []);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <PublicLayout>
      <div className="max-w-md mx-auto py-12">
        <SignupForm />
      </div>
    </PublicLayout>
  );
}
