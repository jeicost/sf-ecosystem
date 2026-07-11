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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Search as SearchIcon } from "lucide-react";
import { useState } from "react";

export default function GooglePlaceSearchPage() {
  const queryClient = useQueryClient();

  const [searchName, setSearchName] = useState<string | undefined>();
  const [searchCity, setSearchCity] = useState<string | undefined>();
  const [searchCategory, setSearchCategory] = useState<string | undefined>();

  // Fetch Google Places based on search trigger
  const { data, isLoading, error } = useQuery({
    queryKey: ["google-places", searchName, searchCity, searchCategory],
    queryFn: async () => {
      if (!searchName || !searchCity || !searchCategory) return null;

      try {
        return await getGooglePlaces({
          name: searchName,
          city: searchCity,
          categoryName: searchCategory,
        });
      } catch (err) {
        throw err;
      }
    },
    enabled: !!searchName && !!searchCity && !!searchCategory,
    // Keep data fresh for 5 minutes to avoid refetching when navigating back
    staleTime: 5 * 60 * 1000,
    // Keep data in cache for 10 minutes
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
    <div className="container p-6 mx-auto space-y-6">
      <div className="flex flex-col justify-center">
        <h1 className="text-3xl font-bold">Búsqueda de Google Places</h1>
        <p className="mt-1 text-muted-foreground">
          Busca negocios en Google Places por nombre, destino y categoría
        </p>
      </div>

      <GooglePlaceSearchForm
        onSearch={handleSearch}
        initialName={searchName}
        initialCity={searchCity}
        initialCategory={searchCategory}
        isSearching={isLoading}
      />

      <div className="flex-1 p-6 rounded-lg border bg-card">
        {isLoading ? (
          <GooglePlaceResults places={[]} isLoading={true} />
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              Error al buscar lugares en Google:{" "}
              {error instanceof Error ? error.message : "Error desconocido"}
            </AlertDescription>
          </Alert>
        ) : data && data.length > 0 ? (
          <GooglePlaceResults places={data} onPlaceSaved={handlePlaceSaved} />
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
                Ingresa el nombre del negocio, selecciona un destino, subregion
                y categoría, luego haz clic en Buscar para ver resultados de
                Google Places
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>
    </div>
  );
}
