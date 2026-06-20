// app/api/generate-voice/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { videos } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { Scene } from '@/types/scene'

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { videoId, text, voiceId, sceneIndex } = body

    if (!text?.trim() || !voiceId || videoId === undefined || sceneIndex === undefined) {
      return NextResponse.json({ error: 'Missing required fields: videoId, text, voiceId, sceneIndex' }, { status: 400 })
    }

    if (text.length < 50 || text.length > 500) {
      return NextResponse.json({ error: 'Text must be 50–500 characters (CVoice requirement)' }, { status: 400 })
    }

    // Verify video belongs to user
    const [video] = await db
      .select()
      .from(videos)
      .where(and(eq(videos.id, videoId), eq(videos.userId, session.user.id)))

    if (!video) return NextResponse.json({ error: 'Video not found' }, { status: 404 })

    const cvoiceKey = process.env.CVOICE_API_KEY
    if (!cvoiceKey) {
      return NextResponse.json({ error: 'CVOICE_API_KEY not configured' }, { status: 500 })
    }

    // CVoice API — correct endpoint from docs
    const cvoiceRes = await fetch('https://cvoice.ai/api/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': cvoiceKey,
      },
      body: JSON.stringify({
        voice_id: voiceId,
        text: text.trim(),
      }),
    })

    if (!cvoiceRes.ok) {
      const err = await cvoiceRes.text()
      console.error('[generate-voice] CVoice error:', err)
      return NextResponse.json({ error: 'Voice generation failed', detail: err }, { status: 502 })
    }

    const cvoiceData = await cvoiceRes.json()
    const audioUrl: string = cvoiceData.url  // CVoice returns { url }

    // Estimate duration from text length (avg ~2.5 chars/second at normal speed)
    // CVoice doesn't return duration — we measure it accurately during render
    const estimatedDuration = Math.max(2, Math.ceil(text.trim().length / 14))

    // Update the scene in the video's timeline
    const currentTimeline: Scene[] =
      typeof video.timeline === 'string'
        ? JSON.parse(video.timeline || '[]')
        : (video.timeline as unknown as Scene[]) ?? []

    const updatedTimeline = currentTimeline.map(scene => {
      if (scene.index === sceneIndex) {
        return {
          ...scene,
          voice: { audioUrl, duration: estimatedDuration, text: text.trim() },
          status: 'done' as const,
        }
      }
      return scene
    })

    await db
      .update(videos)
      .set({ timeline: JSON.stringify(updatedTimeline) })
      .where(eq(videos.id, videoId))

    return NextResponse.json({
      success: true,
      voice: { audioUrl, duration: estimatedDuration, text: text.trim() },
    })
  } catch (error) {
    console.error('[generate-voice] error:', error)
    return NextResponse.json({ error: 'Voice generation failed' }, { status: 500 })
  }
}