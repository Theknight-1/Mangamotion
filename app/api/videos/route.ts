import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { videos } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { createId } from '@paralleldrive/cuid2'
import { headers } from 'next/headers'

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { projectId, title, sourceImage } = body

    if (!projectId || !title || !sourceImage) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const newVideo = await db
      .insert(videos)
      .values({
        id: createId(),
        userId: session.user.id,
        projectId,
        title,
        sourceImage,
        status: 'draft',
      })
      .returning()

    return NextResponse.json({ video: newVideo[0] }, { status: 201 })
  } catch (error) {
    console.error('[v0] Create video error:', error)
    return NextResponse.json({ error: 'Failed to create video' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const projectId = url.searchParams.get('projectId')

    let query = db.select().from(videos).where(eq(videos.userId, session.user.id))

    if (projectId) {
      query = db.select().from(videos).where(eq(videos.projectId, projectId))
    }

    const userVideos = await query

    return NextResponse.json({ videos: userVideos })
  } catch (error) {
    console.error('[v0] Get videos error:', error)
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 })
  }
}
