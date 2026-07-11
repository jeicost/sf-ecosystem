import { getBusinessById } from "@/app/actions/business";
import { BusinessEditForm } from "@/components/recommended/business-edit-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { DEFAULT_LANGUAGE } from "@/types/language";
import { AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, unstable_rethrow } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function BusinessDetailPage({
  params,
  searchParams,
}: Props) {
  const { id } = await params;
  const search = await searchParams;
  const businessId = parseInt(id, 10);

  if (isNaN(businessId)) {
    notFound();
  }

  // Build back URL with all preserved query params
  const queryParams = new URLSearchParams();

  // Preserve search filters
  if (search.city && typeof search.city === "string") {
    queryParams.set("city", search.city);
  }
  if (search.category && typeof search.category === "string") {
    queryParams.set("category", search.category);
  }
  if (search.state && typeof search.state === "string") {
    queryParams.set("state", search.state);
  }

  // Preserve table state
  if (search.page && typeof search.page === "string") {
    queryParams.set("page", search.page);
  }
  if (search.pageSize && typeof search.pageSize === "string") {
    queryParams.set("pageSize", search.pageSize);
  }
  if (search.sortId && typeof search.sortId === "string") {
    queryParams.set("sortId", search.sortId);
  }
  if (search.sortDesc && typeof search.sortDesc === "string") {
    queryParams.set("sortDesc", search.sortDesc);
  }
  if (search.nameFilter && typeof search.nameFilter === "string") {
    queryParams.set("nameFilter", search.nameFilter);
  }
  if (
    search.outstandingFilter &&
    typeof search.outstandingFilter === "string"
  ) {
    queryParams.set("outstandingFilter", search.outstandingFilter);
  }

  const backUrl = queryParams.toString()
    ? `${ROUTES.RECOMMENDED}?${queryParams.toString()}`
    : ROUTES.RECOMMENDED;

  try {
    const business = await getBusinessById(businessId, DEFAULT_LANGUAGE);

    return (
      <div className="container p-6 mx-auto space-y-6">
        <div className="flex gap-4 items-center">
          <Button variant="outline" size="icon" asChild>
            <Link href={backUrl}>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{business.title}</h1>
            <p className="mt-1 text-muted-foreground">
              Edita la información del negocio
            </p>
          </div>
        </div>

        <BusinessEditForm business={business} mode="edit" />
      </div>
    );
  } catch (error) {
    // If the error is a redirect or notFound, re-throw it so Next.js can handle it
    unstable_rethrow(error);

    return (
      <div className="container p-6 mx-auto space-y-6">
        <div className="flex gap-4 items-center">
          <Button variant="outline" size="icon" asChild>
            <Link href={backUrl}>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Error al cargar el negocio</h1>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            {error instanceof Error
              ? error.message
              : "No se pudo cargar la información del negocio"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }
}
