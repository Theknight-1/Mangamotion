// app/api/render-video/route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { videos } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { put } from "@vercel/blob";
import fs from "fs/promises";
import path from "path";
import os from "os";
import ffmpeg from "fluent-ffmpeg";
import type { Scene, Keyframe, AspectRatio } from "@/types/scene";

// ── FFmpeg binary resolution ──────────────────────────────────────────────────
if (process.platform === "win32") {
  ffmpeg.setFfmpegPath("ffmpeg");
  ffmpeg.setFfprobePath("ffprobe");
} else {
  ffmpeg.setFfmpegPath(require("ffmpeg-static") as string);
  try {
    ffmpeg.setFfprobePath(require("ffprobe-static").path as string);
  } catch {
    /* optional */
  }
}

const FPS = 30;

const RESOLUTIONS: Record<AspectRatio, { w: number; h: number }> = {
  "9:16": { w: 1080, h: 1920 },
  "16:9": { w: 1920, h: 1080 },
  "1:1": { w: 1080, h: 1080 },
  "4:5": { w: 1080, h: 1350 },
};

interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}
interface ImageSize {
  w: number;
  h: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function downloadToFile(url: string, destPath: string): Promise<void> {
  const opts: RequestInit = {};
  if (url.includes("blob.vercel-storage.com")) {
    opts.headers = {
      Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
    };
  }
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(`Download failed: ${url} → ${res.status}`);
  await fs.writeFile(destPath, Buffer.from(await res.arrayBuffer()));
}

function probeSize(filePath: string): Promise<ImageSize> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, meta) => {
      if (err) return reject(new Error(`ffprobe failed: ${err.message}`));
      const s = meta.streams.find((s) => s.codec_type === "video");
      if (!s?.width || !s?.height)
        return reject(new Error("No video stream found"));
      resolve({ w: s.width, h: s.height });
    });
  });
}

function probeDuration(filePath: string): Promise<number> {
  return new Promise((resolve) => {
    ffmpeg.ffprobe(filePath, (err, meta) => {
      if (err) return resolve(0);
      const dur = meta.format.duration ?? 0;
      resolve(dur <= 0 ? 0 : dur);
    });
  });
}

function normToPixels(
  kf: Keyframe,
  img: ImageSize,
  outW: number,
  outH: number,
): CropRect {
  const aspect = outW / outH;
  let cw = Math.round(kf.w * img.w);
  let ch = Math.round(cw / aspect);
  if (ch > img.h) {
    ch = img.h;
    cw = Math.round(ch * aspect);
  }
  cw = Math.min(cw, img.w);
  ch = Math.min(ch, img.h);

  cw = Math.max(2, cw);
  ch = Math.max(2, ch);
  if (cw % 2 !== 0) cw -= 1;
  if (ch % 2 !== 0) ch -= 1;

  const centerX = (kf.x + kf.w / 2) * img.w;
  const centerY = (kf.y + kf.h / 2) * img.h;
  let cx = Math.round(centerX - cw / 2);
  let cy = Math.round(centerY - ch / 2);
  cx = Math.max(0, Math.min(cx, img.w - cw));
  cy = Math.max(0, Math.min(cy, img.h - ch));

  if (cx % 2 !== 0) cx -= 1;
  if (cy % 2 !== 0) cy -= 1;

  return { x: cx, y: cy, w: cw, h: ch };
}

// ─── Segment renderer with Cinematic Effects ─────────────────────────────────

async function renderSegment(
  imagePath: string,
  startCrop: CropRect,
  endCrop: CropRect,
  duration: number,
  outPath: string,
  segIdx: number,
  totalSegs: number,
  tmpDir: string,
  outW: number,
  outH: number,
  effects: string[] = []
): Promise<void> {
  const totalFrames = Math.max(2, Math.round(duration * FPS));
  const N = Math.max(1, totalFrames - 1);

  const smooth = (s: number, e: number): string => {
    return `${s} + (${e} - ${s}) * (0.5 - 0.5 * cos(PI * n / ${N}))`;
  };

  const minCropW = Math.min(startCrop.w, endCrop.w);
  const minCropH = Math.min(startCrop.h, endCrop.h);
  
  const scaleForW = (outW * 1.2) / minCropW;
  const scaleForH = (outH * 1.2) / minCropH;
  const sf = Math.max(1.5, Math.min(scaleForW, scaleForH, 6));
  
  console.log(`[seg${segIdx}] Duration=${duration.toFixed(2)}s, Scale=${sf.toFixed(2)}`);

  let xE = smooth(startCrop.x * sf, endCrop.x * sf);
  let yE = smooth(startCrop.y * sf, endCrop.y * sf);
  const wE = smooth(startCrop.w * sf, endCrop.w * sf);
  const hE = smooth(startCrop.h * sf, endCrop.h * sf);

  if (effects.includes('shake')) {
    xE = `(${xE}) + 12*sin(n/5)`;
    yE = `(${yE}) + 12*cos(n/5)`;
  }

  // 🆕 SIMPLE WORKING FILTER CHAIN
  const filters: string[] = [
    `scale=iw*${sf.toFixed(2)}:ih*${sf.toFixed(2)}:flags=lanczos`,
    `crop=${wE}:${hE}:${xE}:${yE}`,
    `scale=${outW}:${outH}:flags=lanczos`,
    `eq=contrast=1.05:brightness=0.02:saturation=1.05`,
  ];

  if (effects.includes('flash')) {
    filters.push(`eq=brightness=0.6:enable='between(t,0,0.15)'`);
  }
  if (effects.includes('fade_in')) {
    filters.push(`fade=t=in:st=0:d=0.5`);
  }

  const safeImagePath = imagePath.replace(/\\/g, '/');
  const safeOutPath = outPath.replace(/\\/g, '/');

  return new Promise((resolve, reject) => {
    const cmd = ffmpeg(safeImagePath)
      .inputOptions(["-loop 1"])
      .duration(duration)
      .videoFilters(filters)
      .videoCodec("libx264")
      .outputOptions([
        `-r ${FPS}`, 
        "-pix_fmt yuv420p", 
        "-preset fast", 
        "-crf 18", 
        "-movflags +faststart"
      ])
      .output(safeOutPath);
    
    cmd.on("start", () => console.log(`[seg${segIdx}] FFmpeg started`));
    cmd.on("end", () => {
      console.log(`[seg${segIdx}] ✓ Completed`);
      resolve();
    });
    cmd.on("error", (err, stdout, stderr) => {
      console.error(`[seg${segIdx}] FFmpeg stderr:`, stderr);
      reject(new Error(`seg[${segIdx}]: ${err.message}`));
    });
    cmd.run();
  });
}

// ─── Scene clip renderer ──────────────────────────────────────────────────────

async function renderSceneClip(
  imagePath: string,
  keyframes: Keyframe[],
  audioDuration: number,
  narration: string,
  outPath: string,
  tmpDir: string,
  sceneIdx: number,
  outW: number,
  outH: number,
  effects: string[] = [],
): Promise<void> {
  const img = await probeSize(imagePath);
  let kfs = [...keyframes].sort((a, b) => a.t - b.t);

  if (kfs.length === 0 || kfs[0].t > 0.01)
    kfs.unshift({ t: 0, x: 0, y: 0, w: 1, h: 1 });
  kfs[0] = { ...kfs[0], t: 0 };

  const maxT = kfs[kfs.length - 1].t;
  if (maxT > 0.1 && Math.abs(maxT - audioDuration) > 0.3) {
    const scale = audioDuration / maxT;
    kfs.forEach((kf) => {
      kf.t = parseFloat((kf.t * scale).toFixed(3));
    });
  }
  if (kfs[kfs.length - 1].t < audioDuration - 0.05) {
    kfs.push({ ...kfs[kfs.length - 1], t: audioDuration });
  }

  // 🆕 ASPECT RATIO FIX: If source is Portrait (9:16) and output is Landscape (16:9)
  // Force a vertical pan so the whole image is visible.
  const sourceAspect = img.w / img.h;
  const targetAspect = outW / outH;

  if (sourceAspect < targetAspect * 0.8) {
    console.log(
      `[Scene ${sceneIdx}] Aspect mismatch detected. Forcing vertical pan.`,
    );
    kfs = [
      { t: 0, x: 0, y: 0, w: 1, h: 0.55 }, // Start at top
      { t: audioDuration * 0.5, x: 0, y: 0.25, w: 1, h: 0.55 }, // Middle
      { t: audioDuration, x: 0, y: 0.45, w: 1, h: 0.55 }, // End at bottom
    ];
  }

  const segments = kfs
    .slice(0, -1)
    .map((kf, i) => ({ from: kf, to: kfs[i + 1], dur: kfs[i + 1].t - kf.t }))
    .filter((seg) => seg.dur >= 0.1);

  if (segments.length === 0) {
    const full = normToPixels(
      { t: 0, x: 0, y: 0, w: 1, h: 1 },
      img,
      outW,
      outH,
    );
    await renderSegment(
      imagePath,
      full,
      full,
      audioDuration,
      outPath,
      0,
      1,
      tmpDir,
      outW,
      outH,
      effects,
    );
    return;
  }

  const subClips: string[] = [];
  for (let i = 0; i < segments.length; i++) {
    const { from, to, dur } = segments[i];
    const segPath = path.join(tmpDir, `s${sceneIdx}-seg${i}.mp4`);
    const startCrop = normToPixels(from, img, outW, outH);
    const endCrop = normToPixels(to, img, outW, outH);
    await renderSegment(
      imagePath,
      startCrop,
      endCrop,
      dur,
      segPath,
      i,
      segments.length,
      tmpDir,
      outW,
      outH,
      effects,
    );
    subClips.push(segPath);
  }

  if (subClips.length === 1) {
    await fs.copyFile(subClips[0], outPath);
    return;
  }
  await concatClips(subClips, outPath, tmpDir);
}

// ─── Concat ──────────────────────────────────────────────────────────────────

function concatClips(
  clipPaths: string[],
  outPath: string,
  tmpDir: string,
): Promise<void> {
  if (clipPaths.length === 1) return fs.copyFile(clipPaths[0], outPath);
  return new Promise((resolve, reject) => {
    const listPath = path.join(tmpDir, `concat-${Date.now()}.txt`);
    const listContent = clipPaths
      .map((p) => `file '${p.replace(/\\/g, "/")}'`)
      .join("\n");
    fs.writeFile(listPath, listContent)
      .then(() => {
        ffmpeg()
          .input(listPath)
          .inputOptions(["-f concat", "-safe 0"])
          .outputOptions(["-c copy"])
          .output(outPath)
          .on("end", () => resolve())
          .on("error", (err) => reject(new Error(`concat: ${err.message}`)))
          .run();
      })
      .catch(reject);
  });
}

function muxVideoAudio(
  videoPath: string,
  audioPath: string,
  duration: number,
  outPath: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(videoPath)
      .input(audioPath)
      .complexFilter(`[1:a]apad,atrim=duration=${duration}[a]`)
      .outputOptions([
        "-map 0:v",
        "-map [a]",
        "-c:v copy",
        "-c:a aac",
        "-b:a 192k",
        `-t ${duration}`,
        "-movflags +faststart",
      ])
      .output(outPath)
      .on("end", () => resolve())
      .on("error", (err) => reject(new Error(`mux: ${err.message}`)))
      .run();
  });
}

// ─── WebVTT Generator ──────────────────────────────────────────────────────

function generateVTT(scenes: Scene[]): string {
  let vtt = "WEBVTT\n\n";
  let currentTime = 0;
  for (const scene of scenes) {
    const duration = scene.voice?.duration ?? 6;
    if (scene.dialogue?.trim()) {
      const start = formatVTTTime(currentTime);
      const end = formatVTTTime(currentTime + duration);
      vtt += `${start} --> ${end}\n${scene.dialogue.trim()}\n\n`;
    }
    currentTime += duration;
  }
  return vtt;
}

function formatVTTTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
    .toString()
    .padStart(2, "0");
  const m = Math.floor((seconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  const ms = Math.floor((seconds % 1) * 1000)
    .toString()
    .padStart(3, "0");
  return `${h}:${m}:${s}.${ms}`;
}

// ─── Incremental pipeline ─────────────────────────────────────────────────────

async function runRenderPipeline(
  videoId: string,
  userId: string,
  scenes: Scene[],
  aspectRatio: AspectRatio,
  subtitlesEnabled: boolean,
): Promise<void> {
  const { w: OUT_W, h: OUT_H } = RESOLUTIONS[aspectRatio];
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), `mm-${videoId}-`));

  try {
    console.log(
      `[render:${videoId}] Starting — ${scenes.length} scenes, ${aspectRatio} (${OUT_W}x${OUT_H})`,
    );
    const finalClips: string[] = [];
    const updatedScenes: Scene[] = [...scenes];

    for (const scene of scenes) {
      const prefix = path.join(tmpDir, `s${scene.index}`);
      const finalPath = `${prefix}-final.mp4`;

      if (scene.clipUrl) {
        console.log(
          `[render:${videoId}] Scene ${scene.index}: reusing cached clip`,
        );
        await downloadToFile(scene.clipUrl, finalPath);
        finalClips.push(finalPath);
        continue;
      }

      const imagePath = `${prefix}-panel.jpg`;
      const silentPath = `${prefix}-silent.mp4`;

      await downloadToFile(scene.imageUrl, imagePath);

      let duration = 6;
      let audioPath: string | null = null;

      if (scene.voice?.audioUrl) {
        audioPath = `${prefix}-voice.mp3`;
        await downloadToFile(scene.voice.audioUrl, audioPath);
        const measured = await probeDuration(audioPath);
        duration = measured > 0.2 ? measured : (scene.voice.duration ?? 6);
      }

      const keyframes: Keyframe[] =
        (scene.keyframes?.length ?? 0) >= 2
          ? scene.keyframes
          : [
              { t: 0, x: 0, y: 0, w: 1, h: 1 },
              { t: duration * 0.3, x: 0.05, y: 0.03, w: 0.85, h: 0.85 },
              { t: duration * 0.7, x: 0.1, y: 0.06, w: 0.72, h: 0.72 },
              { t: duration, x: 0.12, y: 0.08, w: 0.65, h: 0.65 },
            ];

      await renderSceneClip(
        imagePath,
        keyframes,
        duration,
        scene.narration ?? "",
        silentPath,
        tmpDir,
        scene.index,
        OUT_W,
        OUT_H,
        scene.effects || [],
      );

      if (audioPath) {
        await muxVideoAudio(silentPath, audioPath, duration, finalPath);
      } else {
        await fs.copyFile(silentPath, finalPath);
      }

      const clipKey = `clips/${userId}/${videoId}/scene-${scene.index}-${Date.now()}.mp4`;
      const clipBlob = await put(clipKey, await fs.readFile(finalPath), {
        access: "public",
        contentType: "video/mp4",
        addRandomSuffix: false,
      });

      updatedScenes[scene.index] = { ...scene, clipUrl: clipBlob.url };
      finalClips.push(finalPath);
    }

    const outputPath = path.join(tmpDir, "output.mp4");
    await concatClips(finalClips, outputPath, tmpDir);
    const totalDuration = await probeDuration(outputPath);

    const blobKey = `renders/${userId}/${videoId}/output-${Date.now()}.mp4`;
    const blob = await put(blobKey, await fs.readFile(outputPath), {
      access: "public",
      contentType: "video/mp4",
      addRandomSuffix: false,
    });

    let subtitleUrl = null;
    if (subtitlesEnabled && updatedScenes.some((s) => s.dialogue?.trim())) {
      const vttContent = generateVTT(updatedScenes);
      const vttPath = path.join(tmpDir, "subtitles.vtt");
      await fs.writeFile(vttPath, vttContent);

      const vttBlob = await put(
        `subtitles/${userId}/${videoId}/subs-${Date.now()}.vtt`,
        await fs.readFile(vttPath),
        {
          access: "public",
          contentType: "text/vtt",
          addRandomSuffix: false,
        },
      );
      subtitleUrl = vttBlob.url;
    }

    await db
      .update(videos)
      .set({
        status: "completed",
        videoUrl: blob.url,
        subtitleUrl: subtitleUrl,
        duration: Math.round(totalDuration),
        timeline: JSON.stringify(updatedScenes),
      })
      .where(and(eq(videos.id, videoId), eq(videos.userId, userId)));

    console.log(
      `[render:${videoId}] ✅ Done — ${totalDuration.toFixed(1)}s → ${blob.url}`,
    );
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[render:${videoId}] ❌ Failed:`, errorMsg);
    await db
      .update(videos)
      .set({ status: "failed" })
      .where(and(eq(videos.id, videoId), eq(videos.userId, userId)));
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const {
      videoId,
      timeline: incomingTimeline,
      aspectRatio,
      subtitlesEnabled,
    } = await request.json();
    if (!videoId)
      return NextResponse.json({ error: "videoId required" }, { status: 400 });

    const [video] = await db
      .select()
      .from(videos)
      .where(and(eq(videos.id, videoId), eq(videos.userId, session.user.id)));

    if (!video)
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    if (video.status === "processing")
      return NextResponse.json({ error: "Already rendering" }, { status: 409 });

    let scenes: Scene[] = incomingTimeline ?? [];
    if (!scenes.length && video.timeline) {
      try {
        const p =
          typeof video.timeline === "string"
            ? JSON.parse(video.timeline)
            : video.timeline;
        scenes = Array.isArray(p) ? p : [];
      } catch {
        scenes = [];
      }
    }

    if (!scenes.length)
      return NextResponse.json(
        { error: "Add at least one scene" },
        { status: 400 },
      );
    const missing = scenes.find((s) => !s.imageUrl);
    if (missing)
      return NextResponse.json(
        { error: `Scene ${missing.index + 1} has no panel image` },
        { status: 400 },
      );

    const finalAspectRatio = (aspectRatio ||
      video.aspectRatio ||
      "9:16") as AspectRatio;
    const finalSubtitlesEnabled =
      subtitlesEnabled ?? video.subtitlesEnabled ?? true;

    if (!RESOLUTIONS[finalAspectRatio]) {
      return NextResponse.json(
        { error: "Invalid aspect ratio" },
        { status: 400 },
      );
    }

    await db
      .update(videos)
      .set({
        status: "processing",
        timeline: JSON.stringify(scenes),
        aspectRatio: finalAspectRatio,
        subtitlesEnabled: finalSubtitlesEnabled,
      })
      .where(eq(videos.id, videoId));

    runRenderPipeline(
      videoId,
      session.user.id,
      scenes,
      finalAspectRatio,
      finalSubtitlesEnabled,
    ).catch((err) => console.error("[render] Unhandled:", err));

    return NextResponse.json({ success: true, status: "processing" });
  } catch (error) {
    console.error("[render-video] Route error:", error);
    return NextResponse.json(
      { error: "Failed to start render" },
      { status: 500 },
    );
  }
}
