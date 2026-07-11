"use client";

import { getBusinesses } from "@/app/actions/business";
import { BusinessFilters } from "@/components/recommended/business-filters";
import { columns } from "@/components/recommended/columns";
import { DataTable } from "@/components/recommended/data-table";
import { GooglePlaceSearchSheet } from "@/components/recommended/google-place-search-sheet";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/config/routes";
import { DEFAULT_LANGUAGE } from "@/types/language";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  MapPinPlus,
  Plus,
  Search as SearchIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const SEARCH_FILTERS_KEY = "recommended-search-filters";

interface SearchFilters {
  city: string | null;
  category: string | null;
  state: string | null;
}

function loadSearchFilters(): SearchFilters | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(SEARCH_FILTERS_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function saveSearchFilters(filters: SearchFilters): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SEARCH_FILTERS_KEY, JSON.stringify(filters));
  } catch {
    // Silent fail if localStorage is not available
  }
}

interface Props {
  /** When set, the city filter is locked to this ID (city admin users) */
  lockedCityId?: string;
}

export function RecommendedList({ lockedCityId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const searchCity = searchParams.get("city");
  const searchCategory = searchParams.get("category");
  const searchState = searchParams.get("state");

  // On first mount: city admins always get their city pre-set; others restore from localStorage
  useEffect(() => {
    if (lockedCityId) {
      // If the URL city doesn't match the locked city, correct it
      if (searchCity !== lockedCityId) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("city", lockedCityId);
        router.replace(`${ROUTES.RECOMMENDED}?${params.toString()}`, {
          scroll: false,
        });
      }
      return;
    }

    if (searchCity || searchCategory) return;

    const stored = loadSearchFilters();
    if (!stored?.city || !stored?.category) return;

    const params = new URLSearchParams();
    params.set("city", stored.city);
    params.set("category", stored.category);
    if (stored.state) params.set("state", stored.state);

    router.replace(`${ROUTES.RECOMMENDED}?${params.toString()}`, {
      scroll: false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data, isLoading, error } = useQuery({
    queryKey: ["recommended", searchCity, searchCategory, searchState],
    queryFn: () =>
      getBusinesses({
        language: DEFAULT_LANGUAGE,
        name: "",
        category: searchCategory!,
        subcategory: "",
        city: searchCity!,
        state: searchState || "",
        outstanding: 0,
        outstandingInCategory: 0,
        sponsored: 0,
      }),
    enabled: !!searchCity && !!searchCategory,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const handleSearch = (cityId: string, categoryId: string, state: string) => {
    // City admins cannot change city
    const effectiveCityId = lockedCityId ?? cityId;

    saveSearchFilters({
      city: effectiveCityId,
      category: categoryId,
      state: state || null,
    });

    const params = new URLSearchParams();
    params.set("city", effectiveCityId);
    params.set("category", categoryId);
    if (state) params.set("state", state);

    router.replace(`${ROUTES.RECOMMENDED}?${params.toString()}`, {
      scroll: false,
    });
  };

  return (
    <div className="container p-6 mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col justify-center">
          <h1 className="text-3xl font-bold">Recomendados</h1>
          <p className="mt-1 text-muted-foreground">
            Gestiona y visualiza los recomendados
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={ROUTES.RECOMMENDED_CREATE}>
            <Button variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Crear Recomendado
            </Button>
          </Link>
          <Button onClick={() => setIsSheetOpen(true)}>
            <MapPinPlus className="w-4 h-4 mr-2" />
            Añadir desde Google
          </Button>
        </div>
      </div>

      <GooglePlaceSearchSheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
      />

      <BusinessFilters
        onSearch={handleSearch}
        initialCity={lockedCityId ?? searchCity}
        initialCategory={searchCategory}
        initialState={searchState}
        isSearching={isLoading}
        lockedCityId={lockedCityId}
      />

      <div className="flex-1 p-6 rounded-lg border bg-card">
        {isLoading ? (
          <div className="space-y-4">
            <div className="flex gap-4">
              <Skeleton className="h-10 w-[250px]" />
              <Skeleton className="h-10 w-[180px]" />
              <Skeleton className="h-10 w-[100px] ml-auto" />
            </div>
            <div className="space-y-2">
              <Skeleton className="w-full h-12" />
              <Skeleton className="w-full h-12" />
              <Skeleton className="w-full h-12" />
              <Skeleton className="w-full h-12" />
              <Skeleton className="w-full h-12" />
            </div>
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              Error al cargar los negocios:{" "}
              {error instanceof Error ? error.message : "Error desconocido"}
            </AlertDescription>
          </Alert>
        ) : data && data.length > 0 ? (
          <DataTable columns={columns} data={data} />
        ) : (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <SearchIcon />
              </EmptyMedia>
              <EmptyTitle>No hay resultados</EmptyTitle>
              <EmptyDescription>
                Selecciona una ciudad y categoría, luego haz clic en Buscar para
                ver los recomendados
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>
    </div>
  );
}
