
import PublicLayout from '@/components/layout/PublicLayout';
import SignupForm from '@/components/auth/SignupForm';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export default function SignupPage() {
  const { isAuthenticated } = useAuth();

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
