const CVOICE_URL = process.env.CVOICE_API_URL || 'https://cvoice.ai/api/tts'

const CVOICE_MAX_CHARS = 500
const CVOICE_MIN_CHARS = 50

interface GenerateVoiceParams {
  text: string
  voiceId: string
  language?: string
  speed?: number
  pitch?: number
}

interface VoiceGeneration {
  audioUrl: string
  /** Array of audio URLs if the text was split into chunks */
  audioUrls?: string[]
  duration: number
  transcription: string
}

/**
 * Split text into chunks at sentence boundaries, respecting CVoice's
 * 50-500 character limit per API call.
 */
export function splitTextBySentence(text: string, maxChars = CVOICE_MAX_CHARS): string[] {
  const trimmed = text.trim()
  if (trimmed.length <= maxChars) return [trimmed]

  // Split on sentence-ending punctuation followed by whitespace
  const sentences = trimmed.match(/[^.!?]*[.!?]+[\s]*/g) || [trimmed]

  const chunks: string[] = []
  let currentChunk = ''

  for (const sentence of sentences) {
    const candidate = currentChunk + sentence
    if (candidate.trim().length <= maxChars) {
      currentChunk = candidate
    } else {
      // Push current chunk if non-empty
      if (currentChunk.trim().length >= CVOICE_MIN_CHARS) {
        chunks.push(currentChunk.trim())
      } else if (currentChunk.trim().length > 0) {
        // Chunk too short — prepend to the next sentence
        currentChunk = currentChunk + sentence
        continue
      }
      currentChunk = sentence
    }
  }

  // Push remaining text
  if (currentChunk.trim().length > 0) {
    // If the last chunk is too short, merge with the previous one if possible
    if (currentChunk.trim().length < CVOICE_MIN_CHARS && chunks.length > 0) {
      const last = chunks.pop()!
      const merged = last + ' ' + currentChunk.trim()
      if (merged.length <= maxChars) {
        chunks.push(merged)
      } else {
        chunks.push(last)
        chunks.push(currentChunk.trim())
      }
    } else {
      chunks.push(currentChunk.trim())
    }
  }

  return chunks.length > 0 ? chunks : [trimmed.slice(0, maxChars)]
}

async function callCVoiceTTS(
  text: string,
  voiceId: string,
  language: string,
  apiKey: string,
): Promise<{ audioUrl: string; duration: number }> {
  const cvoiceRes = await fetch(CVOICE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    },
    body: JSON.stringify({
      voice_id: voiceId,
      text,
      language,
    }),
  })

  if (!cvoiceRes.ok) {
    const errText = await cvoiceRes.text()
    console.error('[generateVoice] CVoice error:', errText)
    throw new Error(`Voice generation failed: ${errText}`)
  }

  const cvoiceData = await cvoiceRes.json()
  const audioUrl: string = cvoiceData.url || cvoiceData.audio_url || cvoiceData.audioUrl

  if (!audioUrl) {
    console.error('[generateVoice] Missing audio URL in response:', cvoiceData)
    throw new Error('No audio URL returned from voice generation service')
  }

  const duration = cvoiceData.duration || Math.max(2, Math.ceil(text.length / 14))
  return { audioUrl, duration }
}

export async function generateVoice(params: GenerateVoiceParams): Promise<VoiceGeneration> {
  const cvoiceKey = process.env.CVOICE_API_KEY
  if (!cvoiceKey) {
    throw new Error('CVOICE_API_KEY is not configured in environment variables')
  }

  const trimmedText = params.text.trim()
  const language = params.language || 'en'

  // Split into chunks if text exceeds the API character limit
  const chunks = splitTextBySentence(trimmedText)

  if (chunks.length === 1) {
    // Single chunk — simple path
    const result = await callCVoiceTTS(chunks[0], params.voiceId, language, cvoiceKey)
    return {
      audioUrl: result.audioUrl,
      duration: result.duration,
      transcription: trimmedText,
    }
  }

  // Multiple chunks — generate audio for each sequentially
  const results: { audioUrl: string; duration: number }[] = []
  for (let i = 0; i < chunks.length; i++) {
    const result = await callCVoiceTTS(chunks[i], params.voiceId, language, cvoiceKey)
    results.push(result)
    // Small delay between calls to respect rate limits
    if (i < chunks.length - 1) {
      await new Promise((r) => setTimeout(r, 800))
    }
  }

  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0)

  return {
    audioUrl: results[0].audioUrl, // Primary audio URL (first chunk)
    audioUrls: results.map((r) => r.audioUrl),
    duration: totalDuration,
    transcription: trimmedText,
  }
}

export async function getAvailableVoices() {
  const cvoiceKey = process.env.CVOICE_API_KEY
  try {
    const response = await fetch(`${CVOICE_URL}/voices`, {
      headers: {
        'X-API-Key': cvoiceKey || '',
      },
    })
    if (!response.ok) {
      throw new Error(`Failed to fetch voices: ${response.statusText}`)
    }
    const data = await response.json()
    return data.voices || data
  } catch (error: any) {
    console.error('[CVoice API] error:', error.message || error)
    throw new Error('Failed to fetch available voices')
  }
}
