"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useFormContext } from "react-hook-form";
import type { BusinessFormValues } from "../business-form-schema";

interface Props {
  mode?: "create" | "edit";
}

export function SeoTab({ mode = "edit" }: Props) {
  const form = useFormContext<BusinessFormValues>();
  const isCreateMode = mode === "create";
  const urlDiscoolver = form.watch("rawId")
    ? `https://discoolver.com/${form.watch("rawId")}`
    : "";
  const previewDiscoolver = form.watch("rawId")
    ? `https://preview.discoolver.com/${form.watch("rawId")}`
    : "";

  return (
    <Card>
      <CardHeader>
        <CardTitle>SEO y Metadatos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="ogTitle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título OG (Open Graph)</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="ogDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción OG</FormLabel>
              <FormControl>
                <Textarea {...field} className="min-h-[80px]" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="keyWords"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Palabras Clave (Keywords)</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Separadas por comas" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="subtitle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subtítulo</FormLabel>
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

        {!isCreateMode && (
          <>
            <Separator />

            <div className="space-y-2">
              <FormLabel>URLs</FormLabel>
              <div className="space-y-2">
                <div className="p-3 rounded-md border bg-muted/50">
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    URL Discoolver
                  </p>
                  <p className="text-sm">{urlDiscoolver || "N/A"}</p>
                </div>
                <div className="p-3 rounded-md border bg-muted/50">
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    URL Preview
                  </p>
                  <p className="text-sm">{previewDiscoolver || "N/A"}</p>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
