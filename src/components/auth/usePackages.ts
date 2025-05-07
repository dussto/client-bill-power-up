
import { useState, useEffect } from "react";
import { ServicePackage } from "@/components/packages/PackageManager";

export const usePackages = () => {
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [isLoadingPackages, setIsLoadingPackages] = useState<boolean>(true);

  useEffect(() => {
    // In a real app, we'd fetch this from the database
    // For now, we're using the default packages
    const fetchPackages = () => {
      try {
        // Get packages from localStorage
        const storedPackages = localStorage.getItem('servicePackages');
        if (storedPackages) {
          const parsedPackages = JSON.parse(storedPackages);
          setPackages(parsedPackages as ServicePackage[]);
        } else {
          // Default packages if none exist
          const defaultPackages: ServicePackage[] = [
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
          setPackages(defaultPackages);
        }
      } catch (error) {
        console.error("Error fetching packages:", error);
      } finally {
        setIsLoadingPackages(false);
      }
    };

    fetchPackages();
  }, []);

  return {
    packages,
    isLoadingPackages
  };
};
