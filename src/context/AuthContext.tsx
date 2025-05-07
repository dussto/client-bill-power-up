
import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '@/types';
import { useToast } from '@/components/ui/use-toast';
import useUserRole from '@/components/auth/UserRole';

interface AuthContextProps {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName: string, company?: string, packageId?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check for stored user data on component mount
    const storedUser = localStorage.getItem('invoice_app_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      // Simulate authentication delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, this would validate against a backend
      if (email && password) {
        const mockUser: User = {
          id: `user-${Date.now()}`,
          email,
          fullName: email.split('@')[0],
        };
        
        setUser(mockUser);
        localStorage.setItem('invoice_app_user', JSON.stringify(mockUser));
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
        navigate('/dashboard');
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials and try again",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, fullName: string, company?: string, packageId?: string) => {
    try {
      setIsLoading(true);
      // Simulate registration delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, this would create a user in the backend
      const mockUser: User = {
        id: `user-${Date.now()}`,
        email,
        fullName,
        company,
        packageId,
      };
      
      setUser(mockUser);
      localStorage.setItem('invoice_app_user', JSON.stringify(mockUser));
      
      // Store client data with selected package
      const clientsData = localStorage.getItem('clients_data');
      const clients = clientsData ? JSON.parse(clientsData) : [];
      clients.push({
        id: mockUser.id,
        fullName,
        email,
        company,
        packageId,
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem('clients_data', JSON.stringify(clients));
      
      toast({
        title: "Registration successful",
        description: "Your account has been created.",
      });
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('invoice_app_user');
    toast({
      title: "Logged out",
      description: "You've been successfully logged out.",
    });
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
