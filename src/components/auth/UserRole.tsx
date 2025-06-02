
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export type UserRole = 'admin' | 'user';

export const useUserRole = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      setIsLoading(false);
    }
  }, [authLoading]);

  const role = user?.role as UserRole || 'user';
  const isAdmin = role === 'admin';

  return {
    role,
    isAdmin,
    isLoading,
  };
};

export default useUserRole;
