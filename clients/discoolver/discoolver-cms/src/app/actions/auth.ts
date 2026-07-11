"use server";

/**
 * Authentication actions
 */
import { apiClient } from "@/lib/api-client";
import { clearAuthCookies, setAuthCookies } from "@/lib/auth";
import { ApiError } from "@/types/api";
import type { LoginRequest, LoginResponse } from "@/types/user";

/**
 * Login action - authenticates a user
 * @param credentials - User credentials (username and password)
 * @returns User data with token or throws an error
 */
export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  try {
    const response = await apiClient.post<LoginResponse>("/user", credentials);

    // Store authentication data in cookies
    await setAuthCookies(response);

    return response;
  } catch (error) {
    if (error instanceof ApiError) {
      // Re-throw API errors so they can be handled by the client
      throw error;
    }
    // Handle unexpected errors
    throw new Error("An unexpected error occurred during login");
  }
}

/**
 * Logout action - clears user session
 */
export async function logout(): Promise<void> {
  const { redirect } = await import("next/navigation");
  const { ROUTES } = await import("@/config/routes");

  await clearAuthCookies();
  redirect(ROUTES.LOGIN);
}
