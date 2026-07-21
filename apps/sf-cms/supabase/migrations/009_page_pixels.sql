-- 009: per-page tracking pixels.
--
-- Site-wide GA4/GTM already live in projects.settings; this adds page-level
-- tracking so a specific landing can carry its own Meta Pixel, Google Ads
-- conversion, TikTok pixel, etc. — layered ON TOP of the site-wide tags,
-- not replacing them. Shape (all keys optional):
--   {
--     ga4_id, gtm_id, meta_pixel_id, google_ads_id,
--     google_ads_conversion_label, tiktok_pixel_id, linkedin_partner_id,
--     custom_head, custom_body        -- raw HTML escape hatches
--   }

ALTER TABLE pages ADD COLUMN IF NOT EXISTS pixels JSONB NOT NULL DEFAULT '{}'::jsonb;
