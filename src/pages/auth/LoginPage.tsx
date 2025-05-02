
import PublicLayout from '@/components/layout/PublicLayout';
import LoginForm from '@/components/auth/LoginForm';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <PublicLayout>
      <div className="max-w-md mx-auto py-12">
        <LoginForm />
      </div>
    </PublicLayout>
  );
}
