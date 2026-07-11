"use server";

import type { User } from "@/types/user";
import { cookies } from "next/headers";

const AUTH_COOKIE_NAME = "auth_token";
const USER_COOKIE_NAME = "user_data";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/**
 * Set authentication cookies after successful login
 */
export async function setAuthCookies(user: User): Promise<void> {
  const cookieStore = await cookies();

  // Store token
  cookieStore.set(AUTH_COOKIE_NAME, user.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });

  // Store user data (without token for security)
  const { token, password, ...userData } = user;
  cookieStore.set(USER_COOKIE_NAME, JSON.stringify(userData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

/**
 * Get the authentication token
 */
export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME);
  return token?.value ?? null;
}

/**
 * Get the current user data
 */
export async function getCurrentUser(): Promise<Omit<
  User,
  "token" | "password"
> | null> {
  const cookieStore = await cookies();
  const userData = cookieStore.get(USER_COOKIE_NAME);

  if (!userData?.value) {
    return null;
  }

  try {
    return JSON.parse(userData.value);
  } catch {
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getAuthToken();
  return token !== null;
}

/**
 * Clear authentication cookies
 */
export async function clearAuthCookies(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
  cookieStore.delete(USER_COOKIE_NAME);
}
