import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { resolveRequestClient } from '@/lib/resolve-client'
import { writable } from '@/lib/db-json'

// La resolución de cliente es la CANÓNICA (lib/resolve-client). Esta ruta tenía
// una copia privada que se quedó atrás: sin ORDER BY en el fallback (la
// elección de tenant era la fila que Postgres quisiera devolver) y sin el
// guard multi-grant. Era la única de las cuatro copias divergentes que escribía
// el Brand Brain — exactamente la clase de deriva que causó el incidente del
// 28-ago. Cuatro implementaciones de «¿de qué marca es esta petición?» son
// tres de más; las demás copias se migran igual (auditoría 16-sep-2026).

/** El cliente puede venir como `clientId` o `client_id`; '' cuenta como ausente. */
function requestedClient(body: Record<string, unknown>): string | null {
  for (const key of ['clientId', 'client_id']) {
    const v = body[key]
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  return null
}

export async function GET(req: NextRequest) {
  try {
    const access = await resolveRequestClient(new URL(req.url).searchParams.get('clientId'))
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }
    const clientId = access.clientId
    const admin = adminClient()

    const [{ data: profileData, error: profileError }, { data: pillarsData, error: pillarsError }] = await Promise.all([
      admin
        .from('brand_profiles')
        .select('*')
        .eq('client_id', clientId)
        .maybeSingle(),
      admin
        .from('content_pillars')
        .select('*')
        .eq('client_id', clientId),
    ])

    if (profileError) {
      // Un fallo real de consulta NO es «todavía no hay Brain»: devolver 200
      // con data:null pintaba el editor VACÍO con el Brain lleno en la BD, y
      // si el usuario pulsaba Guardar sobre ese formulario en blanco, el PUT
      // (rama sin id → upsert por client_id) machacaba la fila real con
      // vacíos. El check verde decía «Guardado». Es el fallo silencioso más
      // destructivo del sistema: se devuelve 500 y el editor enseña el error.
      console.error('Brand brain GET profile error:', clientId, profileError)
      return NextResponse.json({ error: 'Could not load the Brand Brain — try again' }, { status: 500 })
    }

    return NextResponse.json({ data: profileData, pillars: pillarsData || [] }, { status: 200 })
  } catch (error) {
    console.error('Brand brain GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, brand_data, name, mission, tone_of_voice, values, description, pillars } = body

    // Escritura del activo más valioso del cliente: tenant SIEMPRE explícito
    // (strict). Con varios grants y sin clientId, adivinar aquí es corromper.
    const access = await resolveRequestClient(requestedClient(body), { strict: true })
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }
    const clientId = access.clientId
    const admin = adminClient()

    // Sin id: el Brain todavía no existe en pantalla. Se hace UPSERT por
    // client_id en vez de INSERT a ciegas — si la fila sí existía (GET fallido,
    // pestaña vieja, dos ventanas abiertas), un insert reventaba con
    // "duplicate key ... brand_profiles_client_id_key" y el usuario perdía todo
    // lo que acababa de escribir sin ninguna forma de recuperarlo.
    if (!id) {
      // Guardia contra la sobrescritura con vacíos: sin id + upsert por
      // client_id significa «el editor cree que no hay Brain». Si además el
      // body llega SIN contenido significativo, el caso más probable no es un
      // alta nueva: es un GET fallido que pintó el formulario en blanco y un
      // usuario que pulsó Guardar. Machacar la fila real con vacíos destruye
      // el activo más caro del cliente sin dejar rastro. Un alta real siempre
      // trae al menos el nombre.
      const meaningful =
        (typeof name === 'string' && name.trim()) ||
        (typeof mission === 'string' && mission.trim()) ||
        (typeof description === 'string' && description.trim()) ||
        (Array.isArray(values) && values.length > 0) ||
        (brand_data && typeof brand_data === 'object' && Object.keys(brand_data).length > 0)
      if (!meaningful) {
        const { data: existing } = await admin
          .from('brand_profiles')
          .select('id')
          .eq('client_id', clientId)
          .maybeSingle()
        if (existing) {
          return NextResponse.json(
            { error: 'Refusing to overwrite the existing Brand Brain with an empty profile — reload the page and try again' },
            { status: 409 }
          )
        }
      }
      const { data: newProfile, error: insertError } = await admin
        .from('brand_profiles')
        .upsert({
          client_id: clientId,
          name: name || '',
          mission: mission || '',
          tone_of_voice: tone_of_voice || {},
          values: values || [],
          description: description || '',
          brand_data: brand_data || {},
        }, { onConflict: 'client_id' })
        .select()
        .single()

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }

      return NextResponse.json({ data: newProfile }, { status: 201 })
    }

    // Update existing profile.
    //
    // `campo || undefined` trataba un string vacío como "no tocar", así que
    // era IMPOSIBLE borrar un valor equivocado desde la UI: si un documento
    // metía una misión mal extraída, el usuario la vaciaba, guardaba, y volvía
    // a aparecer. Ahora solo se omite lo que llega como undefined (campo
    // ausente en el body); un '' explícito sí limpia.
    const patch: Record<string, unknown> = {}
    if (name !== undefined) patch.name = name
    if (mission !== undefined) patch.mission = mission
    if (tone_of_voice !== undefined) patch.tone_of_voice = tone_of_voice
    if (values !== undefined) patch.values = values
    if (description !== undefined) patch.description = description
    if (brand_data !== undefined) patch.brand_data = brand_data

    // Mantener sincronizadas las columnas planas con lo que el editor guarda
    // en brand_data.identity: fetchBrandBrain prefiere brand_data, pero otras
    // consultas (listados de admin, onboarding) leen la columna, y tenerlas
    // divergiendo era la causa de que "la misión que escribo no aparece".
    if (brand_data && typeof brand_data === 'object') {
      const identity = (brand_data as Record<string, any>).identity
      if (identity && typeof identity === 'object') {
        if (typeof identity.name === 'string' && identity.name.trim()) patch.name = identity.name.trim()
        if (typeof identity.mission === 'string' && identity.mission.trim()) patch.mission = identity.mission.trim()
      }
    }

    const { data: updatedProfile, error: updateError } = await admin
      .from('brand_profiles')
      .update(writable(patch))
      .eq('id', id)
      .eq('client_id', clientId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // If pillars are provided, upsert them to the content_pillars table
    if (pillars && Array.isArray(pillars)) {
      const pillarsWithClientId = pillars.map(p => ({
        ...p,
        client_id: clientId,
      }))

      const { error: pillarsError } = await admin
        .from('content_pillars')
        .upsert(pillarsWithClientId, { onConflict: 'client_id,pillar_name' })

      if (pillarsError) {
        console.error('Error upserting pillars:', pillarsError)
      }
    }

    return NextResponse.json({ data: updatedProfile }, { status: 200 })
  } catch (error) {
    console.error('Brand brain PUT error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
