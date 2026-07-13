# MIRA Integrations Setup Guide

This document explains how to configure each integration in MIRA.

## Integrations Overview

| Tool | Type | Status | Setup Time |
|------|------|--------|-----------|
| Google Drive | Native | ✅ Connected (MCP) | Ready |
| Slack | OAuth | 🔴 Not configured | 5 min |
| Salesforce | OAuth | 🔴 Not configured | 10 min |
| Google Workspace | OAuth | 🔴 Not configured | 5 min |
| LinkedIn Sales Navigator | OAuth | 🔴 Not configured | 10 min |
| Figma | OAuth | 🔴 Not configured | 5 min |
| Canva | API Key | 🔴 Not configured | 2 min |
| Buffer | API Key | 🔴 Not configured | 2 min |
| Hootsuite | API Key | 🔴 Not configured | 2 min |
| Freepik | API Key | 🔴 Not configured | 2 min |
| Anthropic (Claude) | API Key | 🔴 Not configured | 2 min |
| OpenAI (GPT) | API Key | 🔴 Not configured | 2 min |
| Magnific AI | API Key | 🔴 Not configured | 2 min |

## Environment Variables

All OAuth tools require env vars to be set. Add these to your `.env.local` (development) or Vercel (production).

### OAuth Tools

#### Slack
```env
SLACK_CLIENT_ID=your_client_id_here
SLACK_CLIENT_SECRET=your_client_secret_here
```
**Setup:**
1. Go to https://api.slack.com/apps
2. Create New App → From scratch
3. App name: "MIRA" | Workspace: yours
4. OAuth & Permissions → Redirect URLs → Add `https://yourdomain.com/api/integrations/oauth/callback`
5. Scopes: `chat:write`, `channels:read`, `groups:read`, `im:read`
6. Copy Client ID and Secret to env vars

#### Salesforce
```env
SALESFORCE_CLIENT_ID=your_client_id_here
SALESFORCE_CLIENT_SECRET=your_client_secret_here
```
**Setup:**
1. https://login.salesforce.com → Setup
2. Apps → App Manager → New Connected App
3. Name: "MIRA"
4. Callback URL: `https://yourdomain.com/api/integrations/oauth/callback`
5. Scopes: Full access (`full`) + Refresh token (`refresh_token`)
6. Copy Consumer Key and Consumer Secret to env vars

#### Google Workspace
```env
GOOGLE_OAUTH_CLIENT_ID=your_client_id_here
GOOGLE_OAUTH_CLIENT_SECRET=your_client_secret_here
```
**Setup:**
1. https://console.cloud.google.com → Create project "MIRA"
2. Enable APIs: Google Drive API, Google Sheets API, Google Docs API
3. OAuth 2.0 → Create Credential → OAuth Client ID → Web application
4. Authorized JS Origins: `https://yourdomain.com`
5. Authorized Redirect URIs: `https://yourdomain.com/api/integrations/oauth/callback`
6. Scopes: Drive read-only, Docs read-only, Sheets read-only
7. Copy Client ID and Secret to env vars

#### LinkedIn Sales Navigator
```env
LINKEDIN_CLIENT_ID=your_client_id_here
LINKEDIN_CLIENT_SECRET=your_client_secret_here
```
**Setup:**
1. https://www.linkedin.com/developers/apps
2. Create app → Name: "MIRA"
3. Authorized redirect URLs: `https://yourdomain.com/api/integrations/oauth/callback`
4. Scopes: `r_liteprofile`, `r_emailaddress`
5. Copy Client ID and Secret to env vars

#### Figma
```env
FIGMA_CLIENT_ID=your_client_id_here
FIGMA_CLIENT_SECRET=your_client_secret_here
```
**Setup:**
1. https://www.figma.com/developers/apps
2. Create new app → Name: "MIRA"
3. Redirect URI: `https://yourdomain.com/api/integrations/oauth/callback`
4. Copy Client ID and Secret to env vars

### API Key Tools

API keys can be added directly from the MIRA integrations page. No env vars needed.

#### Canva
1. https://www.canva.com/developers
2. Get API Key from Developer Dashboard
3. Paste in MIRA integrations modal

#### Buffer
1. https://buffer.com/developers/api
2. Get Access Token
3. Paste in MIRA integrations modal

#### Hootsuite
1. https://hootsuite.com/en/platform/api
2. Get API Token
3. Paste in MIRA integrations modal

#### Freepik
1. https://api.freepik.com
2. Get API Key from account settings
3. Paste in MIRA integrations modal

#### Anthropic (Claude)
1. https://console.anthropic.com/account/keys
2. Create API key
3. Paste in MIRA integrations modal

#### OpenAI (GPT)
1. https://platform.openai.com/account/api-keys
2. Create API key
3. Paste in MIRA integrations modal

#### Magnific AI
1. https://www.magnific.ai/api
2. Get API key
3. Paste in MIRA integrations modal

## Deployment

### Local Development

1. Create `.env.local` in `/apps/mira/portal/`
2. Add OAuth env vars you want to test:
   ```env
   SLACK_CLIENT_ID=...
   SLACK_CLIENT_SECRET=...
   ```
3. Note: Redirect URI must match callback URL (localhost:3000/api/integrations/oauth/callback)

### Production (Vercel)

1. Go to Project Settings → Environment Variables
2. Add all OAuth env vars:
   - `SLACK_CLIENT_ID`, `SLACK_CLIENT_SECRET`
   - `SALESFORCE_CLIENT_ID`, `SALESFORCE_CLIENT_SECRET`
   - `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`
   - etc.
3. Update callback URLs in each service to: `https://your-vercel-domain.vercel.app/api/integrations/oauth/callback`
4. Redeploy

## Testing Integrations

### Test API Key Connection
1. Go to `/integrations`
2. Click on a tool (e.g., "Claude")
3. Modal opens
4. Paste API key → Auto-validates
5. Shows ✓ Valid when key is correct
6. "Connect Account" button enables
7. Click → Connection saved

### Test OAuth Connection
1. Go to `/integrations`
2. Click on a tool (e.g., "Slack")
3. Modal shows "Authorize with Slack"
4. Env vars must be set, or shows error
5. Click → Redirects to OAuth provider
6. Approve access → Redirects back to `/integrations?success=slack`
7. Success toast appears

### Troubleshooting

**"OAuth not configured"**
- Missing env vars. Add `SLACK_CLIENT_ID` and `SLACK_CLIENT_SECRET` to your env.

**"Invalid state token"**
- Session expired. Try again. Sessions last 15 minutes.

**"Failed to exchange authorization code"**
- Redirect URI mismatch. Check OAuth config matches env vars exactly.

**API Key validation fails**
- Key is invalid or API is unreachable
- Verify key with provider's dashboard first
- Some APIs may not be reachable from Vercel (check CORS)

## Connected Tools Display

Google Drive is marked as "Connected" because:
- MCP (Model Context Protocol) integration is active
- Service account credentials configured in `.mcp.json`
- No additional OAuth flow needed

All other tools show as "Disconnected" until explicitly connected via UI or env vars.

## Architecture Notes

- OAuth state tokens stored in `oauth_sessions` table
- Tokens expire after 15 minutes
- Access tokens encrypted in `tool_connections.auth_token`
- Refresh tokens stored in metadata for OAuth tools
- API keys validated on first connection
- Connection status real-time synced across UI

## Next Steps

1. **For Development**: Set up 1-2 OAuth tools locally (recommend Slack + Figma)
2. **For Production**: Configure all OAuth env vars in Vercel before deploy
3. **For Users**: Provide self-service API key setup in integrations modal
