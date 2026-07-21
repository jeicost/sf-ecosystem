interface ProjectLike {
  id: string
  name: string
  slug: string
}

const LAST_PROJECT_KEY = 'sf-cms:last-project'

// Internal / test projects sink to the bottom of the selector so a real
// client is the default, not the QA harness.
function isInternal(p: ProjectLike): boolean {
  return /qa|harness|test|internal|demo/i.test(`${p.slug} ${p.name}`)
}

/** Real clients first (alphabetical), internal/test projects last. */
export function sortProjects<T extends ProjectLike>(projects: T[]): T[] {
  return [...projects].sort((a, b) => {
    const ai = isInternal(a) ? 1 : 0
    const bi = isInternal(b) ? 1 : 0
    if (ai !== bi) return ai - bi
    return a.name.localeCompare(b.name)
  })
}

export function rememberProject(id: string): void {
  try {
    localStorage.setItem(LAST_PROJECT_KEY, id)
  } catch {
    // storage unavailable (private mode) — non-critical
  }
}

/**
 * Pick the initial project: URL param wins, then the last one the user
 * worked on, then the first real (non-internal) project.
 */
export function pickInitialProject<T extends ProjectLike>(
  projects: T[],
  urlProjectId?: string | null,
): T | null {
  if (projects.length === 0) return null
  const sorted = sortProjects(projects)

  if (urlProjectId) {
    const fromUrl = sorted.find((p) => p.id === urlProjectId)
    if (fromUrl) return fromUrl
  }

  try {
    const remembered = localStorage.getItem(LAST_PROJECT_KEY)
    if (remembered) {
      const fromStorage = sorted.find((p) => p.id === remembered)
      if (fromStorage) return fromStorage
    }
  } catch {
    // ignore
  }

  return sorted[0]
}
