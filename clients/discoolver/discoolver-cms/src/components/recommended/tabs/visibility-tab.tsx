"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { getLanguageName } from "@/config/languages";
import type { BusinessDetail } from "@/types/business";
import { useFormContext, useWatch } from "react-hook-form";
import type { BusinessFormValues } from "../business-form-schema";

interface VisibilityTabProps {
  business?: BusinessDetail;
}

export function VisibilityTab({ business }: VisibilityTabProps) {
  const form = useFormContext<BusinessFormValues>();
  const language = useWatch({ control: form.control, name: "language" });
  const subregionId = useWatch({ control: form.control, name: "subregionId" });

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Visibilidad General</CardTitle>
          <p className="text-sm text-muted-foreground">
            Controla dónde aparece el negocio en la plataforma
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[
              {
                id: "visibleWeb",
                label: "Visible en Web",
                description: "El negocio es visible en el sitio web público",
                icon: "🌐",
              },
              {
                id: "visibleBlog",
                label: "Visible en Blog",
                description: "Aparece en artículos y publicaciones del blog",
                icon: "📝",
              },
            ].map((item) => (
              <FormField
                key={item.id}
                control={form.control}
                name={item.id as keyof BusinessFormValues}
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center p-4 rounded-lg border transition-colors hover:bg-muted/50">
                      <div className="flex gap-3 items-start">
                        <span className="text-2xl">{item.icon}</span>
                        <div className="space-y-0.5">
                          <FormLabel
                            htmlFor={item.id}
                            className="text-base font-medium cursor-pointer"
                          >
                            {item.label}
                          </FormLabel>
                          <p className="text-sm text-muted-foreground">
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          id={item.id}
                          checked={Boolean(field.value)}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </div>
                  </FormItem>
                )}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Secciones de Contenido</CardTitle>
          <p className="text-sm text-muted-foreground">
            Define en qué secciones aparece el negocio
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            {
              id: "inReccomended",
              label: "Recomendados",
              description: "Aparece en la sección de recomendados",
              icon: "⭐",
            },
            {
              id: "inCalendar",
              label: "Calendario",
              description: "Se muestra en el calendario de eventos",
              icon: "📅",
            },
            {
              id: "inCity",
              label: "Ciudad",
              description: "Aparece en la vista de ciudad",
              icon: "🏙️",
            },
          ].map((item) => (
            <FormField
              key={item.id}
              control={form.control}
              name={item.id as keyof BusinessFormValues}
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between items-center p-4 rounded-lg border transition-colors hover:bg-muted/50">
                    <div className="flex gap-3 items-start">
                      <span className="text-2xl">{item.icon}</span>
                      <div className="space-y-0.5">
                        <FormLabel
                          htmlFor={item.id}
                          className="text-base font-medium cursor-pointer"
                        >
                          {item.label}
                        </FormLabel>
                        <p className="text-sm text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        id={item.id}
                        checked={Boolean(field.value)}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </div>
                </FormItem>
              )}
            />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Destacados y Promociones</CardTitle>
          <p className="text-sm text-muted-foreground">
            Opciones especiales de promoción y visibilidad
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[
              {
                id: "outstanding",
                label: "Destacado",
                description: "El negocio tiene prioridad visual en listados",
                icon: "🌟",
              },
              {
                id: "sponsored",
                label: "Patrocinado",
                description: "Marcado como contenido patrocinado premium",
                icon: "💎",
              },
              {
                id: "essential",
                label: "Esencial",
                description: "Categorizado como experiencia esencial",
                icon: "✨",
              },
              {
                id: "forYou",
                label: "Para Ti",
                description: "Aparece en recomendaciones personalizadas",
                icon: "🎯",
              },
            ].map((item) => (
              <FormField
                key={item.id}
                control={form.control}
                name={item.id as keyof BusinessFormValues}
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center p-4 rounded-lg border transition-colors hover:bg-muted/50">
                      <div className="flex flex-1 gap-3 items-start">
                        <span className="text-2xl">{item.icon}</span>
                        <div className="space-y-0.5 flex-1">
                          <div className="flex items-center">
                            <FormLabel
                              htmlFor={item.id}
                              className="text-base font-medium cursor-pointer"
                            >
                              {item.label}
                            </FormLabel>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          id={item.id}
                          checked={Boolean(field.value)}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </div>
                  </FormItem>
                )}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Información Adicional</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>ID Negocio</Label>
            <p className="text-sm text-muted-foreground">
              {business?.id || "N/A"}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Idioma</Label>
            <p className="text-sm text-muted-foreground">
              {getLanguageName(language)}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Subregión ID</Label>
            <p className="text-sm text-muted-foreground">
              {subregionId}
            </p>
          </div>

          <Separator />

          {business && (
            <div className="space-y-2">
              <Label>Datos de Usuario</Label>
              <div className="p-3 space-y-1 rounded-md border bg-muted/50">
                <p className="text-sm">
                  <span className="font-medium">Mail:</span>{" "}
                  {business.parametersUser.mail}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Login:</span>{" "}
                  {business.parametersUser.login}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Name:</span>{" "}
                  {business.parametersUser.name}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
