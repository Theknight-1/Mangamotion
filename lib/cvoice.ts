import axios from 'axios'

const CVOICE_BASE_URL = 'https://api.cvoiceai.com/v1'

interface GenerateVoiceParams {
  text: string
  voiceId: string
  speed?: number
  pitch?: number
}

interface VoiceGeneration {
  audioUrl: string
  duration: number
  transcription: string
}

export async function generateVoice(params: GenerateVoiceParams): Promise<VoiceGeneration> {
  try {
    const response = await axios.post(
      `${CVOICE_BASE_URL}/audio/generate`,
      {
        text: params.text,
        voice_id: params.voiceId,
        speed: params.speed || 1,
        pitch: params.pitch || 0,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.CVOICE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    return {
      audioUrl: response.data.audio_url,
      duration: response.data.duration,
      transcription: params.text,
    }
  } catch (error) {
    console.error('[v0] CVoice AI error:', error)
    throw new Error('Failed to generate voice')
  }
}

export async function getAvailableVoices() {
  try {
    const response = await axios.get(`${CVOICE_BASE_URL}/voices`, {
      headers: {
        Authorization: `Bearer ${process.env.CVOICE_API_KEY}`,
      },
    })
    return response.data.voices
  } catch (error) {
    console.error('[v0] CVoice API error:', error)
    throw new Error('Failed to fetch available voices')
  }
}
