"use client";

import {
  addBusinessGalleryImage,
  createBusiness,
  deleteBusinessGalleryImage,
  getBusinessGallery,
  getBusinessStates,
  getCategories,
  updateBusiness,
  updateBusinessGallery,
  presignImageUpload,
} from "@/app/actions";
import { getCities } from "@/app/actions/city";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ROUTES } from "@/config/routes";
import { toDiscoolverGalleryCloudUrl } from "@/lib/gallery-image-url";
import type {
  BusinessDetail,
  BusinessGalleryImage,
  UpdateBusinessRequest,
} from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Eye,
  Globe,
  ImageIcon,
  MapPin,
  Save,
  Settings,
  ShoppingBag,
  Tags,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import {
  businessDetailToFormValues,
  businessFormSchema,
  getDefaultFormValues,
  normalizeBusinessFormValues,
  type BusinessFormValues,
} from "./business-form-schema";
import { BasicInfoTab } from "./tabs/basic-info-tab";
import { CategoriesTab } from "./tabs/categories-tab";
import { GalleryTab } from "./tabs/gallery-tab";
import { LocationTab } from "./tabs/location-tab";
import { MarketplaceTab } from "./tabs/marketplace-tab";
import { SeoTab } from "./tabs/seo-tab";
import { SettingsTab } from "./tabs/settings-tab";
import { VisibilityTab } from "./tabs/visibility-tab";

interface Props {
  business?: BusinessDetail;
  mode?: "create" | "edit";
}

export function BusinessEditForm({ business, mode = "edit" }: Props) {
  const router = useRouter();
  const isCreateMode = mode === "create";

  // Initialize form with react-hook-form
  const form = useForm<BusinessFormValues>({
    resolver: zodResolver(businessFormSchema),
    defaultValues: business
      ? businessDetailToFormValues(business)
      : getDefaultFormValues(),
    mode: "onBlur",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingImage, setIsDeletingImage] = useState<string | null>(null);
  const [isAddingImage, setIsAddingImage] = useState(false);

  // Form state for button disabling
  const isDirty = form.formState.isDirty;
  const isValid = form.formState.isValid;

  // Reset form when business changes (form is a stable ref, not needed in deps)
  useEffect(() => {
    if (business) {
      form.reset(businessDetailToFormValues(business));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business]);

  const languageWatch = useWatch({ name: "language", control: form.control });
  const language = (languageWatch || "es") as BusinessFormValues["language"];

  const queryClient = useQueryClient();

  const { data: cities = [], isLoading: isLoadingCities } = useQuery({
    queryKey: ["cities", language],
    queryFn: () => getCities(language),
    enabled: !!language,
    staleTime: Infinity,
  });

  const { data: states = [], isLoading: isLoadingStates } = useQuery({
    queryKey: ["business-states", language],
    queryFn: () => getBusinessStates(language),
    enabled: !!language,
    staleTime: Infinity,
  });

  const { data: allCategories = [] } = useQuery({
    queryKey: ["categories", language],
    queryFn: () => getCategories(language),
    enabled: !!language,
    staleTime: Infinity,
  });

  const {
    data: galleryData,
    isLoading: isLoadingGallery,
    error: galleryQueryError,
    refetch: refetchGallery,
  } = useQuery({
    queryKey: ["gallery", business?.id],
    queryFn: () => getBusinessGallery(business!.id),
    enabled: !isCreateMode && !!business?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const galleryImages = galleryData?.rows ?? [];
  const galleryError = galleryQueryError
    ? galleryQueryError instanceof Error
      ? galleryQueryError.message
      : "Error al cargar la galería"
    : null;

  const onSubmit = async (rawData: BusinessFormValues) => {
    setIsSaving(true);
    try {
      const data = normalizeBusinessFormValues(rawData);

      const locationString =
        data.latitude != null && data.longitude != null
          ? `${data.latitude}, ${data.longitude}`
          : data.location || "";

      const payload: UpdateBusinessRequest = {
        language: data.language,
        stateId: data.stateId ?? 0,
        title: data.title,
        inReccomended: data.inReccomended ?? false,
        inCalendar: data.inCalendar ?? false,
        ogTitle: data.ogTitle ?? "",
        ogDescription: data.ogDescription ?? "",
        keyWords: data.keyWords ?? "",
        subtitle: data.subtitle,
        descriptionShort: data.descriptionShort ?? "",
        subregionId: data.subregionId ?? 0,
        city: { idCity: data.city.idCity },
        categories: data.categories.map((c) => c.idCategory),
        subcategories: (data.subcategories ?? []).map((s) => s.idCategory),
        forYou: data.forYou ?? false,
        outstanding: data.outstanding ?? false,
        sponsored: data.sponsored ?? false,
        location: locationString,
        address: data.address ?? null,
        latitude: data.latitude ?? 0,
        longitude: data.longitude ?? 0,
        description: data.description ?? "",
        instagramHandle: data.instagramHandle ?? null,
        instagramUrl: data.instagramUrl ?? null,
        priceRange: data.priceRange ?? null,
        tipsThingsNotToMiss: data.tipsThingsNotToMiss ?? null,
        cashRegisterId: data.cashRegisterId ?? null,
        limitTickets: data.limitTickets ?? null,
        buyNote: data.buyNote ?? null,
        gatewayChannel: data.gatewayChannel ?? null,
        datesHours: data.datesHours ?? null,
        roofTopTerrace: data.roofTopTerrace ?? null,
        ticketsEntrance: data.ticketsEntrance ?? null,
        rateStars: data.rateStars ?? null,
        menuUrl: data.menuUrl ?? null,
        veganOptions: data.veganOptions ?? null,
        petFriendly: data.petFriendly ?? null,
        wheelchairAccessible: data.wheelchairAccessible ?? null,
        ageRestriction: data.ageRestriction ?? null,
        datesHours2: data.datesHours2 ?? null,
        guidedTours: data.guidedTours ?? null,
        suggestedVisitDuration: data.suggestedVisitDuration ?? null,
        difficultyLevel: data.difficultyLevel ?? null,
        mondayData: data.mondayData ?? null,
        mondayLock: data.mondayLock ?? false,
        tuesdayData: data.tuesdayData ?? null,
        tuesdayLock: data.tuesdayLock ?? false,
        wednesdayData: data.wednesdayData ?? null,
        wednesdayLock: data.wednesdayLock ?? false,
        thursdayData: data.thursdayData ?? null,
        thursdayLock: data.thursdayLock ?? false,
        fridayData: data.fridayData ?? null,
        fridayLock: data.fridayLock ?? false,
        saturdayData: data.saturdayData ?? null,
        saturdayLock: data.saturdayLock ?? false,
        sundayData: data.sundayData ?? null,
        sundayLock: data.sundayLock ?? false,
        web: data.web ?? null,
        blog: data.blog ?? null,
        stateCheck: data.stateCheck ?? null,
        schedule: data.schedule ?? null,
        youGoingWith: data.youGoingWith ?? null,
        bestTimeOfTheYear: data.bestTimeOfTheYear ?? null,
        stayTime: data.stayTime ?? null,
        visibleWeb: data.visibleWeb ?? false,
        visibleBlog: data.visibleBlog ?? false,
        inCity: data.inCity ?? false,
        essential: data.essential ?? false,
      };

      if (isCreateMode) {
        await createBusiness(payload);
        toast.success("Recomendado creado correctamente");
        router.push(ROUTES.RECOMMENDED);
      } else {
        await updateBusiness(business!.id, payload);
        form.reset(data);
        toast.success("Cambios guardados correctamente");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : isCreateMode
            ? "Error al crear el negocio"
            : "Error al guardar los cambios";
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!business) return;
    setIsDeletingImage(imageId);
    try {
      await deleteBusinessGalleryImage(business.id, imageId);
      await queryClient.invalidateQueries({
        queryKey: ["gallery", business.id],
      });
      toast.success("Imagen eliminada correctamente");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error al eliminar la imagen";
      toast.error(errorMessage);
    } finally {
      setIsDeletingImage(null);
    }
  };

  const handleAddImage = async (file: File) => {
    if (!business) return;
    setIsAddingImage(true);
    try {
      const presign = await presignImageUpload({
        businessId: business.id,
        contentType: file.type || "image/jpeg",
        filename: file.name,
      });

      const putRes = await fetch(presign.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": presign.signedContentType },
        body: file,
      });

      if (!putRes.ok) {
        throw new Error(`Error al subir imagen: ${putRes.status}`);
      }

      await addBusinessGalleryImage(business.id, {
        cloudUrl: toDiscoolverGalleryCloudUrl({
          publicUrl: presign.publicUrl,
          key: presign.key,
        }),
        type: "inGallery",
        title: file.name,
      });
      await queryClient.invalidateQueries({
        queryKey: ["gallery", business.id],
      });
      toast.success("Imagen añadida correctamente");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error al añadir la imagen";
      toast.error(errorMessage);
    } finally {
      setIsAddingImage(false);
    }
  };

  const handleImageTypeChange = async (
    image: BusinessGalleryImage,
    newType: string,
  ) => {
    if (!business) return;
    await updateBusinessGallery(business.id, { ...image, type: newType });
    await queryClient.invalidateQueries({ queryKey: ["gallery", business.id] });
  };

  const onInvalid = () => {
    toast.error("Hay errores en el formulario. Revisa todos los apartados antes de guardar.");
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="basic">
              <Building2 className="mr-2 w-4 h-4" />
              Información
            </TabsTrigger>
            <TabsTrigger value="location">
              <MapPin className="mr-2 w-4 h-4" />
              Ubicación
            </TabsTrigger>
            <TabsTrigger value="categories">
              <Tags className="mr-2 w-4 h-4" />
              Categorías
            </TabsTrigger>
            {!isCreateMode && (
              <TabsTrigger value="gallery">
                <ImageIcon className="mr-2 w-4 h-4" />
                Galería
              </TabsTrigger>
            )}
            <TabsTrigger value="seo">
              <Globe className="mr-2 w-4 h-4" />
              SEO & Metadata
            </TabsTrigger>
            {!isCreateMode && (
              <TabsTrigger value="marketplace">
                <ShoppingBag className="mr-2 w-4 h-4" />
                Marketplace
              </TabsTrigger>
            )}
            <TabsTrigger value="settings">
              <Settings className="mr-2 w-4 h-4" />
              Configuración
            </TabsTrigger>
            <TabsTrigger value="visibility">
              <Eye className="mr-2 w-4 h-4" />
              Visibilidad
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="basic"
            className="space-y-4 data-[state=inactive]:hidden"
            forceMount
          >
            <BasicInfoTab mode={mode} />
          </TabsContent>

          <TabsContent value="location" className="space-y-4">
            <LocationTab
              business={business}
              cities={cities}
              isLoadingCities={isLoadingCities}
            />
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <CategoriesTab mode={mode} allCategories={allCategories} />
          </TabsContent>

          {!isCreateMode && (
            <TabsContent value="gallery" className="space-y-4">
              <GalleryTab
                galleryImages={galleryImages}
                isLoadingGallery={isLoadingGallery}
                galleryError={galleryError}
                onRetry={refetchGallery}
                onDeleteImage={handleDeleteImage}
                onAddImage={handleAddImage}
                isDeletingImage={isDeletingImage}
                isAddingImage={isAddingImage}
                onImageTypeChange={handleImageTypeChange}
              />
            </TabsContent>
          )}

          <TabsContent value="seo" className="space-y-4">
            <SeoTab mode={mode} />
          </TabsContent>

          {!isCreateMode && (
            <TabsContent value="marketplace" className="space-y-4">
              <MarketplaceTab
                businessId={business!.id}
                initialTypeOfMembership={business!.typeOfMembership}
                initialUrlMembership={business!.parameters?.urlMembership ?? ""}
                deepLinkToken={business!.parameters?.deepLinkToken ?? ""}
              />
            </TabsContent>
          )}

          <TabsContent value="settings" className="space-y-4">
            <SettingsTab states={states} isLoadingStates={isLoadingStates} />
          </TabsContent>

          <TabsContent value="visibility" className="space-y-4">
            <VisibilityTab business={business} />
          </TabsContent>
        </Tabs>

        {/* Save Button - Fixed at bottom */}
        <div className="flex sticky bottom-0 gap-4 justify-end p-4 border-t bg-background">
          <Button
            type="button"
            variant="outline"
            disabled={isSaving}
            onClick={() => router.push(ROUTES.RECOMMENDED)}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={
              isSaving ||
              (!isCreateMode && !isDirty) ||
              (isCreateMode && !isValid)
            }
          >
            <Save className="mr-2 w-4 h-4" />
            {isSaving
              ? isCreateMode
                ? "Creando..."
                : "Guardando..."
              : isCreateMode
                ? "Crear Recomendado"
                : "Guardar Cambios"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
