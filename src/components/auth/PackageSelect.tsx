
import { useState, useEffect } from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ServicePackage } from "@/components/packages/PackageManager";
import { Control } from "react-hook-form";

interface PackageSelectProps {
  control: Control<any>;
  isLoadingPackages: boolean;
  packages: ServicePackage[];
}

export const PackageSelect = ({
  control,
  isLoadingPackages,
  packages,
}: PackageSelectProps) => {
  return (
    <FormField
      control={control}
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
  );
};
