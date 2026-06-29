// hooks/use-render-progress.ts
"use client";

import { useState, useEffect, useCallback } from "react";

interface RenderProgress {
  type: "progress" | "complete" | "error";
  currentScene?: number;
  totalScenes?: number;
  status?: string;
  progress?: number;
  message?: string;
  videoUrl?: string;
}

export function useRenderProgress(videoId: string | null) {
  const [progress, setProgress] = useState<RenderProgress | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!videoId) return;

    // Use Server-Sent Events as fallback for Vercel
    const eventSource = new EventSource(`/api/progress/${videoId}`);

    eventSource.onopen = () => setConnected(true);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as RenderProgress;
        setProgress(data);

        if (data.type === "complete" || data.type === "error") {
          eventSource.close();
        }
      } catch (error) {
        console.error("Failed to parse progress:", error);
      }
    };

    eventSource.onerror = () => {
      setConnected(false);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [videoId]);

  return { progress, connected };
}
