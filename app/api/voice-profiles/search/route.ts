import { NextRequest, NextResponse } from 'next/server'

const DATASET_SEARCH_URL = 'https://cvoice.ai/dataset_search.json'
const DATASET_VOICES_URL = 'https://cvoice.ai/dataset_voices.json'

// Module-level cache — persists for the lifetime of the server process
let charactersCache: CvoiceCharacter[] | null = null
let voicesCache: Record<string, CvoiceVoice[]> | null = null
let cacheTime = 0
const CACHE_TTL_MS = 1000 * 60 * 60 // 1 hour

interface CvoiceCharacter {
  id: number
  name: string
  username: string
  image_url: string
  occupations: string[]
  country: string
  voice_count: number
  fame_score: number
}

interface CvoiceVoice {
  voice_id: string
  name: string
  curated: boolean
  preview_url: string
}

async function getDatasets() {
  const now = Date.now()
  if (charactersCache && voicesCache && now - cacheTime < CACHE_TTL_MS) {
    return { characters: charactersCache, voices: voicesCache }
  }

  const [characters, voices] = await Promise.all([
    fetch(DATASET_SEARCH_URL).then(r => r.json()) as Promise<CvoiceCharacter[]>,
    fetch(DATASET_VOICES_URL).then(r => r.json()) as Promise<Record<string, CvoiceVoice[]>>,
  ])

  charactersCache = characters
  voicesCache = voices
  cacheTime = now

  return { characters, voices }
}

// GET /api/voice-profiles/search?q=obama&limit=20
// Returns matched characters with their available voices
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.toLowerCase().trim() ?? ''
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 50)
    const username = searchParams.get('username') // fetch voices for a specific character

    const { characters, voices } = await getDatasets()

    // If username provided, return just the voices for that character
    if (username) {
      const characterVoices = voices[username] ?? []
      return NextResponse.json({ voices: characterVoices })
    }

    // Search characters by name
    const filtered = query
      ? characters
          .filter(c => c.name.toLowerCase().includes(query) || c.username.includes(query))
          .sort((a, b) => b.fame_score - a.fame_score)
          .slice(0, limit)
      : characters
          .sort((a, b) => b.fame_score - a.fame_score)
          .slice(0, limit)

    // Attach curated voices to each result
    const results = filtered.map(character => ({
      ...character,
      voices: (voices[character.username] ?? []).filter(v => v.curated).slice(0, 3),
    }))

    return NextResponse.json({ characters: results, total: filtered.length })
  } catch (error) {
    console.error('[voice-profiles/search] GET error:', error)
    return NextResponse.json({ error: 'Failed to search voices' }, { status: 500 })
  }
}