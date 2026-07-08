import { createServiceClient } from '@/lib/supabase-admin'

/**
 * Resolve API key for a client-specific tool integration.
 *
 * @param clientId - The client UUID
 * @param toolId - The tool identifier ('anthropic', 'openai', 'freepik', 'magnific')
 * @param defaultKey - Fallback API key (e.g., platform default from process.env)
 * @returns The resolved API key, or null if not found and no default provided
 */
export async function getClientApiKey(
  clientId: string,
  toolId: 'anthropic' | 'openai' | 'freepik' | 'magnific',
  defaultKey?: string
): Promise<string | null> {
  try {
    // Validate clientId is a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(clientId)) {
      console.warn(`Invalid clientId format: ${clientId}`)
      return defaultKey || null
    }

    const db = createServiceClient()

    // Query tool_connections for the client's specific tool integration
    const { data: connection, error } = await db
      .from('tool_connections')
      .select('auth_token, metadata, status')
      .eq('client_id', clientId)
      .eq('tool_id', toolId)
      .eq('status', 'connected')
      .single()

    if (error) {
      // No row found or other error
      if (error.code === 'PGRST116') {
        // PGRST116 = no rows returned
        console.debug(`No tool connection found for clientId=${clientId}, toolId=${toolId}`)
        return defaultKey || null
      }

      // Other database errors
      console.error(`Error fetching tool connection: ${error.message}`)
      return defaultKey || null
    }

    if (!connection) {
      return defaultKey || null
    }

    // Try to extract API key from metadata first (encrypted or plaintext)
    const apiKey =
      connection.metadata?.api_key ||
      connection.metadata?.apiKey ||
      connection.auth_token

    if (!apiKey) {
      console.warn(
        `Tool connection exists but no API key found for clientId=${clientId}, toolId=${toolId}`
      )
      return defaultKey || null
    }

    // TODO: If lib/crypto.ts exists, decrypt the key here
    // const decrypted = await decryptApiKey(apiKey)
    // return decrypted

    return apiKey
  } catch (error) {
    console.error(
      `Unexpected error resolving API key for clientId=${clientId}, toolId=${toolId}:`,
      error
    )
    return defaultKey || null
  }
}
