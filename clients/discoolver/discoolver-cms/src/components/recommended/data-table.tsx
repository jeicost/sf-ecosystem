"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ROUTES } from "@/config/routes";
import {
  ColumnDef,
  ColumnFiltersState,
  PaginationState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowLeft, ArrowRight, ChevronDown } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

const STORAGE_KEY = "recommended-table-state";

interface StoredTableState {
  sorting?: SortingState;
  columnFilters?: ColumnFiltersState;
  pagination?: PaginationState;
  columnVisibility?: VisibilityState;
}

/**
 * Load table state from localStorage
 * @returns Stored table state or null if not found
 */
function loadTableState(): StoredTableState | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

/**
 * Save table state to localStorage
 * @param state - Table state to save
 */
function saveTableState(state: StoredTableState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Silent fail if localStorage is not available
  }
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isMounted, setIsMounted] = React.useState(false);

  // Initialize state from URL params or localStorage
  const [sorting, setSorting] = React.useState<SortingState>(() => {
    // First try URL params
    const sortId = searchParams.get("sortId");
    const sortDesc = searchParams.get("sortDesc");
    if (sortId) {
      return [{ id: sortId, desc: sortDesc === "true" }];
    }

    // Then try localStorage
    const stored = loadTableState();
    if (stored?.sorting) {
      return stored.sorting;
    }

    return [];
  });

  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    () => {
      const filters: ColumnFiltersState = [];

      // First try URL params
      const nameFilter = searchParams.get("nameFilter");
      const outstandingFilter = searchParams.get("outstandingFilter");

      if (nameFilter || outstandingFilter) {
        if (nameFilter) {
          filters.push({ id: "name", value: nameFilter });
        }
        if (outstandingFilter) {
          filters.push({ id: "outstanding", value: outstandingFilter });
        }
        return filters;
      }

      // Then try localStorage
      const stored = loadTableState();
      if (stored?.columnFilters) {
        return stored.columnFilters;
      }

      return filters;
    }
  );

  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>(() => {
      const stored = loadTableState();
      return stored?.columnVisibility || {};
    });

  const [pagination, setPagination] = React.useState<PaginationState>(() => {
    // First try URL params
    const urlPage = searchParams.get("page");
    const urlPageSize = searchParams.get("pageSize");

    if (urlPage || urlPageSize) {
      return {
        pageIndex: parseInt(urlPage || "0"),
        pageSize: parseInt(urlPageSize || "10"),
      };
    }

    // Then try localStorage
    const stored = loadTableState();
    if (stored?.pagination) {
      return stored.pagination;
    }

    return {
      pageIndex: 0,
      pageSize: 10,
    };
  });

  // Set mounted flag after initial render
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Update URL and localStorage when state changes (but not on initial mount)
  React.useEffect(() => {
    // Skip URL update on initial mount to preserve incoming URL params
    if (!isMounted) return;

    // Preserve non-table params (city, category, state) from current URL
    const params = new URLSearchParams(searchParams.toString());

    // Update sorting params
    if (sorting.length > 0) {
      params.set("sortId", sorting[0].id);
      params.set("sortDesc", sorting[0].desc.toString());
    } else {
      params.delete("sortId");
      params.delete("sortDesc");
    }

    // Update filter params
    const nameFilter = columnFilters.find((f) => f.id === "name");
    if (nameFilter && nameFilter.value) {
      params.set("nameFilter", nameFilter.value as string);
    } else {
      params.delete("nameFilter");
    }

    const outstandingFilter = columnFilters.find((f) => f.id === "outstanding");
    if (outstandingFilter && outstandingFilter.value) {
      params.set("outstandingFilter", outstandingFilter.value as string);
    } else {
      params.delete("outstandingFilter");
    }

    // Update pagination params
    params.set("page", pagination.pageIndex.toString());
    params.set("pageSize", pagination.pageSize.toString());

    const newParamsString = params.toString();
    const currentParamsString = searchParams.toString();

    // Only update URL if params actually changed to prevent infinite loops
    if (newParamsString !== currentParamsString) {
      router.replace(`${ROUTES.RECOMMENDED}?${newParamsString}`, {
        scroll: false,
      });
    }

    // Save state to localStorage
    saveTableState({
      sorting,
      columnFilters,
      pagination,
      columnVisibility,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isMounted,
    sorting,
    columnFilters,
    pagination,
    columnVisibility,
    router,
    // Note: searchParams intentionally excluded to prevent infinite loops
    // We read from it inside the effect but don't react to its changes
  ]);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      pagination,
    },
  });

  return (
    <div className="space-y-4 w-full">
      <div className="flex gap-4 items-center">
        <Input
          placeholder="Filtrar por nombre..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <Select
          value={
            (table.getColumn("outstanding")?.getFilterValue() as string) ??
            "all"
          }
          onValueChange={(value) =>
            table
              .getColumn("outstanding")
              ?.setFilterValue(value === "all" ? "" : value)
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="outstanding">Destacados</SelectItem>
            <SelectItem value="sponsored">Patrocinados</SelectItem>
            <SelectItem value="outstandingInCategory">En Categoría</SelectItem>
          </SelectContent>
        </Select>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columnas <ChevronDown className="ml-2 w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Cambiar columnas</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No se encontraron resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-between items-center px-2">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} resultado(s) encontrado(s)
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Filas por página</p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue
                  placeholder={table.getState().pagination.pageSize}
                />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Página {table.getState().pagination.pageIndex + 1} de{" "}
            {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ArrowLeft />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ArrowRight />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
