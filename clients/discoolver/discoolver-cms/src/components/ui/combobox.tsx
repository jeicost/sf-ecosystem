"use client";

import { Check, ChevronsUpDown, X } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  options?: ComboboxOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  isLoading?: boolean;
  clearable?: boolean;
  disabled?: boolean;
}

export function Combobox({
  options = [],
  value,
  onValueChange,
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  emptyText = "No results found.",
  className,
  isLoading = false,
  clearable = false,
  disabled = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const selectedOption = React.useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  );

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onValueChange?.("");
  };

  // Filter and limit options for performance
  const filteredOptions = React.useMemo(() => {
    let result = options;
    if (search) {
      const lowerSearch = search.toLowerCase();
      result = options.filter((option) =>
        option.label.toLowerCase().includes(lowerSearch),
      );
    }
    return result.slice(0, 100);
  }, [options, search]);

  const commandItems = React.useMemo(
    () =>
      filteredOptions.map((option) => (
        <CommandItem
          key={option.value}
          value={option.label}
          onSelect={() => {
            onValueChange?.(option.value);
            setOpen(false);
          }}
        >
          <Check
            className={cn(
              "mr-2 h-4 w-4",
              value === option.value ? "opacity-100" : "opacity-0",
            )}
          />
          {option.label}
        </CommandItem>
      )),
    [filteredOptions, value, onValueChange],
  );

  return (
    <Popover
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) setSearch(""); // Reset search when closing
      }}
    >
      <div className="relative inline-flex w-full">
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("w-[250px] justify-between", className)}
            disabled={disabled}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Spinner className="h-4 w-4" />
              </span>
            ) : selectedOption ? (
              selectedOption.label
            ) : (
              placeholder
            )}
            <div className="ml-2 flex items-center gap-1">
              {clearable && value && <span className="w-4 h-4" />}
              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
            </div>
          </Button>
        </PopoverTrigger>
        {clearable && value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-10 top-1/2 -translate-y-1/2 z-10"
          >
            <X className="h-4 w-4 shrink-0 opacity-50 hover:opacity-100 cursor-pointer transition-opacity" />
          </button>
        )}
        <PopoverContent className={cn("w-[250px] p-0", className)}>
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={searchPlaceholder}
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>{commandItems}</CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </div>
    </Popover>
  );
}
