/**
 * Application routes as constants
 * All routes and API routes should be defined here
 */
export const ROUTES = {
  ROOT: "/",
  HOME: "/dashboard",
  DASHBOARD: "/dashboard",

  RECOMMENDED: "/recommended",
  RECOMMENDED_DETAIL: (id: string) => `/recommended/${id}`,
  RECOMMENDED_CREATE: "/recommended/create",

  PROFESSIONALS: "/professionals",
  TRANSACTIONS: "/transactions",

  LOGIN: "/login",
  SIGN_UP: "/signup",
};
