// Shared TypeScript types for SF Ecosystem
// Each product's Supabase schema extends or imports these base types

export type Database = {
  // TODO: Auto-generate from Supabase schema introspection
};

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
