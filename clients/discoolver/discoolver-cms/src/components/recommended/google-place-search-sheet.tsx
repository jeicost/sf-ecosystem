"use client";

import { getGooglePlaces } from "@/app/actions";
import { GooglePlaceResults } from "@/components/recommended/google-place-results";
import { GooglePlaceSearchForm } from "@/components/recommended/google-place-search-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Search as SearchIcon } from "lucide-react";
import { useState } from "react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GooglePlaceSearchSheet({ open, onOpenChange }: Props) {
  const queryClient = useQueryClient();

  // Initialize state with empty values (fresh page on every load)
  const [searchName, setSearchName] = useState<string | undefined>();
  const [searchCity, setSearchCity] = useState<string | undefined>();
  const [searchCategory, setSearchCategory] = useState<string | undefined>();

  // Fetch Google Places based on search trigger
  const { data, isLoading, error } = useQuery({
    queryKey: ["google-places", searchName, searchCity, searchCategory],
    queryFn: () =>
      getGooglePlaces({
        name: searchName!,
        city: searchCity!,
        categoryName: searchCategory!,
      }),
    enabled: !!searchName && !!searchCity && !!searchCategory,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const handleSearch = (name: string, city: string, categoryName: string) => {
    setSearchName(name);
    setSearchCity(city);
    setSearchCategory(categoryName);
  };

  const handlePlaceSaved = () => {
    // Invalidate the google places query to refetch data
    queryClient.invalidateQueries({
      queryKey: ["google-places", searchName, searchCity, searchCategory],
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[800px] sm:max-w-[800px]">
        <SheetHeader>
          <SheetTitle>Búsqueda de Google Places</SheetTitle>
          <SheetDescription>
            Busca negocios en Google Places por nombre, destino y categoría
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 h-[calc(100vh-8rem)] overflow-hidden">
          <div className="flex flex-col h-full space-y-4 px-8">
            <GooglePlaceSearchForm
              onSearch={handleSearch}
              initialName={searchName}
              initialCity={searchCity}
              initialCategory={searchCategory}
              isSearching={isLoading}
            />

            <div className="flex-1 overflow-y-auto px-1">
              {isLoading ? (
                <GooglePlaceResults places={[]} isLoading={true} />
              ) : error ? (
                <Alert variant="destructive">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>
                    Error al buscar lugares en Google:{" "}
                    {error instanceof Error
                      ? error.message
                      : "Error desconocido"}
                  </AlertDescription>
                </Alert>
              ) : data && data.length > 0 ? (
                <GooglePlaceResults
                  places={data}
                  onPlaceSaved={handlePlaceSaved}
                />
              ) : searchName && searchCity && searchCategory ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <SearchIcon />
                    </EmptyMedia>
                    <EmptyTitle>No se encontraron resultados</EmptyTitle>
                    <EmptyDescription>
                      No se encontraron lugares en Google que coincidan con los
                      criterios de búsqueda. Intenta con otros términos.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <SearchIcon />
                    </EmptyMedia>
                    <EmptyTitle>Realiza una búsqueda</EmptyTitle>
                    <EmptyDescription>
                      Ingresa el nombre del negocio, selecciona un destino,
                      subregion y categoría, luego haz clic en Buscar para ver
                      resultados de Google Places
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
