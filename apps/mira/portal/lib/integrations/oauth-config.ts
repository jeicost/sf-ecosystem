export interface OAuthConfig {
  id: string
  name: string
  clientIdEnvVar: string
  clientSecretEnvVar: string
  authorizationUrl: string
  tokenUrl: string
  scopes: string[]
  userInfoUrl?: string
}

export const OAUTH_TOOLS: Record<string, OAuthConfig> = {
  'slack': {
    id: 'slack',
    name: 'Slack',
    clientIdEnvVar: 'SLACK_CLIENT_ID',
    clientSecretEnvVar: 'SLACK_CLIENT_SECRET',
    authorizationUrl: 'https://slack.com/oauth/v2/authorize',
    tokenUrl: 'https://slack.com/api/oauth.v2.access',
    scopes: ['chat:write', 'channels:read', 'groups:read', 'im:read'],
  },
  'salesforce': {
    id: 'salesforce',
    name: 'Salesforce',
    clientIdEnvVar: 'SALESFORCE_CLIENT_ID',
    clientSecretEnvVar: 'SALESFORCE_CLIENT_SECRET',
    authorizationUrl: 'https://login.salesforce.com/services/oauth2/authorize',
    tokenUrl: 'https://login.salesforce.com/services/oauth2/token',
    scopes: ['api', 'refresh_token', 'offline_access'],
    userInfoUrl: 'https://login.salesforce.com/services/oauth2/userinfo',
  },
  'google-workspace': {
    id: 'google-workspace',
    name: 'Google Workspace',
    clientIdEnvVar: 'GOOGLE_OAUTH_CLIENT_ID',
    clientSecretEnvVar: 'GOOGLE_OAUTH_CLIENT_SECRET',
    authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: [
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/documents.readonly',
      'https://www.googleapis.com/auth/spreadsheets.readonly',
    ],
    userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
  },
  'linkedin-navigator': {
    id: 'linkedin-navigator',
    name: 'LinkedIn Sales Navigator',
    clientIdEnvVar: 'LINKEDIN_CLIENT_ID',
    clientSecretEnvVar: 'LINKEDIN_CLIENT_SECRET',
    authorizationUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    scopes: ['r_liteprofile', 'r_emailaddress'],
  },
  'figma': {
    id: 'figma',
    name: 'Figma',
    clientIdEnvVar: 'FIGMA_CLIENT_ID',
    clientSecretEnvVar: 'FIGMA_CLIENT_SECRET',
    authorizationUrl: 'https://www.figma.com/oauth',
    tokenUrl: 'https://api.figma.com/v1/oauth/token',
    scopes: ['file_read', 'file_write'],
  },
}

export const getOAuthConfig = (toolId: string): OAuthConfig | null => {
  return OAUTH_TOOLS[toolId] || null
}

export const getOAuthRedirectUri = (): string => {
  const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000'

  return `${baseUrl}/api/integrations/oauth/callback`
}

export const buildOAuthUrl = (
  toolId: string,
  clientId: string,
  state: string
): string | null => {
  const config = OAUTH_TOOLS[toolId]
  if (!config) return null

  const redirectUri = getOAuthRedirectUri()
  const scopeString = config.scopes.join(' ')

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopeString,
    state,
  })

  if (toolId === 'figma') {
    params.set('client_id', clientId)
    params.set('redirect_uri', redirectUri)
    params.set('scope', scopeString)
    params.set('state', state)
  }

  return `${config.authorizationUrl}?${params.toString()}`
}
