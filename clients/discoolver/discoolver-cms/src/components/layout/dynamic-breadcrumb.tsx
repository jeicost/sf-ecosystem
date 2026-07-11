"use client";

import { getBusinessById } from "@/app/actions/business";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/config/routes";
import { DEFAULT_LANGUAGE } from "@/types/language";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface BreadcrumbItem {
  label: string;
  href: string;
  isCurrentPage: boolean;
  isLoading?: boolean;
  isDynamic?: boolean;
  dynamicId?: string;
  parentSegment?: string;
}

export function DynamicBreadcrumb() {
  const pathname = usePathname();
  const [dynamicLabels, setDynamicLabels] = useState<Record<string, string>>(
    {}
  );
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {}
  );

  // Helper function to format path segments
  const formatSegment = (segment: string) => {
    return segment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Helper function to check if a segment is a numeric ID
  const isNumericId = (segment: string) => {
    return /^\d+$/.test(segment);
  };

  // Fetch dynamic labels for numeric IDs
  useEffect(() => {
    const segments = pathname.split("/").filter(Boolean);

    segments.forEach((segment, index) => {
      if (/^\d+$/.test(segment)) {
        const parentSegment = index > 0 ? segments[index - 1] : "";
        const cacheKey = `${parentSegment}-${segment}`;

        // Skip if we already have this data or are currently loading it
        if (dynamicLabels[cacheKey] || loadingStates[cacheKey]) {
          return;
        }

        // Mark as loading
        setLoadingStates((prev) => ({
          ...prev,
          [cacheKey]: true,
        }));

        // Fetch data based on parent segment
        if (parentSegment === "recommended") {
          getBusinessById(parseInt(segment, 10), DEFAULT_LANGUAGE)
            .then((business) => {
              setDynamicLabels((prev) => ({
                ...prev,
                [cacheKey]: business.title,
              }));
              setLoadingStates((prev) => ({
                ...prev,
                [cacheKey]: false,
              }));
            })
            .catch((error) => {
              console.error("Error fetching dynamic label:", error);
              setDynamicLabels((prev) => ({
                ...prev,
                [cacheKey]: segment,
              }));
              setLoadingStates((prev) => ({
                ...prev,
                [cacheKey]: false,
              }));
            });
        }
      }
    });
  }, [pathname, dynamicLabels, loadingStates]);

  // Generate breadcrumb items from pathname
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const segments = pathname.split("/").filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      {
        label: "Dashboard",
        href: ROUTES.DASHBOARD,
        isCurrentPage: pathname === ROUTES.DASHBOARD,
      },
    ];

    // Build breadcrumb path
    let currentPath = "";
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === segments.length - 1;

      // Skip the dashboard segment since it's our root
      if (segment === "dashboard") return;

      // Check if this segment is a numeric ID
      if (isNumericId(segment)) {
        const parentSegment = index > 0 ? segments[index - 1] : "";
        const cacheKey = `${parentSegment}-${segment}`;

        breadcrumbs.push({
          label: dynamicLabels[cacheKey] || segment,
          href: currentPath,
          isCurrentPage: isLast,
          isLoading: loadingStates[cacheKey],
          isDynamic: true,
          dynamicId: segment,
          parentSegment,
        });
      } else {
        breadcrumbs.push({
          label: formatSegment(segment),
          href: currentPath,
          isCurrentPage: isLast,
        });
      }
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.href} className="flex gap-2 items-center">
            {index > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {crumb.isCurrentPage ? (
                <BreadcrumbPage>
                  {crumb.isLoading ? (
                    <Skeleton className="w-24 h-4" />
                  ) : (
                    crumb.label
                  )}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={crumb.href}>
                  {crumb.isLoading ? (
                    <Skeleton className="w-24 h-4" />
                  ) : (
                    crumb.label
                  )}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
