"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import type { GooglePlace } from "@/types";
import {
  Clock,
  Globe,
  Image as ImageIcon,
  MapPin,
  Phone,
  Save,
  Search as SearchIcon,
  Star,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { GooglePlaceEditDialog } from "./google-place-edit-dialog";

interface Props {
  places: GooglePlace[];
  isLoading?: boolean;
  onPlaceSaved?: () => void;
}

export function GooglePlaceResults({
  places,
  isLoading = false,
  onPlaceSaved,
}: Props) {
  const [selectedPlace, setSelectedPlace] = useState<GooglePlace | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleEditPlace = (place: GooglePlace) => {
    setSelectedPlace(place);
    setIsDialogOpen(true);
  };

  const handlePlaceSaved = () => {
    setSelectedPlace(null);
    onPlaceSaved?.();
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-5/6"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (places.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SearchIcon />
          </EmptyMedia>
          <EmptyTitle>No se encontraron lugares</EmptyTitle>
          <EmptyDescription>
            Intenta ajustar los criterios de búsqueda
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          Resultados ({places.length} lugar{places.length !== 1 ? "es" : ""})
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-4">
        {places.map((place) => (
          <Card key={place.placeId} className="overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{place.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 flex-1">
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{place.address}</span>
              </div>

              {/* Rating */}
              {place.rating !== undefined && (
                <div className="flex items-center gap-2 text-sm">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">
                    {Number(place.rating).toFixed(1)}
                  </span>
                  {place.userRatingsTotal !== undefined && (
                    <span className="text-muted-foreground">
                      ({place.userRatingsTotal} reseñas)
                    </span>
                  )}
                </div>
              )}

              {/* Phone */}
              {place.phoneNumber && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <a
                    href={`tel:${place.phoneNumber}`}
                    className="hover:text-foreground transition-colors"
                  >
                    {place.phoneNumber}
                  </a>
                </div>
              )}

              {/* Website */}
              {place.website && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Globe className="w-4 h-4 flex-shrink-0" />
                  <a
                    href={place.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors truncate"
                  >
                    {place.website.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              )}

              {/* Opening Hours */}
              {place.openingHours?.openNow !== undefined && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  <span
                    className={
                      place.openingHours.openNow
                        ? "text-green-600 font-medium"
                        : "text-red-600 font-medium"
                    }
                  >
                    {place.openingHours.openNow ? "Abierto ahora" : "Cerrado"}
                  </span>
                </div>
              )}

              {/* Photos */}
              {place.photos.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <ImageIcon className="w-4 h-4" />
                    <span>
                      {place.photos.length} foto
                      {place.photos.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {place.photos.slice(0, 4).map((photo, index) => {
                      const isLast = index === 3;
                      const remainingPhotos = place.photos.length - 4;
                      const showOverlay = isLast && remainingPhotos > 0;

                      return (
                        <div
                          key={photo.photoReference}
                          className="relative aspect-square bg-gray-100 rounded-md overflow-hidden"
                        >
                          {photo.url ? (
                            <Image
                              src={photo.url}
                              alt={`${place.name} - Foto ${index + 1}`}
                              fill
                              sizes="(max-width: 1024px) 25vw, 12vw"
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <ImageIcon className="w-6 h-6 text-gray-300" />
                            </div>
                          )}
                          {showOverlay && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <span className="text-white font-semibold text-lg">
                                +{remainingPhotos}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="text-xs text-muted-foreground font-mono break-all">
                Place ID: {place.placeId}
              </div>
            </CardContent>
            <CardFooter>
              <Button
                size="sm"
                onClick={() => handleEditPlace(place)}
                className="w-full"
              >
                <Save className="w-4 h-4 mr-2" />
                Guardar
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {selectedPlace && (
        <GooglePlaceEditDialog
          place={selectedPlace}
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSaved={handlePlaceSaved}
        />
      )}
    </div>
  );
}
