"use client";

import { getCitiesBySubregion, getDestinations } from "@/app/actions";
import { getCategories } from "@/app/actions/category";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { DEFAULT_LANGUAGE } from "@/types/language";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useState } from "react";

interface Props {
  onSearch: (name: string, city: string, categoryName: string) => void;
  initialName?: string;
  initialDestination?: string;
  initialCity?: string;
  initialCategory?: string;
  isSearching?: boolean;
}

export function GooglePlaceSearchForm({
  onSearch,
  initialName,
  initialDestination,
  initialCity,
  initialCategory,
  isSearching = false,
}: Props) {
  const [businessName, setBusinessName] = useState(initialName);
  const [selectedDestination, setSelectedDestination] =
    useState(initialDestination);
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);

  // Fetch destinations
  const { data: destinations, isLoading: isLoadingDestinations } = useQuery({
    queryKey: ["destinations", DEFAULT_LANGUAGE],
    queryFn: async () => {
      try {
        return await getDestinations(DEFAULT_LANGUAGE);
      } catch (err) {
        throw err;
      }
    },
  });

  // Fetch cities by subregion (only when a destination is selected)
  const { data: cities, isLoading: isLoadingCities } = useQuery({
    queryKey: ["cities", DEFAULT_LANGUAGE, selectedDestination],
    queryFn: async () => {
      try {
        if (!selectedDestination) return [];
        return await getCitiesBySubregion(
          DEFAULT_LANGUAGE,
          parseInt(selectedDestination),
        );
      } catch (err) {
        throw err;
      }
    },
    enabled: !!selectedDestination, // Only fetch when destination is selected
  });

  // Fetch categories
  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ["categories", DEFAULT_LANGUAGE],
    queryFn: async () => {
      try {
        return await getCategories(DEFAULT_LANGUAGE);
      } catch (err) {
        throw err;
      }
    },
  });

  // Transform destinations to ComboboxOption format
  const destinationOptions: ComboboxOption[] =
    destinations?.map(
      (destination: { idSubregion: number; name: string | null }) => ({
        value: destination.idSubregion.toString(),
        label: destination.name ?? "",
      }),
    ) || [];

  // Transform cities to ComboboxOption format (no filtering needed - API handles it)
  const cityOptions: ComboboxOption[] =
    cities?.map((city: { idCity: number; name: string | null }) => ({
      value: city.idCity.toString(),
      label: city.name ?? "",
    })) || [];

  // Transform categories to ComboboxOption format
  const categoryOptions: ComboboxOption[] =
    categories?.map((category) => ({
      value: category.idCategory.toString(),
      label: category.name ?? "",
    })) || [];

  const handleSearch = () => {
    if (!businessName || !selectedCity || !selectedCategory) return;

    const cityName = cities?.find(
      (c) => c.idCity.toString() === selectedCity,
    )?.name;
    const categoryName = categories?.find(
      (c) => c.idCategory.toString() === selectedCategory,
    )?.name;

    if (cityName && categoryName) {
      onSearch(businessName, cityName, categoryName);
    }
  };

  // Reset city when destination changes
  const handleDestinationChange = (value: string) => {
    setSelectedDestination(value);
    setSelectedCity(""); // Reset city when destination changes
  };

  // Check if all fields are filled
  const isSearchDisabled =
    !businessName ||
    !selectedDestination ||
    !selectedCity ||
    !selectedCategory ||
    isSearching;

  return (
    <Card>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 items-end">
          {/* Nombre del negocio */}
          <div className="flex flex-col gap-2 items-start flex-1">
            <Label htmlFor="business-name">Nombre del negocio</Label>
            <Input
              id="business-name"
              type="text"
              placeholder="Ej: Xanadu"
              className="w-full"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isSearchDisabled) {
                  handleSearch();
                }
              }}
            />
          </div>

          {/* Destino */}
          <div className="flex flex-col gap-2 items-start">
            <Label>Destino</Label>
            <Combobox
              options={destinationOptions}
              value={selectedDestination}
              onValueChange={handleDestinationChange}
              className="w-full"
              placeholder="Selecciona un destino"
              searchPlaceholder="Buscar destino..."
              emptyText="No se encontró el destino."
              isLoading={isLoadingDestinations}
            />
          </div>

          {/* Subregion (City) */}
          <div className="flex flex-col gap-2 items-start">
            <Label>Subregion</Label>
            <Combobox
              options={cityOptions}
              value={selectedCity}
              onValueChange={setSelectedCity}
              className="w-full"
              placeholder={
                !selectedDestination
                  ? "Selecciona primero un destino"
                  : "Selecciona una subregion"
              }
              searchPlaceholder="Buscar subregion..."
              emptyText="No se encontró la subregion."
              isLoading={isLoadingCities}
              disabled={!selectedDestination}
            />
          </div>

          {/* Categoría */}
          <div className="flex flex-col gap-2 items-start">
            <Label>Categoría</Label>
            <Combobox
              options={categoryOptions}
              value={selectedCategory}
              onValueChange={setSelectedCategory}
              className="w-full"
              placeholder="Selecciona una categoría"
              searchPlaceholder="Buscar categoría..."
              emptyText="No se encontró la categoría."
              isLoading={isLoadingCategories}
            />
          </div>

          {/* Botón de búsqueda */}
          <div className="flex justify-end col-span-2">
            <Button
              onClick={handleSearch}
              size="lg"
              className="gap-2 w-28"
              disabled={isSearchDisabled}
            >
              {isSearching ? (
                <Spinner className="w-4 h-4" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              Buscar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
