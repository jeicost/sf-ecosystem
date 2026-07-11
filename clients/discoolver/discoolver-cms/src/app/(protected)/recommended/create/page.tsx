"use client";

import { BusinessEditForm } from "@/components/recommended/business-edit-form";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CreateBusinessPage() {
  return (
    <div className="container p-6 mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={ROUTES.RECOMMENDED}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex flex-col justify-center">
          <h1 className="text-3xl font-bold">Crear Recomendado</h1>
          <p className="mt-1 text-muted-foreground">
            Completa la información del nuevo recomendado
          </p>
        </div>
      </div>

      <BusinessEditForm mode="create" />
    </div>
  );
}
