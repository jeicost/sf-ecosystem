"use server";

import { apiClient } from "@/lib/api-client";
import { getAuthToken } from "@/lib/auth";
import { ApiError } from "@/types/api";
import type { CityListResponse, DestinationListResponse } from "@/types/city";
import type { LanguageCode } from "@/types/language";
import { DEFAULT_LANGUAGE } from "@/types/language";

/**
 * Get cities for a specific language
 * @param language - Language code (e.g., 'es', 'en')
 * @returns List of cities or throws an error
 */
export async function getCities(
  language: LanguageCode = DEFAULT_LANGUAGE
): Promise<CityListResponse> {
  try {
    // Get the auth token for authenticated request
    const token = await getAuthToken();

    if (!token) {
      throw new Error("Authentication required");
    }

    const endpoint = `/city/${language}`;

    const response = await apiClient.get<CityListResponse>(endpoint, {
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
 * Get active destinations/subregions for a specific language
 * @param language - Language code (e.g., 'es', 'en')
 * @returns List of active destinations or throws an error
 */
export async function getDestinations(
  language: LanguageCode = DEFAULT_LANGUAGE
): Promise<DestinationListResponse> {
  try {
    // Get the auth token for authenticated request
    const token = await getAuthToken();

    if (!token) {
      throw new Error("Authentication required");
    }

    const endpoint = `/subregion/${language}/actives`;

    const response = await apiClient.get<DestinationListResponse>(endpoint, {
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
 * Get cities for a specific subregion
 * @param language - Language code (e.g., 'es', 'en')
 * @param subregionId - Subregion ID
 * @returns List of cities in the subregion or throws an error
 */
export async function getCitiesBySubregion(
  language: LanguageCode = DEFAULT_LANGUAGE,
  subregionId: number
): Promise<CityListResponse> {
  try {
    // Get the auth token for authenticated request
    const token = await getAuthToken();

    if (!token) {
      throw new Error("Authentication required");
    }

    const endpoint = `/city/${language}/subregion/${subregionId}`;

    const response = await apiClient.get<CityListResponse>(endpoint, {
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
