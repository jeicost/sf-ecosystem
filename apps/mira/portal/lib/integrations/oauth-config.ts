// OAuth configuration for integrations
// This file scaffolds the OAuth architecture — activate by setting env vars

export interface OAuthConfig {
  clientIdEnvVar: string
  clientSecretEnvVar: string
  name?: string
  authorizationUrl?: string
  tokenUrl?: string
  scopes?: string[]
  userInfoUrl?: string
}

export const OAUTH_TOOLS: Record<string, OAuthConfig> = {
  slack: {
    clientIdEnvVar: 'NEXT_PUBLIC_SLACK_CLIENT_ID',
    clientSecretEnvVar: 'SLACK_CLIENT_SECRET',
    name: 'Slack',
    authorizationUrl: 'https://slack.com/oauth/v2/authorize',
    tokenUrl: 'https://slack.com/api/oauth.v2.access',
    scopes: ['chat:write', 'files:read', 'users:read'],
    userInfoUrl: 'https://slack.com/api/auth.test',
  },
  salesforce: {
    clientIdEnvVar: 'NEXT_PUBLIC_SALESFORCE_CLIENT_ID',
    clientSecretEnvVar: 'SALESFORCE_CLIENT_SECRET',
    name: 'Salesforce',
    authorizationUrl: 'https://login.salesforce.com/services/oauth2/authorize',
    tokenUrl: 'https://login.salesforce.com/services/oauth2/token',
    scopes: ['api', 'refresh_token'],
    userInfoUrl: 'https://yourinstance.salesforce.com/services/oauth2/userinfo',
  },
  'google-workspace': {
    clientIdEnvVar: 'NEXT_PUBLIC_GOOGLE_CLIENT_ID',
    clientSecretEnvVar: 'GOOGLE_CLIENT_SECRET',
    name: 'Google Workspace',
    authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/gmail.readonly',
    ],
    userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
  },
  'linkedin-navigator': {
    clientIdEnvVar: 'NEXT_PUBLIC_LINKEDIN_CLIENT_ID',
    clientSecretEnvVar: 'LINKEDIN_CLIENT_SECRET',
    name: 'LinkedIn Sales Navigator',
    authorizationUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    scopes: ['r_liteprofile', 'r_emailaddress'],
    userInfoUrl: 'https://api.linkedin.com/v2/me',
  },
  figma: {
    clientIdEnvVar: 'NEXT_PUBLIC_FIGMA_CLIENT_ID',
    clientSecretEnvVar: 'FIGMA_CLIENT_SECRET',
    name: 'Figma',
    authorizationUrl: 'https://www.figma.com/oauth',
    tokenUrl: 'https://api.figma.com/v1/oauth/token',
    scopes: ['file_read', 'file_write'],
    userInfoUrl: 'https://api.figma.com/v1/me',
  },
}

export function getOAuthConfig(toolId: string): OAuthConfig | null {
  return OAUTH_TOOLS[toolId] || null
}

export function buildOAuthUrl(
  toolId: string,
  clientIdEnv: string,
  state: string
): string | null {
  const config = OAUTH_TOOLS[toolId]
  if (!config || !config.authorizationUrl) return null

  const redirectUri = getOAuthRedirectUri(toolId)
  const url = new URL(config.authorizationUrl)
  url.searchParams.set('client_id', clientIdEnv)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('scope', (config.scopes || []).join(' '))
  url.searchParams.set('state', state)
  url.searchParams.set('response_type', 'code')

  return url.toString()
}

export function getOAuthRedirectUri(toolId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `${baseUrl}/api/integrations/oauth/callback/${toolId}`
}
