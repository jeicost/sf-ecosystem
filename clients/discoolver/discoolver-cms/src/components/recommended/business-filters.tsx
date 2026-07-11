"use client";

import { getCategories } from "@/app/actions/category";
import { getCities } from "@/app/actions/city";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { DEFAULT_LANGUAGE } from "@/types/language";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

interface Props {
  onSearch: (cityId: string, categoryId: string, state: string) => void;
  initialCity?: string | null;
  initialCategory?: string | null;
  initialState?: string | null;
  isSearching?: boolean;
  /** When set, the city selector is locked and cannot be changed */
  lockedCityId?: string;
}

// Estado options
const stateOptions: ComboboxOption[] = [
  { value: "1", label: "1 - EN PROCESO" },
  { value: "2", label: "2 - A REVISAR" },
  { value: "3", label: "3" },
  { value: "4", label: "4 - COMPLETADA" },
];

export function BusinessFilters({
  onSearch,
  initialCity = "41",
  initialCategory = "9",
  initialState = "",
  isSearching = false,
  lockedCityId,
}: Props) {
  const [selectedCity, setSelectedCity] = useState(initialCity || "41");
  const [selectedCategory, setSelectedCategory] = useState(
    initialCategory || "9",
  );
  const [selectedState, setSelectedState] = useState(initialState || "");

  // Fetch cities
  const { data: cities, isLoading: isLoadingCities } = useQuery({
    queryKey: ["cities", DEFAULT_LANGUAGE],
    queryFn: async () => {
      try {
        return await getCities(DEFAULT_LANGUAGE);
      } catch (err) {
        throw err;
      }
    },
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
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
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
  });

  // Transform cities to ComboboxOption format
  const cityOptions = useMemo(
    () =>
      cities?.map((city) => ({
        value: city.idCity.toString(),
        label: city.name || "Sin nombre",
      })) || [],
    [cities],
  );

  // Transform categories to ComboboxOption format
  const categoryOptions = useMemo(
    () =>
      categories?.map((category) => ({
        value: category.idCategory.toString(),
        label: category.name || "Sin nombre",
      })) || [],
    [categories],
  );

  const handleSearch = () => {
    if (!selectedCity || !selectedCategory) return;
    onSearch(selectedCity, selectedCategory, selectedState);
  };

  // Check if both city and category are selected
  const isSearchDisabled = !selectedCity || !selectedCategory || isSearching;

  return (
    <Card>
      <CardContent>
        <div className="flex gap-4 items-center">
          {/* Ciudad */}
          <div className="flex flex-col gap-2 items-start">
            <Label>Ciudad</Label>
            <Combobox
              options={cityOptions}
              value={selectedCity}
              onValueChange={setSelectedCity}
              placeholder="Selecciona una ciudad"
              searchPlaceholder="Buscar ciudad..."
              emptyText="No se encontró la ciudad."
              isLoading={isLoadingCities}
              disabled={!!lockedCityId}
            />
          </div>

          {/* Categoría */}
          <div className="flex flex-col gap-2 items-start">
            <Label>Categoría</Label>
            <Combobox
              options={categoryOptions}
              value={selectedCategory}
              onValueChange={setSelectedCategory}
              placeholder="Selecciona una categoría"
              searchPlaceholder="Buscar categoría..."
              emptyText="No se encontró la categoría."
              isLoading={isLoadingCategories}
            />
          </div>

          {/* Estado */}
          <div className="flex flex-col gap-2 items-start">
            <Label>Estado</Label>
            <Combobox
              options={stateOptions}
              value={selectedState}
              onValueChange={setSelectedState}
              placeholder="Selecciona un estado"
              searchPlaceholder="Buscar estado..."
              emptyText="No se encontró el estado."
              clearable
            />
          </div>
        </div>

        <div className="flex justify-end mt-4">
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
      </CardContent>
    </Card>
  );
}
