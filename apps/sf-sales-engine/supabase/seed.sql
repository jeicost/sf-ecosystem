-- Seed: ICP interno de SF (Venture Builders)
-- Los 54 VBs se cargan con: make seed-vbs (scripts/seed_vbs.py)
INSERT INTO icp_profiles (
  client_id, icp_name, industries, company_sizes, geographies,
  job_titles, pain_points, trigger_events, disqualifiers, min_budget_usd
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Venture Builder / Inversor Startup LATAM-Europa',
  ARRAY['Venture Capital','Venture Building','Startup Studio','Accelerator','Corporate Innovation'],
  ARRAY['1-10','11-50','51-200'],
  ARRAY['España','México','Colombia','Argentina','Chile','Thailand','Singapore'],
  ARRAY['Managing Partner','General Partner','Investment Manager','Head of Portfolio','CEO','Founder'],
  ARRAY[
    'Las startups del portafolio no escalan su adquisición de clientes',
    'Alto costo de contratar SDRs para múltiples portfolio companies',
    'Sin sistema de prospección B2B repetible para sus startups'
  ],
  ARRAY['Nuevo fondo anunciado','Nueva startup en portafolio','Expansión geográfica','Demo day próximo'],
  ARRAY['Solo invierte en hardware o biotech','Portafolio solo B2C','Menos de 3 startups activas'],
  1000
);
