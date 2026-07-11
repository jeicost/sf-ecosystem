"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import type { BusinessGalleryImage } from "@/types/business";
import { discoolverGalleryDeliveryUrl } from "@/lib/gallery-image-url";
import { Image as ImageIcon, Info, Plus, X } from "lucide-react";
import NextImage from "next/image";
import type { ImageLoaderProps } from "next/image";
import { useRef, useState } from "react";
import { toast } from "sonner";

/** CDN URLs use preset width/height from gallery-image-url — Next must not append arbitrary transforms. */
function galleryImagePassthroughLoader({ src }: ImageLoaderProps): string {
  return src;
}

interface Props {
  galleryImages: BusinessGalleryImage[];
  isLoadingGallery: boolean;
  galleryError: string | null;
  onRetry: () => void;
  onDeleteImage: (imageId: string) => void;
  onAddImage: (file: File) => void;
  isDeletingImage?: string | null;
  isAddingImage?: boolean;
  onImageTypeChange: (image: BusinessGalleryImage, newType: string) => Promise<void>;
}

const IMAGE_TYPE_OPTIONS = [
  { value: "inTab", label: "En Tab" },
  { value: "main", label: "Principal" },
  { value: "inGallery", label: "En Galería" },
] as const;

export function GalleryTab({
  galleryImages,
  isLoadingGallery,
  galleryError,
  onRetry,
  onDeleteImage,
  onAddImage,
  isDeletingImage,
  isAddingImage,
  onImageTypeChange,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [updatingImageId, setUpdatingImageId] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onAddImage(file);
      // Reset input so the same file can be re-selected if needed
      e.target.value = "";
    }
  };

  const handleTypeChange = async (
    image: BusinessGalleryImage,
    newType: string,
  ) => {
    if (image.type === newType) return;

    setUpdatingImageId(image.id);
    try {
      await onImageTypeChange(image, newType);
      toast.success("Tipo de imagen actualizado");
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "Error al actualizar el tipo";
      console.log(msg, error);
      toast.error(msg);
    } finally {
      setUpdatingImageId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Galería de Imágenes</CardTitle>
        <p className="text-sm text-muted-foreground">
          Imágenes del negocio ({galleryImages.length})
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert className="bg-blue-50/50 border-blue-100 dark:bg-blue-950/20 dark:border-blue-900">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertTitle className="text-blue-800 dark:text-blue-300">
            Información de la Galería
          </AlertTitle>
          <AlertDescription className="text-blue-700 dark:text-blue-400">
            <ul className="list-disc pl-4 space-y-1 mt-2">
              <li>
                <strong>Principal:</strong> Es la foto que aparece en la
                cabecera de la ficha.
              </li>
              <li>
                <strong>Tab:</strong> Es la fotografía de la tarjeta del
                recomendado.
              </li>
              <li>
                <strong>Galeria:</strong> Todas las fotos que quieres que
                aparezca en la galería de fotos de tu empresa.
              </li>
              <li>
                Clicando en editar podras recortar la fotografía siempre
                guardando las proporciones adecuadas.
              </li>
              <li>
                <strong>Ayuda:</strong>{" "}
                <a
                  href="https://www.iloveimg.com/es/comprimir-imagen/comprimir-jpg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-blue-800 dark:hover:text-blue-200"
                >
                  https://www.iloveimg.com/es/comprimir-imagen/comprimir-jpg
                </a>
              </li>
            </ul>
          </AlertDescription>
        </Alert>

        {isLoadingGallery && (
          <div className="flex justify-center items-center py-12">
            <Spinner className="w-8 h-8" />
          </div>
        )}

        {galleryError && !isLoadingGallery && (
          <div className="py-8 text-center">
            <p className="text-sm text-destructive">{galleryError}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="mt-4"
            >
              Reintentar
            </Button>
          </div>
        )}

        {!isLoadingGallery && !galleryError && galleryImages.length === 0 && (
          <div className="py-8 text-center text-muted-foreground">
            <ImageIcon className="mx-auto mb-2 w-12 h-12 opacity-50" />
            <p className="text-sm">No hay imágenes en la galería</p>
          </div>
        )}

        {!isLoadingGallery && !galleryError && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {galleryImages.map((image) => (
              <div
                key={image.id}
                className="relative overflow-hidden rounded-lg border bg-card"
              >
                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => onDeleteImage(image.id)}
                  disabled={isDeletingImage === image.id}
                  className="absolute top-2 right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80 disabled:opacity-50"
                  aria-label="Eliminar imagen"
                >
                  {isDeletingImage === image.id ? (
                    <Spinner className="h-3 w-3" />
                  ) : (
                    <X className="h-3 w-3" />
                  )}
                </button>

                <div className="relative aspect-video w-full overflow-hidden bg-muted">
                  <NextImage
                    loader={galleryImagePassthroughLoader}
                    src={discoolverGalleryDeliveryUrl(image.cloudUrl, "card")}
                    alt={image.alt || image.title || `Imagen ${image.id}`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                  />
                </div>
                <div className="p-3 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground truncate">
                    {image.title}
                  </p>
                  <div className="flex items-center gap-2">
                    <Select
                      value={image.type}
                      onValueChange={(val) => handleTypeChange(image, val)}
                      disabled={updatingImageId === image.id}
                    >
                      <SelectTrigger className="h-8 w-full text-xs">
                        <SelectValue placeholder="Seleccionar tipo" />
                        {updatingImageId === image.id && (
                          <Spinner className="ml-1 w-3 h-3 shrink-0" />
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        {IMAGE_TYPE_OPTIONS.map((opt) => (
                          <SelectItem
                            key={opt.value}
                            value={opt.value}
                            className="text-xs"
                          >
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {image.caption && <p className="text-sm">{image.caption}</p>}
                  {image.alt && (
                    <p className="text-xs text-muted-foreground">
                      Alt: {image.alt}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {/* Add image card */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isAddingImage}
              className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/30 text-muted-foreground transition-colors hover:border-muted-foreground/60 hover:bg-muted/60 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAddingImage ? (
                <Spinner className="h-6 w-6" />
              ) : (
                <Plus className="h-6 w-6" />
              )}
              <span className="text-sm font-medium">Añadir imagen</span>
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
