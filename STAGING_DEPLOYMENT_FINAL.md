# 🚀 STAGING DEPLOYMENT — Final Instructions

**Status:** Code ready, build verified ✅  
**Branch:** main (commit c41c1fd)  
**Target:** mira-staging.vercel.app

---

## STEP 1: Supabase Migration (5 minutes)

Go to: https://app.supabase.com/project/nnevhtfxuawexliwlbmh/sql/new

Copy & paste this SQL:

```sql
-- Migration: Create drive_connections table for Google Drive integration
CREATE TABLE IF NOT EXISTS drive_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES mira_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  folder_id TEXT NOT NULL,
  folder_name TEXT,
  folder_path TEXT,
  auto_sync_enabled BOOLEAN DEFAULT FALSE,
  last_synced_at TIMESTAMPTZ,
  last_sync_status TEXT DEFAULT 'pending',
  last_sync_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_drive_connections_client_id ON drive_connections(client_id);
CREATE INDEX IF NOT EXISTS idx_drive_connections_user_id ON drive_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_drive_connections_client_user ON drive_connections(client_id, user_id);

ALTER TABLE drive_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_view_own_connections"
  ON drive_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_can_insert_own_connections"
  ON drive_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_update_own_connections"
  ON drive_connections FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_delete_own_connections"
  ON drive_connections FOR DELETE
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION update_drive_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_drive_connections_updated_at ON drive_connections;
CREATE TRIGGER trigger_update_drive_connections_updated_at
  BEFORE UPDATE ON drive_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_drive_connections_updated_at();

GRANT ALL ON drive_connections TO service_role;
```

Click "Run" → Should complete without errors

---

## STEP 2: Google OAuth Credentials (10 minutes)

1. Go to: https://console.cloud.google.com
2. Create new project: "MIRA Google Drive"
3. Enable API: "Google Drive API"
4. Create OAuth 2.0 credential:
   - Type: Desktop application
   - Authorized redirect URIs:
     - `https://mira-staging.vercel.app/api/brand-brain/drive/callback`
     - `http://localhost:3000/api/brand-brain/drive/callback` (for dev)

5. Copy: **Client ID** and **Client Secret**

---

## STEP 3: Vercel Environment Variables (5 minutes)

Go to: https://vercel.com/dashboard → mira-portal → Settings → Environment Variables

**For Staging:**
```
GOOGLE_OAUTH_CLIENT_ID = [paste Client ID from step 2]
GOOGLE_OAUTH_CLIENT_SECRET = [paste Client Secret from step 2]
```

Save → Redeployment triggered automatically

---

## STEP 4: Deploy to Staging (5 minutes)

```bash
cd /Users/carlosjacoste/Desktop/Claude/apps/mira/portal

# Verify no uncommitted changes
git status

# Deploy
vercel --prod
```

Wait for ✓ Deployment complete

Shows: `✓ Inspect: https://[staging-url].vercel.app`

---

## STEP 5: Smoke Tests (15 minutes)

### Test 5.1: Brand Brain Data Works
```bash
curl -X POST https://mira-staging.vercel.app/api/brand-brain/chatbot \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "c375bb80-b0d1-4923-a73a-ac96a3ce7799",
    "message": "Tell me about Salsa Burgers",
    "conversationHistory": []
  }'
```

**Expected:** Response mentions "Salsa Burgers" with tone of voice

### Test 5.2: Google Drive Auth
```bash
curl -X POST https://mira-staging.vercel.app/api/brand-brain/drive/authorize \
  -H "Content-Type: application/json" \
  -d '{
    "redirectUrl": "https://mira-staging.vercel.app/api/brand-brain/drive/callback",
    "clientId": "c375bb80-b0d1-4923-a73a-ac96a3ce7799"
  }' | jq '.authUrl'
```

**Expected:** Returns a Google authorization URL (starts with `https://accounts.google.com`)

### Test 5.3: Database Connection
```sql
-- In Supabase SQL Editor
SELECT COUNT(*) FROM drive_connections;
-- Expected: 0 (table exists but empty)
```

---

## STEP 6: E2E Testing (Optional - Today/Tomorrow)

1. Manually test OAuth flow with real Google account
2. Test folder selection UI
3. Test document sync
4. Verify multi-client isolation (RLS)

---

## ROLLBACK (If Needed)

```bash
# Revert to known good commit
git revert [commit-hash]
cd apps/mira/portal
vercel --prod
```

---

## Post-Deployment Checklist

- [ ] Supabase migration applied
- [ ] Google OAuth credentials in Vercel
- [ ] Vercel deployment successful
- [ ] Test 5.1 passed (Brand Brain works)
- [ ] Test 5.2 passed (OAuth returns URL)
- [ ] Test 5.3 passed (Database connected)
- [ ] No errors in Vercel logs

---

## Summary

**What was deployed:**
- ✅ Brand Brain data (4 clients, 25 pillars, 8 documents)
- ✅ Chatbot with column whitelist (prevents schema errors)
- ✅ Google Drive integration UI (DriveConnectionModal)
- ✅ Google Drive backend (3 API routes)
- ✅ All critical bugs fixed

**What's optional (Fase 5+):**
- PDF/DOCX text extraction (requires `pdf-parse`, `mammoth`)
- Async ingestion for large file counts
- Google Drive webhooks for auto-sync
- Smart summaries using Claude API

---

## Support

If deployment fails:
1. Check Vercel build logs
2. Check Supabase for table creation
3. Verify environment variables in Vercel
4. Confirm Google OAuth credentials are correct

**Staging URL:** https://mira-staging.vercel.app  
**Project:** mira-portal on Vercel  
**Repository:** Desktop/Claude on main branch

---

**Ready? Run Step 1-6 above. All systems go! 🚀**
