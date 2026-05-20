// Shared Supabase Client & Types
export * from '@supabase/supabase-js';
export * from '@supabase/ssr';

// Factory functions for app-specific client creation
// Each app passes its own SUPABASE_URL and SUPABASE_KEY
export { createClient } from '@supabase/supabase-js';
export { createServerClient, createBrowserClient } from '@supabase/ssr';
