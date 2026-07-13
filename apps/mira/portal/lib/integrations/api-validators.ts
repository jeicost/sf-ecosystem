/**
 * API Key validators for each tool.
 * Each validator attempts a simple API call to verify the key is valid.
 */

export interface ApiValidationResult {
  valid: boolean
  error?: string
  accountInfo?: {
    email?: string
    name?: string
    id?: string
  }
}

export const validateCanvaApiKey = async (apiKey: string): Promise<ApiValidationResult> => {
  try {
    const response = await fetch('https://api.canva.com/v1/canvases', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })

    if (!response.ok) {
      if (response.status === 401) return { valid: false, error: 'Invalid API key' }
      return { valid: false, error: `API returned ${response.status}` }
    }

    return { valid: true }
  } catch (error) {
    return { valid: false, error: 'Network error. API may be unreachable.' }
  }
}

export const validateBufferApiKey = async (apiKey: string): Promise<ApiValidationResult> => {
  try {
    const response = await fetch('https://api.buffer.com/1/user.json', {
      headers: { Authorization: `Bearer ${apiKey}` },
    })

    if (!response.ok) {
      if (response.status === 401) return { valid: false, error: 'Invalid API key' }
      return { valid: false, error: `API returned ${response.status}` }
    }

    const data = await response.json()
    return {
      valid: true,
      accountInfo: { email: data.email, name: data.name, id: data.id },
    }
  } catch (error) {
    return { valid: false, error: 'Network error. API may be unreachable.' }
  }
}

export const validateHootsuiteApiKey = async (apiKey: string): Promise<ApiValidationResult> => {
  try {
    const response = await fetch('https://api.hootsuite.com/v1/me', {
      headers: { Authorization: `Bearer ${apiKey}` },
    })

    if (!response.ok) {
      if (response.status === 401) return { valid: false, error: 'Invalid API key' }
      return { valid: false, error: `API returned ${response.status}` }
    }

    const data = await response.json()
    return {
      valid: true,
      accountInfo: { email: data.email, id: data.id },
    }
  } catch (error) {
    return { valid: false, error: 'Network error. API may be unreachable.' }
  }
}

export const validateFreepikApiKey = async (apiKey: string): Promise<ApiValidationResult> => {
  try {
    const response = await fetch('https://api.freepik.com/v1/auth/me', {
      headers: { 'x-freepik-api-key': apiKey },
    })

    if (!response.ok) {
      if (response.status === 401) return { valid: false, error: 'Invalid API key' }
      return { valid: false, error: `API returned ${response.status}` }
    }

    const data = await response.json()
    return {
      valid: true,
      accountInfo: { email: data.user?.email, id: data.user?.id },
    }
  } catch (error) {
    return { valid: false, error: 'Network error. API may be unreachable.' }
  }
}

export const validateAnthropicApiKey = async (apiKey: string): Promise<ApiValidationResult> => {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'test' }],
      }),
    })

    if (!response.ok) {
      if (response.status === 401) return { valid: false, error: 'Invalid API key' }
      // 400 is ok for this test (bad request due to token), means key is valid
      if (response.status !== 400) return { valid: false, error: `API returned ${response.status}` }
    }

    return { valid: true }
  } catch (error) {
    return { valid: false, error: 'Network error. API may be unreachable.' }
  }
}

export const validateOpenAiApiKey = async (apiKey: string): Promise<ApiValidationResult> => {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    })

    if (!response.ok) {
      if (response.status === 401) return { valid: false, error: 'Invalid API key' }
      return { valid: false, error: `API returned ${response.status}` }
    }

    return { valid: true }
  } catch (error) {
    return { valid: false, error: 'Network error. API may be unreachable.' }
  }
}

export const validateMagnificApiKey = async (apiKey: string): Promise<ApiValidationResult> => {
  try {
    const response = await fetch('https://api.magnific.ai/v1/api_key/validate', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })

    if (!response.ok) {
      if (response.status === 401) return { valid: false, error: 'Invalid API key' }
      return { valid: false, error: `API returned ${response.status}` }
    }

    return { valid: true }
  } catch (error) {
    return { valid: false, error: 'Network error. API may be unreachable.' }
  }
}

// Fallback validator for tools without real API validation
export const validateGenericApiKey = (apiKey: string): ApiValidationResult => {
  if (!apiKey || apiKey.trim().length < 5) {
    return { valid: false, error: 'API key must be at least 5 characters' }
  }
  return { valid: true }
}

export const getApiValidator = (
  toolId: string
): ((apiKey: string) => Promise<ApiValidationResult>) => {
  const validators: Record<string, (apiKey: string) => Promise<ApiValidationResult>> = {
    canva: validateCanvaApiKey,
    buffer: validateBufferApiKey,
    hootsuite: validateHootsuiteApiKey,
    freepik: validateFreepikApiKey,
    anthropic: validateAnthropicApiKey,
    openai: validateOpenAiApiKey,
    magnific: validateMagnificApiKey,
  }

  return validators[toolId] || (async (key) => Promise.resolve(validateGenericApiKey(key)))
}
