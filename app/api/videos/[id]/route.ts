import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { videos } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    const session = await auth.api.getSession({
      headers: await headers(),
    })
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [video] = await db
      .select()
      .from(videos)
      .where(and(eq(videos.id, id), eq(videos.userId, session.user.id)))

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    return NextResponse.json({ video })
  } catch (error) {
    console.error('[video] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch video' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    const session = await auth.api.getSession({
      headers: await headers(),
    })
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // 🆕 Destructure the new fields as well
    const { 
      title, 
      timeline, 
      status, 
      videoUrl, 
      duration, 
      aspectRatio, 
      subtitlesEnabled,
      subtitleUrl
    } = body

    const updateData: Record<string, unknown> = {}
    
    // Map all possible fields to the update object
    if (title !== undefined) updateData.title = title
    if (timeline !== undefined) updateData.timeline = timeline
    if (status !== undefined) updateData.status = status
    if (videoUrl !== undefined) updateData.videoUrl = videoUrl
    if (duration !== undefined) updateData.duration = duration
    if (aspectRatio !== undefined) updateData.aspectRatio = aspectRatio
    if (subtitlesEnabled !== undefined) updateData.subtitlesEnabled = subtitlesEnabled
    if (subtitleUrl !== undefined) updateData.subtitleUrl = subtitleUrl

    // 🆕 Safety check: If the request body had no recognized fields to update, 
    // Drizzle will throw "No values to set". We fetch the existing video instead.
    if (Object.keys(updateData).length === 0) {
      const [existing] = await db
        .select()
        .from(videos)
        .where(and(eq(videos.id, id), eq(videos.userId, session.user.id)))

      if (!existing) {
        return NextResponse.json({ error: 'Video not found' }, { status: 404 })
      }
      return NextResponse.json({ video: existing })
    }

    const [updated] = await db
      .update(videos)
      .set(updateData)
      .where(and(eq(videos.id, id), eq(videos.userId, session.user.id)))
      .returning()

    if (!updated) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    return NextResponse.json({ video: updated })
  } catch (error) {
    console.error('[video] PUT error:', error)
    return NextResponse.json({ error: 'Failed to update video' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    const session = await auth.api.getSession({
      headers: await headers(),
    })
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [deleted] = await db
      .delete(videos)
      .where(and(eq(videos.id, id), eq(videos.userId, session.user.id)))
      .returning()

    if (!deleted) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[video] DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete video' }, { status: 500 })
  }
}