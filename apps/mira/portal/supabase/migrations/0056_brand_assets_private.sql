-- Migra el bucket brand-assets (Supabase Storage) de público a privado.
-- Recibe adjuntos de negocio sensibles (P&L, hilos de email de quick actions)
-- y logos de cliente -- hoy cualquiera con la URL podía leerlos sin
-- autenticación. A partir de ahora toda lectura pasa por /api/brand-assets
-- (signed URL de 1h, valida sesión + grant sobre el cliente) o por descarga
-- directa server-side con el service role. Ver docs/DEBT.md.

UPDATE storage.buckets SET public = false WHERE id = 'brand-assets';

-- Backfill: las filas reales existentes (6 logos de cliente: Salsa, Dadybox,
-- Discoolver, Startup Factory, NC Global, Adrian Grooves) tenían guardada la
-- URL pública completa de Supabase Storage -- se reescriben al proxy firmado
-- para que sigan resolviendo tras el cambio, sin tocar ningún otro dato.
UPDATE clients
SET logo_url = '/api/brand-assets?path=' || split_part(split_part(logo_url, '/storage/v1/object/public/brand-assets/', 2), '?', 1)
WHERE logo_url LIKE '%/storage/v1/object/public/brand-assets/%';

UPDATE brand_profiles
SET brand_data = jsonb_set(
  brand_data,
  '{visual_identity,logo,primary_url}',
  to_jsonb(
    '/api/brand-assets?path=' || split_part(
      split_part(brand_data -> 'visual_identity' -> 'logo' ->> 'primary_url', '/storage/v1/object/public/brand-assets/', 2),
      '?', 1
    )
  )
)
WHERE brand_data -> 'visual_identity' -> 'logo' ->> 'primary_url' LIKE '%/storage/v1/object/public/brand-assets/%';
