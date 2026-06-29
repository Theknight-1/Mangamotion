// app/api/voice-profiles/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

const DATASET_SEARCH = 'https://cvoice.ai/dataset_search.json'
const DATASET_VOICES = 'https://cvoice.ai/dataset_voices.json'

// Cache in module scope — datasets are static between CVoice deploys
let cachedCharacters: any[] | null = null
let cachedVoices: any[] | null = null
let cacheTime = 0
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

async function getDatasets() {
  const now = Date.now()
  if (cachedCharacters && cachedVoices && now - cacheTime < CACHE_TTL_MS) {
    return { characters: cachedCharacters, voices: cachedVoices }
  }

  const [chars, vox] = await Promise.all([
    fetch(DATASET_SEARCH, { next: { revalidate: 3600 } }).then(r => r.json()),
    fetch(DATASET_VOICES, { next: { revalidate: 3600 } }).then(r => r.json()),
  ])

  cachedCharacters = chars
  cachedVoices = vox // Store as-is, likely an array
  cacheTime = now

  return { characters: cachedCharacters ?? [], voices: cachedVoices ?? [] }
}

// GET /api/voice-profiles?q=naruto&limit=20
export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const search = (searchParams.get('q') ?? searchParams.get('search') ?? '').toLowerCase().trim()
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "100"), 50);

    const { characters, voices } = await getDatasets()

    // Filter characters by search term; sort by fame
    const matched = (characters ?? [])
      .filter((c: any) =>
        !search ||
        c.name.toLowerCase().includes(search) ||
        c.username.includes(search) ||
        c.occupations.some((o: string) => o.toLowerCase().includes(search))
      )
      .sort((a: any, b: any) => b.fame_score - a.fame_score)
      .slice(0, limit)

    // Map characters to their voices
    const profiles = matched.flatMap((char: any) => {
      // Find voices for this character - voices is likely an array
      const charVoices = Array.isArray(voices) 
        ? voices.filter((v: any) => 
            v.username === char.username || 
            v.person_slug === char.username ||
            v.character === char.name
          )
        : (voices[char.username] || [])
      
      // Prioritize curated voices, fallback to first available
      const curated = charVoices.filter((v: any) => v.curated)
      const pick = curated.length > 0 ? curated : charVoices.slice(0, 1)

      if (pick.length === 0) return [] // Skip characters with no voices

      return pick.map((v: any) => ({
        voice_id: v.voice_id || v.id, // Try different possible ID fields
        name: `${char.name} — ${v.name || 'Default Voice'}`,
        character: char.name,
        username: char.username,
        image_url: char.image_url,
        occupations: char.occupations,
        country: char.country,
        preview_url: v.preview_url || '',
        curated: v.curated || false,
      }))
    })

    return NextResponse.json({ profiles })
  } catch (error) {
    console.error('[voice-profiles] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch voice profiles' }, { status: 500 })
  }
}