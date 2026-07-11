"use client";

import { getSubcategoriesByCategoryId } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Category, LanguageCode } from "@/types";
import { DEFAULT_LANGUAGE } from "@/types/language";
import { useQuery } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { memo } from "react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { toast } from "sonner";
import type { BusinessFormValues } from "../business-form-schema";

interface Props {
  allCategories: Category[];
  mode?: "create" | "edit";
}

export const CategoriesTab = memo(function CategoriesTab({ allCategories, mode = "edit" }: Props) {
  const form = useFormContext<BusinessFormValues>();
  const language =
    (useWatch({ name: "language", control: form.control }) as LanguageCode) ||
    DEFAULT_LANGUAGE;
  const categories = useWatch({
    name: "categories",
    control: form.control,
  }) as BusinessFormValues["categories"];
  const isCreateMode = mode === "create";

  // Filter main categories (no parent)
  const mainCategories = allCategories.filter((c) => !c.idParentCategory);

  const categoryIds = categories.map((c) => c.idCategory).sort((a, b) => a - b);

  const { data: availableSubcategories = [], isLoading: isLoadingSubcategories } = useQuery({
    queryKey: ["subcategories", categoryIds, language],
    queryFn: async () => {
      const results = await Promise.all(
        categoryIds.map((id) => getSubcategoriesByCategoryId(id, language)),
      );
      const allSubcats = results.flat();
      return Array.from(
        new Map(allSubcats.map((cat: Category) => [cat.idCategory, cat])).values(),
      );
    },
    enabled: categoryIds.length > 0,
    staleTime: Infinity,
  });

  const {
    fields: categoryFields,
    append: appendCategory,
    remove: removeCategory,
    update: updateCategory,
  } = useFieldArray({
    control: form.control,
    name: "categories",
  });

  const {
    fields: subcategoryFields,
    append: appendSubcategory,
    remove: removeSubcategory,
    update: updateSubcategory,
  } = useFieldArray({
    control: form.control,
    name: "subcategories",
  });

  const handleCategoryChange = (index: number, newCategoryId: string) => {
    const newCategory = mainCategories.find(
      (cat) => cat.idCategory === parseInt(newCategoryId),
    );
    if (!newCategory) return;

    updateCategory(index, { idCategory: newCategory.idCategory });
  };

  const handleAddCategory = () => {
    if (mainCategories.length === 0) {
      toast.error("No hay categorías disponibles");
      return;
    }

    // Find first available category not already selected
    const selectedIds = new Set(categoryFields.map((c) => c.idCategory));
    const firstAvailable = mainCategories.find(
      (cat) => !selectedIds.has(cat.idCategory),
    );

    if (!firstAvailable) {
      toast.error("No hay más categorías disponibles");
      return;
    }

    appendCategory({ idCategory: firstAvailable.idCategory });
  };

  const handleRemoveCategory = (index: number) => {
    removeCategory(index);
  };

  const handleSubcategoryChange = (index: number, newSubcategoryId: string) => {
    const newSubcategory = availableSubcategories.find(
      (cat) => cat.idCategory === parseInt(newSubcategoryId),
    );
    if (!newSubcategory) return;

    updateSubcategory(index, { idCategory: newSubcategory.idCategory });
  };

  const handleAddSubcategory = () => {
    if (availableSubcategories.length === 0) {
      toast.error("Primero selecciona una categoría principal");
      return;
    }

    // Find first available subcategory not already selected
    const selectedIds = new Set(subcategoryFields.map((s) => s.idCategory));
    const firstAvailable = availableSubcategories.find(
      (cat) => !selectedIds.has(cat.idCategory),
    );

    if (!firstAvailable) {
      toast.error("No hay más subcategorías disponibles");
      return;
    }

    appendSubcategory({ idCategory: firstAvailable.idCategory });
  };

  const handleRemoveSubcategory = (index: number) => {
    removeSubcategory(index);
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {/* Categorías Principales */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Categorías Principales</CardTitle>
              <p className="text-sm text-muted-foreground">
                {categoryFields.length}{" "}
                {categoryFields.length === 1 ? "categoría" : "categorías"}
              </p>
            </div>
            {isCreateMode && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleAddCategory}
                disabled={mainCategories.length === 0}
              >
                <Plus className="mr-2 w-4 h-4" />
                Añadir
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {categoryFields.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {isCreateMode
                ? "Haz clic en 'Añadir' para agregar una categoría"
                : "No hay categorías principales"}
            </p>
          ) : (
            categoryFields.map((field, index) => (
              <FormField
                key={field.id}
                control={form.control}
                name={`categories.${index}.idCategory`}
                render={({ field: formField }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel htmlFor={`category-${index}`}>
                        Categoría {index + 1}
                      </FormLabel>
                      {isCreateMode && (
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRemoveCategory(index)}
                          className="h-6 w-6"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                    <Select
                      value={formField.value.toString()}
                      onValueChange={(value) =>
                        handleCategoryChange(index, value)
                      }
                    >
                      <FormControl>
                        <SelectTrigger
                          id={`category-${index}`}
                          className="w-full"
                        >
                          <SelectValue placeholder="Seleccionar categoría" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {mainCategories.map((category) => (
                          <SelectItem
                            key={category.idCategory}
                            value={category.idCategory.toString()}
                          >
                            <div className="flex items-center gap-2">
                              <span>{category.name}</span>
                              {category.adultOnly && (
                                <Badge
                                  variant="destructive"
                                  className="text-xs"
                                >
                                  +18
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      ID: {formField.value}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))
          )}
        </CardContent>
      </Card>

      {/* Subcategorías */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Subcategorías</CardTitle>
              <p className="text-sm text-muted-foreground">
                {subcategoryFields.length}{" "}
                {subcategoryFields.length === 1
                  ? "subcategoría"
                  : "subcategorías"}
                {isLoadingSubcategories && " • Cargando..."}
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleAddSubcategory}
              disabled={
                isLoadingSubcategories || availableSubcategories.length === 0
              }
            >
              <Plus className="mr-2 w-4 h-4" />
              Añadir
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {categoryFields.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Primero selecciona una categoría principal
            </p>
          ) : subcategoryFields.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay subcategorías seleccionadas
            </p>
          ) : (
            subcategoryFields.map((field, index) => {
              const subcategory = availableSubcategories.find(
                (cat) => cat.idCategory === field.idCategory,
              );
              return (
                <FormField
                  key={field.id}
                  control={form.control}
                  name={`subcategories.${index}.idCategory`}
                  render={({ field: formField }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel htmlFor={`subcategory-${index}`}>
                          Subcategoría {index + 1}
                          {subcategory?.esPrincipal && " (Principal)"}
                        </FormLabel>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRemoveSubcategory(index)}
                          className="h-6 w-6"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      <Select
                        value={formField.value.toString()}
                        onValueChange={(value) =>
                          handleSubcategoryChange(index, value)
                        }
                        disabled={isLoadingSubcategories}
                      >
                        <FormControl>
                          <SelectTrigger
                            id={`subcategory-${index}`}
                            className="w-full"
                          >
                            <SelectValue placeholder="Seleccionar subcategoría" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableSubcategories.map((category) => (
                            <SelectItem
                              key={category.idCategory}
                              value={category.idCategory.toString()}
                            >
                              <div className="flex items-center gap-2">
                                <span>{category.name}</span>
                                {category.adultOnly && (
                                  <Badge
                                    variant="destructive"
                                    className="text-xs"
                                  >
                                    +18
                                  </Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        ID: {formField.value}
                        {subcategory?.idParentCategory &&
                          ` • Padre: ${subcategory.idParentCategory}`}
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
});
