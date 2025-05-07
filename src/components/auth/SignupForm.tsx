
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { ServicePackage } from "@/components/packages/PackageManager";

const signupSchema = z.object({
  fullName: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  company: z.string().optional(),
  packageId: z.string({ required_error: "Please select a package" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupForm() {
  const { signup } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [isLoadingPackages, setIsLoadingPackages] = useState(true);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      company: "",
      packageId: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    // In a real app, we'd fetch this from the database
    // For now, we're using the default packages
    const fetchPackages = () => {
      try {
        // Get packages from localStorage
        const storedPackages = localStorage.getItem('servicePackages');
        if (storedPackages) {
          const parsedPackages = JSON.parse(storedPackages);
          setPackages(parsedPackages);
        } else {
          // Default packages if none exist
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

  const onSubmit = async (values: SignupFormValues) => {
    try {
      setIsSubmitting(true);

      // Find the selected package
      const selectedPackage = packages.find(pkg => pkg.id === values.packageId);
      
      await signup(
        values.email, 
        values.password, 
        values.fullName, 
        values.company || undefined, 
        selectedPackage ? selectedPackage.id : undefined
      );
    } catch (error) {
      console.error("Signup failed:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
        <CardDescription>
          Enter your information to create your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Smith" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="name@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Your Company" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="packageId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Package</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a package" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoadingPackages ? (
                        <SelectItem value="loading" disabled>Loading packages...</SelectItem>
                      ) : (
                        packages.map((pkg) => (
                          <SelectItem key={pkg.id} value={pkg.id}>
                            {pkg.name} - ${pkg.price}/{pkg.billingCycle === 'one-time' ? 'one-time' : pkg.billingCycle}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="********" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="********" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creating account..." : "Create Account"}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter>
        <p className="text-sm text-muted-foreground text-center w-full">
          Already have an account?{" "}
          <Link to="/login" className="text-primary underline hover:text-primary/90">
            Log in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
