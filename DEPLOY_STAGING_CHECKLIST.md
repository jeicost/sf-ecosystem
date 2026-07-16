# Deploy to Staging — Checklist

**Date:** 2026-07-16  
**Status:** Ready for staging deploy  
**Risk Level:** LOW (Opción B UI is optional, won't break existing Brand Brain)

---

## Step 1: Supabase Setup (5 minutes)

### 1.1 Create `drive_connections` table

Go to: https://app.supabase.com/project/nnevhtfxuawexliwlbmh/sql/new

Copy & paste the SQL migration (see `migration_drive_connections.sql` in scratchpad):
- Creates `drive_connections` table with OAuth token storage
- Enables RLS policies (user can only see own connections)
- Creates indexes for performance
- Auto-updates `updated_at` timestamp

**Verification:**
```sql
SELECT * FROM drive_connections LIMIT 1;
-- Should return empty table (no error)
```

---

## Step 2: Google OAuth Setup (10 minutes)

### 2.1 Get Google OAuth Credentials

1. Go to: https://console.cloud.google.com
2. Create new project: "MIRA Google Drive Integration"
3. Enable API: "Google Drive API"
4. Create OAuth 2.0 credential (Desktop app)
5. Copy: **Client ID** and **Client Secret**

### 2.2 Set Environment Variables in Vercel

Go to: https://vercel.com/dashboard → MIRA Portal → Settings → Environment Variables

Add:
```
GOOGLE_OAUTH_CLIENT_ID = [your client ID]
GOOGLE_OAUTH_CLIENT_SECRET = [your client secret]
GOOGLE_OAUTH_REDIRECT_URI = https://mira-staging.vercel.app/api/brand-brain/drive/callback
```

For production later:
```
GOOGLE_OAUTH_REDIRECT_URI = https://mira.vercel.app/api/brand-brain/drive/callback
```

**Important:** 
- Add to **staging** environment first
- Match redirect URI exactly in Google Cloud Console

---

## Step 3: Deploy to Staging

```bash
cd /Users/carlosjacoste/Desktop/Claude/apps/mira/portal

# Verify no uncommitted changes
git status

# Deploy to staging
vercel --prod --env=staging
```

Wait for deployment to complete. Should show:
```
✓ Production (Vercel staging deployment)
✓ Inspect: https://mira-staging.vercel.app
```

---

## Step 4: Smoke Tests (15 minutes)

### Test 4.1: Brand Brain Data Still Works
```bash
curl -X POST https://mira-staging.vercel.app/api/brand-brain/chatbot \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "c375bb80-b0d1-4923-a73a-ac96a3ce7799",
    "message": "Tell me about Salsa Burgers tone of voice",
    "conversationHistory": []
  }'
```

Expected: Returns message mentioning "Confident expertise + playful irreverence"

### Test 4.2: Google Drive OAuth Authorization Flow
```bash
curl -X POST https://mira-staging.vercel.app/api/brand-brain/drive/authorize \
  -H "Content-Type: application/json" \
  -d '{
    "redirectUrl": "https://mira-staging.vercel.app/api/brand-brain/drive/callback",
    "clientId": "c375bb80-b0d1-4923-a73a-ac96a3ce7799"
  }'
```

Expected: Returns JSON with `authUrl` field (Google sign-in URL)

### Test 4.3: Check API Response Status
Visit in browser: https://mira-staging.vercel.app/api/brand-brain/drive/authorize?clientId=c375bb80-b0d1-4923-a73a-ac96a3ce7799

Should return HTTP 400 (missing redirectUrl in GET) or 200 (valid POST)

### Test 4.4: Database Connection
```sql
-- In Supabase SQL Editor
SELECT COUNT(*) FROM drive_connections;
-- Should return 0 (table is empty but accessible)
```

---

## Step 5: Enable Google Drive Consent Screen (Optional for Testing)

If you want to test the full OAuth flow:

1. Go to: https://console.cloud.google.com/apis/consent
2. Click "Create Consent Screen" → External
3. Fill in app name: "MIRA Brand Brain"
4. Add scopes: `https://www.googleapis.com/auth/drive.readonly`
5. Add test users: your email + any client emails

---

## Deploy Checklist

- [ ] `drive_connections` table created in Supabase
- [ ] RLS policies enabled
- [ ] Google OAuth credentials created
- [ ] Environment variables set in Vercel staging
- [ ] Deployment successful (no build errors)
- [ ] Smoke test 4.1 passed (Brand Brain still works)
- [ ] Smoke test 4.2 passed (OAuth URL returns successfully)
- [ ] Smoke test 4.3 passed (API accessible)
- [ ] Smoke test 4.4 passed (Database connected)

---

## Rollback Plan (if needed)

If anything breaks:
```bash
# Revert last commit
git revert b31d567

# Redeploy
vercel --prod
```

The Google Drive features are opt-in (behind a modal), so existing Brand Brain should continue working.

---

## Next Steps After Staging

1. **E2E Testing** (tomorrow)
   - Test full OAuth flow with real Google account
   - Test folder selection
   - Test document ingestion
   - Test RLS isolation (multi-client)

2. **Production Deploy** (after E2E passes)
   - Add production Google OAuth credentials
   - Set production redirect URI
   - Deploy to main Vercel app

3. **Client Communication**
   - Announce Google Drive integration
   - Share usage guide
   - Monitor error logs

---

## Known Limitations (Fase 5)

- PDF/DOCX text extraction: not yet implemented (requires `pdf-parse`, `mammoth`)
- Async ingestion: currently synchronous (blocks on large file counts)
- Auto-sync: webhook infrastructure not yet built
- Smart summaries: Claude API integration pending

These are documented in deuda técnica and queued for next phase.

---

## Support

If deploy fails:
1. Check Vercel build logs: https://vercel.com/dashboard/mira-portal/deployments
2. Check Supabase table creation: https://app.supabase.com/project/nnevhtfxuawexliwlbmh/editor
3. Check environment variables in Vercel settings

Contact: Carlos / Claude Code
