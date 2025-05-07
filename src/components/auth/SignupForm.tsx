
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SignupFormField } from "./SignupFormField";
import { PackageSelect } from "./PackageSelect";
import { usePackages } from "./usePackages";

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
  const { packages, isLoadingPackages } = usePackages();

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
            <SignupFormField
              control={form.control}
              name="fullName"
              label="Full Name"
              placeholder="John Smith"
            />
            <SignupFormField
              control={form.control}
              name="email"
              label="Email"
              placeholder="name@example.com"
              type="email"
            />
            <SignupFormField
              control={form.control}
              name="company"
              label="Company"
              placeholder="Your Company"
              optional={true}
            />
            <PackageSelect
              control={form.control}
              isLoadingPackages={isLoadingPackages}
              packages={packages}
            />
            <SignupFormField
              control={form.control}
              name="password"
              label="Password"
              placeholder="********"
              type="password"
            />
            <SignupFormField
              control={form.control}
              name="confirmPassword"
              label="Confirm Password"
              placeholder="********"
              type="password"
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
