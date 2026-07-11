"use server";

import { apiClient } from "@/lib/api-client";
import { getAuthToken } from "@/lib/auth";
import { ApiError } from "@/types/api";
import type { CategoryListResponse } from "@/types/category";
import type { LanguageCode } from "@/types/language";
import { DEFAULT_LANGUAGE } from "@/types/language";

/**
 * Get categories for a specific language
 * @param language - Language code (e.g., 'es', 'en')
 * @returns List of categories or throws an error
 */
export async function getCategories(
  language: LanguageCode = DEFAULT_LANGUAGE
): Promise<CategoryListResponse> {
  try {
    // Get the auth token for authenticated request
    const token = await getAuthToken();

    if (!token) {
      throw new Error("Authentication required");
    }

    const endpoint = `/category/${language}`;

    const response = await apiClient.get<CategoryListResponse>(endpoint, {
      token,
    });

    return response;
  } catch (error) {
    if (error instanceof ApiError) {
      // Re-throw API errors so they can be handled by the client
      throw error;
    }
    if (error instanceof Error) {
      throw error;
    }
    throw error;
  }
}

/**
 * Get subcategories for a specific category and language
 * @param categoryId - Parent category ID
 * @param language - Language code (e.g., 'es', 'en')
 * @returns List of subcategories or throws an error
 */
export async function getSubcategoriesByCategoryId(
  categoryId: number,
  language: LanguageCode = DEFAULT_LANGUAGE
): Promise<CategoryListResponse> {
  try {
    // Get the auth token for authenticated request
    const token = await getAuthToken();

    if (!token) {
      throw new Error("Authentication required");
    }

    const endpoint = `/subcategory/${categoryId}/${language}`;

    const response = await apiClient.get<CategoryListResponse>(endpoint, {
      token,
    });

    return response;
  } catch (error) {
    if (error instanceof ApiError) {
      // Re-throw API errors so they can be handled by the client
      throw error;
    }
    if (error instanceof Error) {
      throw error;
    }
    throw error;
  }
}
