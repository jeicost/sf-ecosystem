"use client";

import { updateBusinessExternalData } from "@/app/actions/business";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { normalizeOptionalText } from "../business-form-schema";

const MEMBERSHIP_TYPES = [
  { value: 1, label: "Reservar" },
  { value: 2, label: "Comprar" },
  { value: 3, label: "Gratis" },
  { value: 4, label: "Formulario de Contacto" },
  { value: 5, label: "No reservable" },
] as const;

interface Props {
  businessId: number;
  initialTypeOfMembership: number;
  initialUrlMembership: string;
  deepLinkToken: string;
}

export function MarketplaceTab({
  businessId,
  initialTypeOfMembership,
  initialUrlMembership,
  deepLinkToken,
}: Props) {
  const [typeOfMembership, setTypeOfMembership] = useState(
    initialTypeOfMembership,
  );
  const [urlMembership, setUrlMembership] = useState(
    () => normalizeOptionalText(initialUrlMembership) ?? "",
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!businessId) return;
    setIsSaving(true);
    try {
      const normalizedUrlMembership = normalizeOptionalText(urlMembership) ?? "";

      await updateBusinessExternalData(businessId, {
        typeOfMembership,
        urlMembership: normalizedUrlMembership,
        deepLinkToken,
      });
      setUrlMembership(normalizedUrlMembership);
      toast.success("Enlace externo guardado correctamente");
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar el enlace externo");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Enlace Externo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Etiqueta</Label>
            <div className="flex flex-wrap gap-2 pt-1">
              {MEMBERSHIP_TYPES.map((type) => (
                <Button
                  key={type.value}
                  type="button"
                  variant={typeOfMembership === type.value ? "default" : "outline"}
                  size="sm"
                  className="rounded-full transition-all"
                  onClick={() => setTypeOfMembership(type.value)}
                >
                  {type.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>URL</Label>
            <Input
              type="url"
              placeholder="https://..."
              value={urlMembership}
              onChange={(e) => setUrlMembership(e.target.value)}
            />
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !businessId}
            >
              {isSaving ? "Guardando..." : "Guardar Enlace"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
