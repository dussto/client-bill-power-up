
import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useData } from "@/context/DataContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Trash2, Plus } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Invoice, InvoiceItem, Client } from "@/types";
import { cn } from "@/lib/utils";

const invoiceItemSchema = z.object({
  id: z.string(),
  description: z.string().min(1, "Description is required"),
  quantity: z.number().min(0.01, "Quantity must be greater than 0"),
  rate: z.number().min(0, "Rate cannot be negative"),
  amount: z.number(),
});

const invoiceSchema = z.object({
  id: z.string().optional(),
  clientId: z.string().min(1, "Client is required"),
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  issueDate: z.date(),
  dueDate: z.date(),
  items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
  notes: z.string().optional(),
  subtotal: z.number(),
  tax: z.number().optional(),
  discount: z.number().optional(),
  total: z.number(),
  status: z.enum(["draft", "pending", "paid", "overdue"]),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

interface InvoiceFormProps {
  invoice?: Invoice;
  defaultClientId?: string;
  onSuccess?: () => void;
}

export default function InvoiceForm({ invoice, defaultClientId, onSuccess }: InvoiceFormProps) {
  const { clients, addInvoice, updateInvoice } = useData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false); // Add flag to prevent recursion
  const navigate = useNavigate();
  const isEditing = !!invoice;

  // Generate invoice number if creating new
  const generateInvoiceNumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
    return `INV-${year}${month}-${random}`;
  };

  // Prepare default items with required fields
  const prepareDefaultItems = (): InvoiceItem[] => {
    if (invoice?.items && invoice.items.length > 0) {
      return invoice.items.map(item => ({
        ...item,
        id: item.id // Ensure id is present
      }));
    }
    
    return [{
      id: `item-${Date.now()}`,
      description: "",
      quantity: 1,
      rate: 0,
      amount: 0,
    }];
  };

  const defaultValues: InvoiceFormValues = {
    id: invoice?.id,
    clientId: invoice?.clientId || defaultClientId || "",
    invoiceNumber: invoice?.invoiceNumber || generateInvoiceNumber(),
    issueDate: invoice?.issueDate ? new Date(invoice.issueDate) : new Date(),
    dueDate: invoice?.dueDate 
      ? new Date(invoice.dueDate) 
      : new Date(new Date().setDate(new Date().getDate() + 14)),
    items: prepareDefaultItems(),
    notes: invoice?.notes || "Thank you for your business!",
    subtotal: invoice?.subtotal || 0,
    tax: invoice?.tax || 0,
    discount: invoice?.discount || 0,
    total: invoice?.total || 0,
    status: invoice?.status || "draft",
  };

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Calculate totals whenever items, tax, or discount changes
  const calculateTotals = () => {
    // Prevent recursion
    if (isCalculating) return;
    
    setIsCalculating(true);
    
    try {
      const items = form.getValues("items");
      
      // Update individual item amounts and calculate subtotal
      let subtotal = 0;
      items.forEach((item, index) => {
        const quantity = Number(item.quantity);
        const rate = Number(item.rate);
        const amount = quantity * rate;
        form.setValue(`items.${index}.amount`, amount, { 
          shouldValidate: false,
          shouldDirty: true,
          shouldTouch: false
        });
        subtotal += amount;
      });
      
      const tax = Number(form.getValues("tax") || 0);
      const discount = Number(form.getValues("discount") || 0);
      
      // Calculate total
      const total = subtotal + tax - discount;
      
      form.setValue("subtotal", subtotal, { 
        shouldValidate: false,
        shouldDirty: true,
        shouldTouch: false
      });
      form.setValue("total", total, { 
        shouldValidate: false,
        shouldDirty: true,
        shouldTouch: false
      });
    } finally {
      setIsCalculating(false);
    }
  };

  // Use a debounced effect for recalculating totals to prevent rapid firing
  useEffect(() => {
    // Store the subscription
    const subscription = form.watch((value, { name }) => {
      if (
        name?.startsWith("items") ||
        name === "tax" ||
        name === "discount"
      ) {
        // Use a small timeout to prevent rapid firing
        const timeoutId = setTimeout(() => {
          if (!isCalculating) {
            calculateTotals();
          }
        }, 100);
        
        return () => clearTimeout(timeoutId);
      }
    });
    
    // Initial calculation
    calculateTotals();
    
    // Cleanup subscription
    return () => subscription.unsubscribe();
  }, [form.watch]);

  // Add a new empty line item
  const addLineItem = () => {
    append({
      id: `item-${Date.now()}`,
      description: "",
      quantity: 1,
      rate: 0,
      amount: 0,
    });
  };

  const onSubmit = async (values: InvoiceFormValues) => {
    setIsSubmitting(true);

    try {
      const formattedValues = {
        ...values,
        issueDate: format(values.issueDate, "yyyy-MM-dd"),
        dueDate: format(values.dueDate, "yyyy-MM-dd"),
        // Ensure all required properties exist on items
        items: values.items.map(item => ({
          id: item.id,
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.amount
        }))
      };

      if (isEditing && invoice) {
        updateInvoice(invoice.id, formattedValues);
      } else {
        // Ensure all required fields are set for a new invoice
        const newInvoice = {
          clientId: formattedValues.clientId,
          invoiceNumber: formattedValues.invoiceNumber,
          issueDate: formattedValues.issueDate,
          dueDate: formattedValues.dueDate,
          items: formattedValues.items,
          notes: formattedValues.notes,
          subtotal: formattedValues.subtotal,
          tax: formattedValues.tax,
          discount: formattedValues.discount,
          total: formattedValues.total,
          status: formattedValues.status
        };
        addInvoice(newInvoice);
      }

      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/invoices");
      }
    } catch (error) {
      console.error("Invoice save failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Invoice header */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client*</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients.map((client: Client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.fullName} {client.companyName ? `(${client.companyName})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="invoiceNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invoice Number*</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status*</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="issueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Issue Date*</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Due Date*</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Line Items */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Line Items</h3>
            <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
          
          <div className="border rounded-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-2 text-left text-sm">Description</th>
                  <th className="px-4 py-2 text-right text-sm w-24">Qty</th>
                  <th className="px-4 py-2 text-right text-sm w-32">Rate</th>
                  <th className="px-4 py-2 text-right text-sm w-32">Amount</th>
                  <th className="px-4 py-2 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {fields.map((item, index) => (
                  <tr key={item.id} className="border-t">
                    <td className="px-4 py-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="Item description" 
                                className="border-none shadow-none focus-visible:ring-0"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input 
                                {...field}
                                type="number"
                                min="0.01"
                                step="0.01"
                                className="text-right border-none shadow-none focus-visible:ring-0"
                                onChange={(e) => {
                                  field.onChange(parseFloat(e.target.value));
                                }}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.rate`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input 
                                {...field}
                                type="number"
                                min="0"
                                step="0.01"
                                className="text-right border-none shadow-none focus-visible:ring-0"
                                onChange={(e) => {
                                  field.onChange(parseFloat(e.target.value));
                                }}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.amount`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                {...field}
                                disabled
                                className="text-right border-none shadow-none bg-transparent"
                                value={field.value.toFixed(2)}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t">
                  <td colSpan={3} className="px-4 py-2 text-right font-medium">
                    Subtotal
                  </td>
                  <td className="px-4 py-2">
                    <FormField
                      control={form.control}
                      name="subtotal"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              {...field}
                              disabled
                              className="text-right border-none shadow-none bg-transparent"
                              value={field.value.toFixed(2)}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </td>
                  <td></td>
                </tr>
                <tr>
                  <td colSpan={3} className="px-4 py-2 text-right font-medium">
                    Tax
                  </td>
                  <td className="px-4 py-2">
                    <FormField
                      control={form.control}
                      name="tax"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              min="0"
                              step="0.01"
                              className="text-right"
                              onChange={(e) => {
                                field.onChange(parseFloat(e.target.value) || 0);
                              }}
                              value={field.value || ""}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </td>
                  <td></td>
                </tr>
                <tr>
                  <td colSpan={3} className="px-4 py-2 text-right font-medium">
                    Discount
                  </td>
                  <td className="px-4 py-2">
                    <FormField
                      control={form.control}
                      name="discount"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              min="0"
                              step="0.01"
                              className="text-right"
                              onChange={(e) => {
                                field.onChange(parseFloat(e.target.value) || 0);
                              }}
                              value={field.value || ""}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </td>
                  <td></td>
                </tr>
                <tr className="border-t">
                  <td colSpan={3} className="px-4 py-2 text-right font-medium">
                    Total
                  </td>
                  <td className="px-4 py-2">
                    <FormField
                      control={form.control}
                      name="total"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              {...field}
                              disabled
                              className="text-right font-bold"
                              value={field.value.toFixed(2)}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Notes */}
        <div>
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Additional notes or payment instructions..."
                    rows={3}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/invoices")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Saving..."
              : isEditing
              ? "Update Invoice"
              : "Create Invoice"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
