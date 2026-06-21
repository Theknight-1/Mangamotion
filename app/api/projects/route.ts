import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { projects as projectsTable } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { createId } from '@paralleldrive/cuid2'
import { headers } from 'next/headers'
import type { Project } from '@/types/scene' 

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userProjects = await db
      .select({
        id: projectsTable.id,
        userId: projectsTable.userId,
        title: projectsTable.title,
        description: projectsTable.description,
        createdAt: projectsTable.createdAt,
        updatedAt: projectsTable.updatedAt,
      })
      .from(projectsTable)
      .where(eq(projectsTable.userId, session.user.id))

    const projects = userProjects.map((project) => ({
      ...project,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    })) as Project[]

    return NextResponse.json({ projects })
  } catch (error) {
    console.error('[GET Projects] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const newProject = await db
      .insert(projects)
      .values({
        id: createId(),
        userId: session.user.id,
        title,
        description,
      })
      .returning()

    return NextResponse.json({ project: newProject[0] }, { status: 201 })
  } catch (error) {
    console.error('[v0] Create project error:', error)
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }
}
