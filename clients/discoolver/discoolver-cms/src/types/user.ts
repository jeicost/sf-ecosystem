/**
 * User-related types
 */

export interface Role {
  id: number;
  name: string;
  users: [];
  authority: string;
}

export interface Permission {
  id: number;
  name: string;
  users: [];
}

export interface User {
  id: number;
  login: string;
  password: null;
  token: string;
  name: string | null;
  surname: string | null;
  mail: string;
  phone: string | null;
  addresses: string | null;
  nif: string | null;
  birthDate: string | null;
  company: boolean;
  idRecommendedProducer: number | null;
  idRecommendeds: number[];
  idCompany: number;
  subregions: number[];
  cities: number[];
  roles: Role[];
  permissions: Permission[];
  admin: boolean;
  recommended: boolean;
}

export interface LoginRequest {
  user: string;
  password: string;
}

export type LoginResponse = User;
