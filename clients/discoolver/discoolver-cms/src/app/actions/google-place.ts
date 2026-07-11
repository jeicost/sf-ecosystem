"use server";

import { apiClient } from "@/lib/api-client";
import { getAuthToken } from "@/lib/auth";
import type {
  GooglePlaceListResponse,
  GooglePlaceQueryParams,
  SaveGooglePlaceRequest,
} from "@/types";
import { ApiError } from "@/types/api";

/**
 * Searches for Google Places based on name, city, and category
 * @param params - Query parameters including name, city, and categoryName
 * @returns List of Google Places matching the search criteria
 */
export async function getGooglePlaces(
  params: GooglePlaceQueryParams,
): Promise<GooglePlaceListResponse> {
  try {
    const token = await getAuthToken();

    if (!token) {
      throw new Error("Authentication required");
    }

    const queryParams = new URLSearchParams({
      name: params.name,
      city: params.city,
      categoryName: params.categoryName,
    });

    const endpoint = `/google/place?${queryParams.toString()}`;
    const response = await apiClient.get<GooglePlaceListResponse>(endpoint, {
      token,
    });

    return response;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof Error) {
      throw error;
    }
    throw error;
  }
}

/**
 * Saves a Google Place with business information
 * @param placeId - Google Place ID
 * @param data - Business data to save
 * @returns Success response
 */
export async function saveGooglePlace(
  placeId: string,
  data: SaveGooglePlaceRequest,
): Promise<void> {
  try {
    const token = await getAuthToken();

    if (!token) {
      throw new Error("Authentication required");
    }

    const endpoint = `/google/place/${placeId}`;
    await apiClient.post(endpoint, data, { token });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof Error) {
      throw error;
    }
    throw error;
  }
}
