"use client";

import { useState, useEffect, useRef } from "react";
import {
  FolderOpen,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import type { Project } from "@/types/project";

interface ProjectListProps {
  projects: Project[];
  loadingProjects: boolean;
  selectedProjectId: string | null;
  selectProject: (id: string) => void;
  onProjectsChange: () => void;
}

export default function ProjectList({
  projects,
  loadingProjects,
  selectedProjectId,
  selectProject,
  onProjectsChange,
}: ProjectListProps) {
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDelete = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Project deleted");
        setOpenMenuId(null);
        onProjectsChange(); // Refresh list
        if (selectedProjectId === projectId) {
          selectProject(""); // Deselect if current project was deleted
        }
      } else {
        toast.error("Failed to delete project");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred");
    }
  };

  const handleEditClick = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setEditingProject(project);
    setOpenMenuId(null);
    // You can open a modal here instead of just setting state
    // For now, let's assume a simple prompt or modal implementation
    const newTitle = prompt("Enter new title:", project.title);
    if (newTitle && newTitle !== project.title) {
      updateProjectTitle(project.id, newTitle);
    }
    setEditingProject(null);
  };

  const updateProjectTitle = async (projectId: string, newTitle: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });
      if (res.ok) {
        toast.success("Project updated");
        onProjectsChange();
      } else {
        toast.error("Failed to update project");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred");
    }
  };

  if (loadingProjects) {
    return (
      <div className="space-y-2 px-1">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-8 w-full bg-white/5 rounded-xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <p className="text-xs text-white/25 px-1 py-2 text-center italic">
        No projects yet. Create one to get started.
      </p>
    );
  }

  return (
    <div className="space-y-1 px-1" ref={menuRef}>
      {projects.map((p) => {
        const isSelected = selectedProjectId === p.id;
        const isMenuOpen = openMenuId === p.id;
        const isHovered = hoveredProjectId === p.id;

        return (
          <div
            key={p.id}
            className="relative group"
            onMouseEnter={() => setHoveredProjectId(p.id)}
            onMouseLeave={() => setHoveredProjectId(null)}
          >
            <button
              onClick={() => selectProject(p.id)}
              className={cn(
                "w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-all duration-200 border",
                isSelected
                  ? "bg-[#bbdf50]/10 text-white border-[#bbdf50]/20 shadow-sm"
                  : "text-white/40 hover:bg-white/5 hover:text-white/70 border-transparent hover:border-white/5",
              )}
            >
              <span className="flex items-center gap-2 truncate flex-1">
                <FolderOpen
                  size={12}
                  className={cn(
                    "shrink-0",
                    isSelected ? "text-[#bbdf50]" : "text-white/30",
                  )}
                />
                <span className="truncate font-medium">{p.title}</span>
              </span>

              {/* Chevron shows only when not interacting with menu */}
              {!isMenuOpen && !isHovered && (
                <ChevronRight
                  size={11}
                  className="shrink-0 opacity-0 group-hover:opacity-30 transition-opacity"
                />
              )}
            </button>

            {/* Menu Trigger Button */}
            {(isHovered || isMenuOpen) && (
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuId(isMenuOpen ? null : p.id);
                  }}
                  className="p-1 rounded-md hover:bg-white/10 text-white/60 hover:text-white transition-colors focus:outline-none focus:ring-1 focus:ring-[#bbdf50]/50"
                  aria-label="More options"
                >
                  <MoreHorizontal size={14} />
                </button>
              </div>
            )}

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-36 bg-zinc-900 border border-white/10 rounded-lg shadow-xl overflow-hidden py-1 z-20 animate-in fade-in zoom-in-95 duration-100">
                <button
                  onClick={(e) => handleEditClick(e, p)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/70 hover:bg-white/5 hover:text-white text-left transition-colors"
                >
                  <Pencil size={12} />
                  Rename
                </button>
                <div className="h-px bg-white/5 my-1" />
                <button
                  onClick={(e) => handleDelete(e, p.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 text-left transition-colors"
                >
                  <Trash2 size={12} />
                  Delete
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
