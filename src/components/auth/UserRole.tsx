
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/components/ui/use-toast';

export type UserRole = 'admin' | 'client';

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setRole(null);
        setIsLoading(false);
        return;
      }

      try {
        // For now, we'll use a simple approach - the first user is admin, others are clients
        // In a real app, you'd fetch this from your database
        const adminEmail = localStorage.getItem('admin_email');
        if (adminEmail === user.email) {
          setRole('admin');
        } else {
          setRole('client');
        }

        if (!adminEmail && user) {
          // If no admin exists, first user becomes admin
          localStorage.setItem('admin_email', user.email);
          setRole('admin');
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  const isAdmin = role === 'admin';

  return {
    role,
    isAdmin,
    isLoading,
  };
};

export default useUserRole;
