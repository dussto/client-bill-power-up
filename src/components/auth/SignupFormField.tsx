
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Control } from "react-hook-form";

interface SignupFormFieldProps {
  control: Control<any>;
  name: string;
  label: string;
  placeholder: string;
  type?: string;
  optional?: boolean;
}

export const SignupFormField = ({
  control,
  name,
  label,
  placeholder,
  type = "text",
  optional = false,
}: SignupFormFieldProps) => {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}{optional && " (Optional)"}</FormLabel>
          <FormControl>
            <Input type={type} placeholder={placeholder} {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
