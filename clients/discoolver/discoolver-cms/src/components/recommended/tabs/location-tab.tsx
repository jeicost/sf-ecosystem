"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { City } from "@/types";
import type { BusinessDetail } from "@/types/business";
import { memo, useMemo } from "react";
import { useFormContext } from "react-hook-form";
import type { BusinessFormValues } from "../business-form-schema";

interface Props {
  business?: BusinessDetail;
  cities: City[];
  isLoadingCities: boolean;
}

export const LocationTab = memo(function LocationTab({
  business,
  cities,
  isLoadingCities,
}: Props) {
  const form = useFormContext<BusinessFormValues>();
  const cityOptions = useMemo(
    () =>
      cities.map((c) => ({ value: c.idCity.toString(), label: c.name ?? "" })),
    [cities],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ubicación y Geografía</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 items-start">
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dirección</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value || null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="city.idCity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ciudad</FormLabel>
                <Combobox
                  options={cityOptions}
                  value={field.value ? field.value.toString() : ""}
                  onValueChange={(value) =>
                    field.onChange(value ? parseInt(value) : 0)
                  }
                  placeholder={
                    isLoadingCities
                      ? "Cargando ciudades..."
                      : "Seleccionar ciudad"
                  }
                  searchPlaceholder="Buscar ciudad..."
                  emptyText="No se encontró la ciudad"
                  isLoading={isLoadingCities}
                  disabled={isLoadingCities}
                  className="w-full"
                />
                {field.value ? (
                  <p className="text-xs text-muted-foreground">
                    ID: {field.value}
                    {business?.city?.rawId &&
                      ` • Raw ID: ${business.city.rawId}`}
                  </p>
                ) : null}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 items-start">
          <FormField
            control={form.control}
            name="latitude"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Latitud</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    step="any"
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(
                        value === ""
                          ? undefined
                          : parseFloat(value) || undefined,
                      );
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="longitude"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Longitud</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    step="any"
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(
                        value === ""
                          ? undefined
                          : parseFloat(value) || undefined,
                      );
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
});
