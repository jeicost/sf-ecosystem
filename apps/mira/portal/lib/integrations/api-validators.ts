// Real API key validators for integration tools

export interface ApiValidationResult {
  valid: boolean
  error?: string
  accountInfo?: {
    email?: string
    name?: string
    id?: string
  }
}

// Canva: no api-key validator. Canva moved to OAuth (Canva Connect) —
// see lib/integrations/oauth-config.ts ('canva' entry) and lib/integrations/canva.ts.

// Buffer API Key Validator
export async function validateBufferApiKey(apiKey: string): Promise<ApiValidationResult> {
  try {
    const res = await fetch('https://api.bufferapp.com/1/user.json?access_token=' + apiKey)
    if (!res.ok) return { valid: false, error: 'Invalid API key' }
    const data = (await res.json()) as any
    return {
      valid: true,
      accountInfo: { email: data.email, name: data.name, id: data.id },
    }
  } catch {
    return { valid: false, error: 'Unable to validate key' }
  }
}

// Hootsuite API Key Validator
export async function validateHootsuiteApiKey(apiKey: string): Promise<ApiValidationResult> {
  try {
    const res = await fetch('https://api.hootsuite.com/v1/me', {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    })
    if (!res.ok) return { valid: false, error: 'Invalid API key' }
    const data = (await res.json()) as any
    return {
      valid: true,
      accountInfo: { email: data.email, name: data.name, id: data.id },
    }
  } catch {
    return { valid: false, error: 'Unable to validate key' }
  }
}

// Freepik API Key Validator
export async function validateFreepikApiKey(apiKey: string): Promise<ApiValidationResult> {
  try {
    const res = await fetch('https://api.freepik.com/v1/info/profile', {
      headers: { 'x-freepik-api-key': apiKey },
    })
    if (!res.ok) return { valid: false, error: 'Invalid API key' }
    const data = (await res.json()) as any
    return {
      valid: true,
      accountInfo: { email: data.email, name: data.name },
    }
  } catch {
    return { valid: false, error: 'Unable to validate key' }
  }
}

// Anthropic (Claude) API Key Validator
export async function validateAnthropicApiKey(apiKey: string): Promise<ApiValidationResult> {
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'content-type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-8',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'ping' }],
      }),
    })
    if (!res.ok && res.status !== 400) return { valid: false, error: 'Invalid API key' }
    return { valid: true, accountInfo: { id: 'anthropic_key_verified' } }
  } catch {
    return { valid: false, error: 'Unable to validate key' }
  }
}

// OpenAI API Key Validator
export async function validateOpenAiApiKey(apiKey: string): Promise<ApiValidationResult> {
  try {
    const res = await fetch('https://api.openai.com/v1/models', {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    })
    if (!res.ok) return { valid: false, error: 'Invalid API key' }
    return { valid: true, accountInfo: { id: 'openai_key_verified' } }
  } catch {
    return { valid: false, error: 'Unable to validate key' }
  }
}

// Magnific AI API Key Validator
export async function validateMagnificApiKey(apiKey: string): Promise<ApiValidationResult> {
  try {
    const res = await fetch('https://api.magnific.ai/v1/account', {
      headers: { 'x-api-key': apiKey },
    })
    if (!res.ok) return { valid: false, error: 'Invalid API key' }
    const data = (await res.json()) as any
    return {
      valid: true,
      accountInfo: { email: data.email, name: data.name, id: data.id },
    }
  } catch {
    return { valid: false, error: 'Unable to validate key' }
  }
}

// Apollo.io API Key Validator
export async function validateApolloApiKey(apiKey: string): Promise<ApiValidationResult> {
  try {
    const res = await fetch('https://api.apollo.io/v1/auth/health', {
      headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
    })
    if (!res.ok) return { valid: false, error: 'Invalid API key' }
    const data = (await res.json()) as any
    return {
      valid: true,
      accountInfo: { email: data?.email, name: data?.name, id: data?.id },
    }
  } catch {
    return { valid: false, error: 'Unable to validate key' }
  }
}

// Hunter.io API Key Validator
export async function validateHunterApiKey(apiKey: string): Promise<ApiValidationResult> {
  try {
    const res = await fetch(`https://api.hunter.io/v2/account?api_key=${encodeURIComponent(apiKey)}`)
    if (!res.ok) return { valid: false, error: 'Invalid API key' }
    const data = (await res.json()) as any
    return {
      valid: true,
      accountInfo: { email: data?.data?.email, name: data?.data?.first_name, id: data?.data?.plan_name },
    }
  } catch {
    return { valid: false, error: 'Unable to validate key' }
  }
}

// Factory function to get the right validator
export function getApiValidator(toolId: string) {
  const validators: Record<string, (key: string) => Promise<ApiValidationResult>> = {
    // canva: removed — auth is OAuth now (falls through to 'No validator for this tool')
    buffer: validateBufferApiKey,
    hootsuite: validateHootsuiteApiKey,
    freepik: validateFreepikApiKey,
    anthropic: validateAnthropicApiKey,
    openai: validateOpenAiApiKey,
    magnific: validateMagnificApiKey,
    apollo: validateApolloApiKey,
    hunter: validateHunterApiKey,
  }

  return validators[toolId] || (async () => ({ valid: false, error: 'No validator for this tool' }))
}
