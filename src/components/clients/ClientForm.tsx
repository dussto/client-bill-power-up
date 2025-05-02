import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useData } from "@/context/DataContext";
import { useNavigate } from "react-router-dom";
import { Client } from "@/types";

const clientSchema = z.object({
  fullName: z.string().min(2, { message: "Name must be at least 2 characters" }),
  companyName: z.string().optional(),
  email: z.string().email({ message: "Please enter a valid email address" }),
  phone: z.string().optional(),
  address: z.string().min(1, { message: "Address is required" }),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientSchema>;

interface ClientFormProps {
  client?: Client;
  onSuccess?: () => void;
}

export default function ClientForm({ client, onSuccess }: ClientFormProps) {
  const { addClient, updateClient } = useData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const isEditing = !!client;

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      fullName: client?.fullName || "",
      companyName: client?.companyName || "",
      email: client?.email || "",
      phone: client?.phone || "",
      address: client?.address || "",
      city: client?.city || "",
      state: client?.state || "",
      zipCode: client?.zipCode || "",
      country: client?.country || "",
    },
  });

  const onSubmit = async (values: ClientFormValues) => {
    setIsSubmitting(true);

    try {
      if (isEditing && client) {
        updateClient(client.id, values);
      } else {
        // Explicitly define all required fields
        const newClient = {
          fullName: values.fullName,
          email: values.email,
          address: values.address,
          companyName: values.companyName,
          phone: values.phone,
          city: values.city,
          state: values.state, 
          zipCode: values.zipCode,
          country: values.country,
        };
        addClient(newClient);
      }

      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/clients");
      }
    } catch (error) {
      console.error("Client save failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name*</FormLabel>
                  <FormControl>
                    <Input placeholder="John Smith" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Inc." {...field} />
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
                  <FormLabel>Email Address*</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="john@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="(123) 456-7890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4">
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address*</FormLabel>
                  <FormControl>
                    <Textarea placeholder="123 Main St" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="New York" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State/Province</FormLabel>
                    <FormControl>
                      <Input placeholder="NY" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="zipCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ZIP/Postal Code</FormLabel>
                    <FormControl>
                      <Input placeholder="10001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input placeholder="USA" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/clients")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Saving..."
              : isEditing
              ? "Update Client"
              : "Add Client"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
