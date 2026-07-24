import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { projects as projectsTable } from '@/lib/db/schema' // Renamed to avoid conflict with variable name
import { eq } from 'drizzle-orm'
import { createId } from '@paralleldrive/cuid2'
import { headers } from 'next/headers'
import type { Project } from '@/types/project' // Ensure this path matches your shared type file

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Select specific columns to keep the query clean
    const rawProjects = await db
      .select({
        id: projectsTable.id,
        userId: projectsTable.userId,
        title: projectsTable.title,
        description: projectsTable.description,
        language: projectsTable.language,
        isOriginalContent: projectsTable.isOriginalContent,
        contentPurpose: projectsTable.contentPurpose,
        copyrightAgreedAt: projectsTable.copyrightAgreedAt,
        createdAt: projectsTable.createdAt,
        updatedAt: projectsTable.updatedAt,
      })
      .from(projectsTable)
      .where(eq(projectsTable.userId, session.user.id))
      .orderBy(projectsTable.updatedAt); // Optional: Sort by most recent

    // 2. Transform Date objects to ISO strings to match the 'Project' interface
    const serializedProjects: Project[] = rawProjects.map((p) => ({
      ...p,
      // Handle potential nulls if your schema allows it, though yours says notNull
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      copyrightAgreedAt: p.copyrightAgreedAt?.toISOString(),
    }));

    return NextResponse.json({ projects: serializedProjects });
  } catch (error) {
    console.error('[GET Projects] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, isOriginal, contentPurpose, language } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const newProject = await db
      .insert(projectsTable)
      .values({
        id: createId(),
        userId: session.user.id,
        title,
        description,
        isOriginalContent: isOriginal ?? true,
        contentPurpose: contentPurpose || null,
        language: language ?? 'en',
        copyrightAgreedAt: new Date(),
      })
      .returning();

    // 3. Serialize the returned project as well
    const serializedProject: Project = {
      ...newProject[0],
      createdAt: newProject[0].createdAt.toISOString(),
      updatedAt: newProject[0].updatedAt.toISOString(),
      copyrightAgreedAt: newProject[0].copyrightAgreedAt ? newProject[0].copyrightAgreedAt.toISOString() : undefined,
    };

    return NextResponse.json({ project: serializedProject }, { status: 201 });
  } catch (error) {
    console.error("[POST Project] Error:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 },
    );
  }
}
