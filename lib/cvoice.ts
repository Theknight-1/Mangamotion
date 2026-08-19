const CVOICE_URL = process.env.CVOICE_API_URL || 'https://cvoice.ai/api/tts'

interface GenerateVoiceParams {
  text: string
  voiceId: string
  language?: string
  speed?: number
  pitch?: number
}

interface VoiceGeneration {
  audioUrl: string
  duration: number
  transcription: string
}

export async function generateVoice(params: GenerateVoiceParams): Promise<VoiceGeneration> {
  const cvoiceKey = process.env.CVOICE_API_KEY
  if (!cvoiceKey) {
    throw new Error('CVOICE_API_KEY is not configured in environment variables')
  }

  const trimmedText = params.text.trim()
  const language = params.language || 'en'

  const cvoiceRes = await fetch(CVOICE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': cvoiceKey,
    },
    body: JSON.stringify({
      voice_id: params.voiceId,
      text: trimmedText,
      language: language,
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

  const estimatedDuration =
    cvoiceData.duration || Math.max(2, Math.ceil(trimmedText.length / 14))

  return {
    audioUrl,
    duration: estimatedDuration,
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
