"use client";

import {
  getCategories,
  getSubcategoriesByCategoryId,
} from "@/app/actions/category";
import { getCities } from "@/app/actions/city";
import { saveGooglePlace } from "@/app/actions/google-place";
import { Button } from "@/components/ui/button";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { GooglePlace, SaveGooglePlaceRequest } from "@/types";
import { DEFAULT_LANGUAGE } from "@/types/language";
import { useQuery } from "@tanstack/react-query";
import {
  Check,
  Clock,
  Globe,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Phone,
  Star,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface Props {
  place: GooglePlace;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

export function GooglePlaceEditDialog({
  place,
  open,
  onOpenChange,
  onSaved,
}: Props) {
  const [isSaving, setIsSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(
    new Set(place.photos.slice(0, 5).map((p) => p.photoReference)),
  );

  const form = useForm<SaveGooglePlaceRequest>({
    defaultValues: {
      state: 1,
      title: place.name,
      descriptionShort: "",
      ogTitle: place.name,
      ogDescription: "",
      showInRecommended: false,
      showInCalendar: false,
      outstanding: false,
      sponsored: false,
      outstandingInCategory: false,
      // Import Google Places data by default
      phoneNumber: place.phoneNumber || "",
      web: place.website || "",
      address: place.address || "",
      latitude: place.latitude,
      longitude: place.longitude,
      importImages: true,
      selectedPhotoReferences: place.photos
        .slice(0, 5)
        .map((p) => p.photoReference),
    },
  });

  // Fetch cities
  const { data: cities, isLoading: isLoadingCities } = useQuery({
    queryKey: ["cities", DEFAULT_LANGUAGE],
    queryFn: () => getCities(),
  });

  // Fetch categories
  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ["categories", DEFAULT_LANGUAGE],
    queryFn: () => getCategories(),
  });

  // Fetch subcategories (only when a category is selected)
  const { data: subcategories, isLoading: isLoadingSubcategories } = useQuery({
    queryKey: ["subcategories", selectedCategory, DEFAULT_LANGUAGE],
    queryFn: async () => {
      try {
        if (!selectedCategory) return [];
        return await getSubcategoriesByCategoryId(parseInt(selectedCategory));
      } catch (err) {
        throw err;
      }
    },
    enabled: !!selectedCategory,
  });

  // Transform cities to ComboboxOption format
  const cityOptions: ComboboxOption[] =
    cities?.map((city) => ({
      value: city.idCity.toString(),
      label: city.name ?? "",
    })) || [];

  // Filter main categories (those without a parent)
  const mainCategories = categories?.filter((c) => !c.idParentCategory) || [];

  // Transform categories to ComboboxOption format
  const categoryOptions: ComboboxOption[] =
    mainCategories.map((category) => ({
      value: category.idCategory.toString(),
      label: category.name ?? "",
    })) || [];

  // Transform subcategories to ComboboxOption format
  const subcategoryOptions: ComboboxOption[] =
    subcategories?.map((subcategory) => ({
      value: subcategory.idCategory.toString(),
      label: subcategory.name ?? "",
    })) || [];

  const handlePhotoToggle = (photoReference: string) => {
    const newSelected = new Set(selectedPhotos);
    if (newSelected.has(photoReference)) {
      newSelected.delete(photoReference);
    } else {
      newSelected.add(photoReference);
    }
    setSelectedPhotos(newSelected);
    form.setValue("selectedPhotoReferences", Array.from(newSelected));
    form.setValue("importImages", newSelected.size > 0);
  };

  const onSubmit = async (data: SaveGooglePlaceRequest) => {
    try {
      setIsSaving(true);
      // Ensure selected photos are included
      data.selectedPhotoReferences = Array.from(selectedPhotos);
      data.importImages = selectedPhotos.size > 0;
      await saveGooglePlace(place.placeId, data);
      toast.success("Lugar guardado exitosamente");
      onOpenChange(false);
      form.reset();
      setSelectedPhotos(new Set());
      onSaved?.();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error al guardar el lugar";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Guardar lugar de Google</DialogTitle>
          <DialogDescription>
            Completa la información para guardar este lugar como negocio en
            Discoolver. Los datos de Google Places se pueden importar
            automáticamente.
          </DialogDescription>
        </DialogHeader>

        {/* Google Places Info Preview */}
        <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Información de Google Places
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {place.rating !== undefined && (
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span>{Number(place.rating).toFixed(1)}</span>
                {place.userRatingsTotal !== undefined && (
                  <span className="text-muted-foreground">
                    ({place.userRatingsTotal})
                  </span>
                )}
              </div>
            )}
            {place.phoneNumber && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span className="truncate">{place.phoneNumber}</span>
              </div>
            )}
            {place.website && (
              <div className="flex items-center gap-2 col-span-2">
                <Globe className="w-4 h-4" />
                <span className="truncate text-xs">
                  {place.website.replace(/^https?:\/\//, "")}
                </span>
              </div>
            )}
            {place.openingHours?.openNow !== undefined && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span
                  className={
                    place.openingHours.openNow
                      ? "text-green-600 font-medium"
                      : "text-red-600 font-medium"
                  }
                >
                  {place.openingHours.openNow ? "Abierto" : "Cerrado"}
                </span>
              </div>
            )}
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Información Básica</h3>

              <FormField
                control={form.control}
                name="state"
                rules={{ required: "El estado es requerido" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecciona un estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">Activo</SelectItem>
                        <SelectItem value="0">Inactivo</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                rules={{ required: "El título es requerido" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nombre del negocio" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="descriptionShort"
                rules={{ required: "La descripción corta es requerida" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción Corta</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Descripción breve del negocio"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Import Google Places Data */}
              <div className="space-y-3 pt-2 border-t">
                <h4 className="text-sm font-semibold">
                  Importar datos de Google Places
                </h4>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dirección</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input
                            {...field}
                            placeholder="Dirección"
                            value={field.value || place.address || ""}
                          />
                          {place.address && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => field.onChange(place.address)}
                            >
                              Usar de Google
                            </Button>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input
                            {...field}
                            placeholder="Teléfono"
                            value={field.value || place.phoneNumber || ""}
                          />
                          {place.phoneNumber && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => field.onChange(place.phoneNumber)}
                            >
                              Usar de Google
                            </Button>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="web"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sitio Web</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input
                            {...field}
                            placeholder="https://ejemplo.com"
                            value={field.value || place.website || ""}
                          />
                          {place.website && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => field.onChange(place.website)}
                            >
                              Usar de Google
                            </Button>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {(place.latitude !== undefined ||
                  place.longitude !== undefined) && (
                  <div className="grid grid-cols-2 gap-2">
                    <FormField
                      control={form.control}
                      name="latitude"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Latitud</FormLabel>
                          <FormControl>
                            <div className="flex gap-2">
                              <Input
                                {...field}
                                type="number"
                                step="any"
                                placeholder="Latitud"
                                value={
                                  field.value?.toString() ||
                                  place.latitude?.toString() ||
                                  ""
                                }
                              />
                              {place.latitude !== undefined && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => field.onChange(place.latitude)}
                                >
                                  Usar
                                </Button>
                              )}
                            </div>
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
                            <div className="flex gap-2">
                              <Input
                                {...field}
                                type="number"
                                step="any"
                                placeholder="Longitud"
                                value={
                                  field.value?.toString() ||
                                  place.longitude?.toString() ||
                                  ""
                                }
                              />
                              {place.longitude !== undefined && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    field.onChange(place.longitude)
                                  }
                                >
                                  Usar
                                </Button>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* SEO Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Información SEO</h3>

              <FormField
                control={form.control}
                name="ogTitle"
                rules={{ required: "El título OG es requerido" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>OG Title</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Título para redes sociales"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ogDescription"
                rules={{ required: "La descripción OG es requerida" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>OG Description</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Descripción para redes sociales"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Visibility Options */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Opciones de Visibilidad</h3>

              <FormField
                control={form.control}
                name="showInRecommended"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Mostrar en recomendados
                      </FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="showInCalendar"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Mostrar en calendario
                      </FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="outstanding"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Destacado</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sponsored"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Patrocinado</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="outstandingInCategory"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Destacado en categoría
                      </FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Optional Fields */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Campos Opcionales</h3>

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ciudad</FormLabel>
                    <FormControl>
                      <Combobox
                        options={cityOptions}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Selecciona una ciudad"
                        searchPlaceholder="Buscar ciudad..."
                        emptyText="No se encontró la ciudad."
                        isLoading={isLoadingCities}
                        clearable
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoría</FormLabel>
                    <FormControl>
                      <Combobox
                        options={categoryOptions}
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedCategory(value);
                        }}
                        placeholder="Selecciona una categoría"
                        searchPlaceholder="Buscar categoría..."
                        emptyText="No se encontró la categoría."
                        isLoading={isLoadingCategories}
                        clearable
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subcategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subcategoría</FormLabel>
                    <FormControl>
                      <Combobox
                        options={subcategoryOptions}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Selecciona una subcategoría"
                        searchPlaceholder="Buscar subcategoría..."
                        emptyText="No se encontró la subcategoría."
                        isLoading={isLoadingSubcategories}
                        clearable
                        className="w-full"
                        disabled={!selectedCategory}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Idioma</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="es, en, etc." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="stayTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tiempo de estancia</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="2 horas" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Import Images Section */}
            {place.photos.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Importar Imágenes de Google Places
                  </h3>
                  <FormField
                    control={form.control}
                    name="importImages"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormControl>
                          <Switch
                            checked={field.value ?? selectedPhotos.size > 0}
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                              if (!checked) {
                                setSelectedPhotos(new Set());
                                form.setValue("selectedPhotoReferences", []);
                              } else {
                                const defaultPhotos = place.photos
                                  .slice(0, 5)
                                  .map((p) => p.photoReference);
                                setSelectedPhotos(new Set(defaultPhotos));
                                form.setValue(
                                  "selectedPhotoReferences",
                                  defaultPhotos,
                                );
                              }
                            }}
                          />
                        </FormControl>
                        <FormLabel className="!mt-0">
                          Importar imágenes
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                </div>

                {form.watch("importImages") && (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Selecciona las imágenes que deseas importar (
                      {selectedPhotos.size} de {place.photos.length}{" "}
                      seleccionadas)
                    </p>
                    <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto p-2 border rounded-lg">
                      {place.photos.map((photo) => {
                        const isSelected = selectedPhotos.has(
                          photo.photoReference,
                        );
                        return (
                          <div
                            key={photo.photoReference}
                            className="relative aspect-square group cursor-pointer"
                            onClick={() =>
                              handlePhotoToggle(photo.photoReference)
                            }
                          >
                            <div
                              className={`relative w-full h-full rounded-md overflow-hidden border-2 transition-all ${
                                isSelected
                                  ? "border-primary ring-2 ring-primary ring-offset-2"
                                  : "border-transparent hover:border-muted-foreground/50"
                              }`}
                            >
                              {photo.url ? (
                                <img
                                  src={photo.url}
                                  alt={`${place.name} - Foto`}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                                  <ImageIcon className="w-6 h-6 text-muted-foreground" />
                                </div>
                              )}
                              {isSelected && (
                                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                  <div className="bg-primary text-primary-foreground rounded-full p-1">
                                    <Check className="w-4 h-4" />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
