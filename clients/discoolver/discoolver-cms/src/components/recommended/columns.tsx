"use client";

import { deleteBusiness } from "@/app/actions/business";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROUTES } from "@/config/routes";
import { Business } from "@/types/business";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Copy, Edit, MoreHorizontal, Trash2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { memo, useMemo } from "react";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

/**
 * Build a detail URL that preserves the current search params.
 * Pure helper — safe to call from memoized components.
 */
function buildDetailUrl(businessId: number, searchParamsString: string): string {
  return searchParamsString
    ? `${ROUTES.RECOMMENDED_DETAIL(String(businessId))}?${searchParamsString}`
    : ROUTES.RECOMMENDED_DETAIL(String(businessId));
}

const ActionsCell = memo(function ActionsCell({
  business,
}: {
  business: Business;
}) {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const searchParamsString = searchParams.toString();
  const detailUrl = useMemo(
    () => buildDetailUrl(business.id, searchParamsString),
    [business.id, searchParamsString],
  );

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteBusiness(id),
    onSuccess: () => {
      // Invalidate and refetch businesses list
      queryClient.invalidateQueries({ queryKey: ["recommended"] });
      toast.success("Recomendado eliminado correctamente");
    },
    onError: (error) => {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Error al eliminar el recomendado";
      toast.error(errorMessage);
    },
  });

  const handleDelete = () => {
    if (confirm(`¿Estás seguro de eliminar "${business.name}"?`)) {
      deleteMutation.mutate(business.id);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="p-0 w-8 h-8">
          <span className="sr-only">Abrir menú</span>
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => navigator.clipboard.writeText(business.rawId)}
        >
          <Copy className="mr-2 w-4 h-4" />
          Copiar ID
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href={detailUrl}>
            <Edit className="mr-2 w-4 h-4" />
            Editar
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-500 focus:text-red-500"
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
        >
          <Trash2 className="mr-2 w-4 h-4 text-red-500" />
          {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

const NameCell = memo(function NameCell({ business }: { business: Business }) {
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const detailUrl = useMemo(
    () => buildDetailUrl(business.id, searchParamsString),
    [business.id, searchParamsString],
  );

  return (
    <div className="flex flex-col max-w-[350px]">
      <Link href={detailUrl}>
        <span className="font-medium truncate">{business.name}</span>
      </Link>
      <span className="text-xs truncate text-muted-foreground">
        {business.descriptionShort}
      </span>
    </div>
  );
});

export const columns: ColumnDef<Business>[] = [
  {
    accessorKey: "images",
    enableSorting: false,
    cell: ({ row }) => {
      const business = row.original;
      return (
        <Avatar className="w-10 h-10">
          <AvatarImage
            src={business.images.tab.miniature}
            alt={business.name}
          />
          <AvatarFallback>
            {business.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      );
    },
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Nombre
          <ArrowUpDown className="ml-2 w-4 h-4" />
        </Button>
      );
    },
    cell: ({ row }) => <NameCell business={row.original} />,
  },
  {
    accessorKey: "categoryName",
    header: "Categoría",
    enableSorting: false,
    cell: ({ row }) => {
      return (
        <div className="flex flex-col gap-1 max-w-[250px]">
          <Badge variant="secondary" className="w-fit">
            {row.original.categoryName}
          </Badge>
          {row.original.subcategoryName && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-sm truncate">
                  {row.original.subcategoryName}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" align="start">
                {row.original.subcategoryName}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "stateName",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Estado
          <ArrowUpDown className="ml-2 w-4 h-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "outstanding",
    header: "Destacado",
    cell: ({ row }) => {
      const business = row.original;
      return (
        <div className="flex flex-wrap gap-1">
          {business.outstanding && <Badge variant="default">Destacado</Badge>}
          {business.sponsored && (
            <Badge variant="default" className="bg-purple-600">
              Patrocinado
            </Badge>
          )}
          {business.outstandingInCategory && (
            <Badge variant="outline">En Categoría</Badge>
          )}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const business = row.original;
      if (value === "outstanding") return business.outstanding;
      if (value === "sponsored") return business.sponsored;
      if (value === "outstandingInCategory")
        return business.outstandingInCategory;
      return true;
    },
  },
  {
    id: "actions",
    enableSorting: false,
    cell: ({ row }) => <ActionsCell business={row.original} />,
  },
];
