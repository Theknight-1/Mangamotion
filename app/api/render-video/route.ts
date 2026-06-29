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
import type { Scene, Keyframe, AspectRatio, Emotion } from "@/types/scene";

// ── Utility modules ─────────────────────────────────────────────────────────
import {
  detectEmotion,
  getColorGradingFilter,
} from "@/lib/effects/color-grading";
import {
  autoSelectTransition,
  getTransitionFilter,
} from "@/lib/effects/transitions";
import { autoSelectSoundEffects } from "@/lib/audio/sound-effects";
import { selectBackgroundMusic } from "@/lib/audio/background-music";
import type { SoundEffect } from "@/lib/audio/sound-effects";
import type { BGMTrack } from "@/lib/audio/background-music";

// ── FFmpeg binary resolution ────────────────────────────────────────────────
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

// ── Helpers ────────────────────────────────────────────────────────────────

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

async function copyLocalMedia(url: string, destPath: string): Promise<boolean> {
  try {
    const localPath = path.join(process.cwd(), "public", url);
    await fs.copyFile(localPath, destPath);
    return true;
  } catch {
    return false;
  }
}

async function resolveMedia(url: string, destPath: string): Promise<void> {
  if (url.startsWith("http")) {
    await downloadToFile(url, destPath);
  } else {
    const ok = await copyLocalMedia(url, destPath);
    if (!ok) throw new Error(`Local media not found: ${url}`);
  }
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

  // Start with normalized width, then calculate height from aspect ratio
  let cw = Math.round(kf.w * img.w);
  let ch = Math.round(cw / aspect);

  // If height exceeds image, recalculate from height instead
  if (ch > img.h) {
    ch = Math.round(kf.h * img.h);
    cw = Math.round(ch * aspect);
  }

  // HARD CLAMP to image bounds — never exceed the actual image
  cw = Math.min(cw, img.w);
  ch = Math.min(ch, img.h);

  // Ensure even dimensions for codec compatibility
  cw = Math.max(2, cw);
  ch = Math.max(2, ch);
  if (cw % 2 !== 0) cw -= 1;
  if (ch % 2 !== 0) ch -= 1;

  // Calculate center position
  const centerX = (kf.x + kf.w / 2) * img.w;
  const centerY = (kf.y + kf.h / 2) * img.h;

  let cx = Math.round(centerX - cw / 2);
  let cy = Math.round(centerY - ch / 2);

  // Clamp position so crop stays within image bounds
  cx = Math.max(0, Math.min(cx, img.w - cw));
  cy = Math.max(0, Math.min(cy, img.h - ch));

  // Ensure even positions
  if (cx % 2 !== 0) cx -= 1;
  if (cy % 2 !== 0) cy -= 1;

  return { x: cx, y: cy, w: cw, h: ch };
}

// ─── Segment renderer with Cinematic Effects ─────────────────────────────

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
  effects: string[] = [],
  emotion?: Emotion,
): Promise<void> {
  const totalFrames = Math.max(2, Math.round(duration * FPS));
  const N = Math.max(1, totalFrames - 1);

  const smooth = (s: number, e: number): string => {
    return `${s}+(${e}-${s})*(0.5-0.5*cos(PI*n/${N}))`;
  };

  const img = await probeSize(imagePath);

  // 1. Calculate scale factor (largest crop fills output with 20% headroom)
  const maxCropW = Math.max(startCrop.w, endCrop.w);
  const maxCropH = Math.max(startCrop.h, endCrop.h);
  const needScaleW = (outW * 1.2) / maxCropW;
  const needScaleH = (outH * 1.2) / maxCropH;
  const sf = Math.max(1.0, Math.min(needScaleW, needScaleH, 6));

  // 2. PRODUCTION FIX: Compute EXACT scaled dimensions and FORCE even numbers.
  // Using bitwise & ~1 guarantees an even number, preventing yuv420p crashes.
  let scaledW = Math.round(img.w * sf) & ~1;
  let scaledH = Math.round(img.h * sf) & ~1;
  scaledW = Math.max(2, scaledW);
  scaledH = Math.max(2, scaledH);

  // 3. PRODUCTION FIX: 4px safety margin.
  // Eliminates the 1-2px floating-point rounding errors that occur when
  // FFmpeg internally evaluates the min/max() expressions on frame 0 or frame N.
  const safeMaxW = Math.max(2, scaledW - 4);
  const safeMaxH = Math.max(2, scaledH - 4);

  // 4. Map crop coordinates directly into SCALED image space (no intermediate steps)
  const sSX = startCrop.x * sf;
  const sSY = startCrop.y * sf;
  const sSW = startCrop.w * sf;
  const sSH = startCrop.h * sf;
  const eSX = endCrop.x * sf;
  const eSY = endCrop.y * sf;
  const eSW = endCrop.w * sf;
  const eSH = endCrop.h * sf;

  // Smooth interpolation expressions
  const rawWE = smooth(sSW, eSW);
  const rawHE = smooth(sSH, eSH);
  const rawXE = smooth(sSX, eSX);
  const rawYE = smooth(sSY, eSY);

  // Clamp SIZE: strictly between [2, safeMax]
  const wE = `min(max(${rawWE}\\,2)\\,${safeMaxW})`;
  const hE = `min(max(${rawHE}\\,2)\\,${safeMaxH})`;

  // Clamp POSITION: strictly between [0, scaledDim - cropSize]
  let xE = `min(max(${rawXE}\\,0)\\,${scaledW}-(${wE}))`;
  let yE = `min(max(${rawYE}\\,0)\\,${scaledH}-(${hE}))`;

  if (effects.includes("shake")) {
    // Shake MUST be clamped inside the bounds, otherwise it pushes the crop out of frame
    const shakeX = `(${xE})+12*sin(n/5)`;
    const shakeY = `(${yE})+12*cos(n/5)`;
    xE = `min(max(${shakeX}\\,0)\\,${scaledW}-(${wE}))`;
    yE = `min(max(${shakeY}\\,0)\\,${scaledH}-(${hE}))`;
  }

  const filterChain = [
    // Use exact pixel integers computed above, NOT iw*sf
    `scale=${scaledW}:${scaledH}:flags=lanczos`,
    `crop=${wE}:${hE}:${xE}:${yE}`,
    `scale=${outW}:${outH}:flags=lanczos`,
  ];

  if (emotion) {
    const colorFilter = getColorGradingFilter(emotion);
    if (colorFilter) filterChain.push(colorFilter);
  } else {
    filterChain.push(`eq=contrast=1.05:brightness=0.02:saturation=1.05`);
  }

  if (effects.includes("flash")) {
    filterChain.push(`eq=brightness=0.6:enable='between(t\\,0\\,0.15)'`);
  }
  if (effects.includes("fade_in")) {
    filterChain.push(`fade=t=in:st=0:d=0.5`);
  }

  const filterString = filterChain.join(",");
  const safeImagePath = imagePath.replace(/\\/g, "/");
  const safeOutPath = outPath.replace(/\\/g, "/");

  return new Promise((resolve, reject) => {
    const cmd = ffmpeg(safeImagePath)
      .inputOptions([
        "-loop 1",
        "-err_detect",
        "ignore_err", // PRODUCTION FIX: Don't crash whole render on 1 bad pixel
      ])
      .duration(duration)
      .outputOptions([
        `-vf ${filterString}`,
        `-r ${FPS}`,
        "-pix_fmt yuv420p",
        "-preset fast",
        "-crf 18",
        "-movflags +faststart",
      ])
      .output(safeOutPath);

    cmd.on("start", (cmdLine) => {
      console.log(`[seg${segIdx}] FFmpeg command: ${cmdLine}`);
    });
    cmd.on("end", () => resolve());
    cmd.on("error", (err, _stdout, stderr) => {
      console.error(`[seg${segIdx}] FFmpeg stderr:`, stderr);
      reject(new Error(`seg[${segIdx}]: ${err.message}`));
    });
    cmd.run();
  });
}

// ─── Scene clip renderer ──────────────────────────────────────────────────

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
  emotion?: Emotion,
): Promise<void> {
  const img = await probeSize(imagePath);
  let kfs = [...keyframes].sort((a, b) => a.t - b.t);

  const duration = Math.max(1, audioDuration);

  if (kfs.length === 0 || kfs[0].t > 0.01)
    kfs.unshift({ t: 0, x: 0, y: 0, w: 1, h: 1 });
  kfs[0] = { ...kfs[0], t: 0 };

  const maxT = kfs[kfs.length - 1].t;
  if (maxT > 0.1 && Math.abs(maxT - duration) > 0.3) {
    const scale = duration / maxT;
    kfs.forEach((kf) => {
      kf.t = parseFloat((kf.t * scale).toFixed(3));
    });
  }
  if (kfs[kfs.length - 1].t < duration - 0.05) {
    kfs.push({ ...kfs[kfs.length - 1], t: duration });
  }

  const sourceAspect = img.w / img.h;
  const targetAspect = outW / outH;

  if (sourceAspect < targetAspect * 0.8) {
    const panH = Math.max(0.6, 0.7);
    const maxY = Math.max(0, 1 - panH);
    kfs = [
      { t: 0, x: 0, y: 0, w: 1, h: panH },
      { t: duration * 0.5, x: 0, y: maxY * 0.5, w: 1, h: panH },
      { t: duration, x: 0, y: maxY, w: 1, h: panH },
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
      duration,
      outPath,
      0,
      1,
      tmpDir,
      outW,
      outH,
      effects,
      emotion,
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
      emotion,
    );
    subClips.push(segPath);
  }

  if (subClips.length === 1) {
    await fs.copyFile(subClips[0], outPath);
    return;
  }
  await concatClips(subClips, outPath, tmpDir);
}

// ─── Concat ──────────────────────────────────────────────────────────────

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

// ─── Audio helpers ───────────────────────────────────────────────────────

function muxVideoAudio(
  videoPath: string,
  audioPath: string,
  duration: number,
  outPath: string,
  sfxPaths?: string[],
): Promise<void> {
  return new Promise((resolve, reject) => {
    const cmd = ffmpeg();
    cmd.input(videoPath);
    cmd.input(audioPath);

    if (sfxPaths && sfxPaths.length > 0) {
      sfxPaths.forEach((sfx) => cmd.input(sfx));
    }

    let filter: string;
    const sfxCount = sfxPaths?.length ?? 0;

    if (sfxCount > 0) {
      const sfxFilters = sfxPaths!
        .map((_, i) => {
          const delay = (i * duration) / sfxCount;
          return `[${i + 2}:a]adelay=${Math.round(delay * 1000)}|${Math.round(
            delay * 1000,
          )},volume=0.8[sfx${i}]`;
        })
        .join(";");

      const mixInputs = sfxPaths!.map((_, i) => `[sfx${i}]`).join("");
      filter = `
        [1:a]apad,atrim=duration=${duration}[voice];
        ${sfxFilters};
        ${mixInputs}[voice]amix=inputs=${
          sfxCount + 1
        }:duration=first:dropout_transition=2,atrim=duration=${duration}[a]
      `;
    } else {
      filter = `[1:a]apad,atrim=duration=${duration}[a]`;
    }

    cmd
      .complexFilter(filter)
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

function addSilentAudio(
  videoPath: string,
  duration: number,
  outPath: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(videoPath)
      .input("anullsrc=r=48000:cl=stereo")
      .inputFormat("lavfi")
      .outputOptions([
        "-c:v copy",
        "-c:a aac",
        "-b:a 192k",
        "-shortest",
        "-t",
        `${duration}`,
        "-movflags +faststart",
      ])
      .output(outPath)
      .on("end", () => resolve())
      .on("error", (err) => reject(new Error(`silent audio: ${err.message}`)))
      .run();
  });
}

function mixBGM(
  videoPath: string,
  bgmPath: string,
  outPath: string,
  duration: number,
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(videoPath)
      .input(bgmPath)
      .complexFilter([
        `[0:a]asplit[main][sidechain]`,
        `[1:a]aloop=loop=-1:size=2e+09,volume=0.3[bgm]`,
        `[bgm][sidechain]sidechaincompress=threshold=0.1:ratio=4:attack=5:release=200[bgm_ducked]`,
        `[main][bgm_ducked]amix=inputs=2:duration=first:dropout_transition=3,atrim=duration=${duration}[a]`,
      ])
      .outputOptions([
        "-map 0:v",
        "-map [a]",
        "-c:v copy",
        "-c:a aac",
        "-b:a 192k",
        "-t",
        `${duration}`,
        "-movflags +faststart",
      ])
      .output(outPath)
      .on("end", () => resolve())
      .on("error", (err) => reject(new Error(`bgm mix: ${err.message}`)))
      .run();
  });
}

async function ensureAudioStream(
  videoPath: string,
  duration: number,
  tmpDir: string,
): Promise<string> {
  const hasAudio = await new Promise<boolean>((resolve) => {
    ffmpeg.ffprobe(videoPath, (err, meta) => {
      if (err) return resolve(false);
      const audio = meta.streams.find((s) => s.codec_type === "audio");
      resolve(!!audio);
    });
  });

  if (hasAudio) return videoPath;

  const silentPath = path.join(tmpDir, `silent-${path.basename(videoPath)}`);
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(videoPath)
      .input("anullsrc=r=48000:cl=stereo")
      .inputFormat("lavfi")
      .outputOptions([
        "-c:v copy",
        "-c:a aac",
        "-b:a 192k",
        "-ar 48000",
        "-ac 2",
        "-shortest",
        "-t",
        `${duration}`,
        "-movflags +faststart",
      ])
      .output(silentPath)
      .on("end", () => resolve(silentPath))
      .on("error", (err) => reject(new Error(`ensureAudio: ${err.message}`)))
      .run();
  });
}

async function normalizeAudio(
  videoPath: string,
  outPath: string,
  duration: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(videoPath)
      .outputOptions([
        "-c:v copy",
        "-c:a aac",
        "-b:a 192k",
        "-ar 48000",
        "-ac 2",
        "-t",
        `${duration}`,
        "-movflags +faststart",
      ])
      .output(outPath)
      .on("end", () => resolve(outPath))
      .on("error", (err) => reject(new Error(`normalizeAudio: ${err.message}`)))
      .run();
  });
}

async function applySceneTransition(
  clipA: string,
  clipB: string,
  fromScene: Scene,
  toScene: Scene,
  durationA: number,
  outPath: string,
  tmpDir: string,
): Promise<number> {
  const durationB = toScene.voice?.duration ?? 6;
  const fadeDur = 0.3;

  const totalDuration = durationA + durationB - fadeDur;

  const clipAWithAudio = await ensureAudioStream(clipA, durationA, tmpDir);
  const clipBWithAudio = await ensureAudioStream(clipB, durationB, tmpDir);

  const normA = path.join(tmpDir, `norm-a-${Date.now()}.mp4`);
  const normB = path.join(tmpDir, `norm-b-${Date.now()}.mp4`);
  await normalizeAudio(clipAWithAudio, normA, durationA);
  await normalizeAudio(clipBWithAudio, normB, durationB);

  const vFilter = `[0:v][1:v]xfade=transition=fade:duration=${fadeDur}:offset=${Math.max(0, durationA - fadeDur).toFixed(2)},format=yuv420p[v]`;

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(normA)
      .input(normB)
      .complexFilter([
        vFilter,
        `[0:a][1:a]acrossfade=d=${fadeDur}:c1=tri:c2=tri[a]`,
      ])
      .outputOptions([
        "-map [v]",
        "-map [a]",
        "-c:v libx264",
        "-preset fast",
        "-crf 18",
        "-c:a aac",
        "-b:a 192k",
        "-ar 48000",
        "-ac 2",
        "-movflags +faststart",
        "-pix_fmt yuv420p",
      ])
      .output(outPath)
      .on("end", () => resolve(totalDuration))
      .on("error", (err, stdout, stderr) => {
        console.error(`[transition] stderr:`, stderr);
        reject(new Error(`transition: ${err.message}`));
      })
      .run();
  });
}

// ─── WebVTT Generator ────────────────────────────────────────────────────

function generateVTT(scenes: Scene[], transitionDurations: number[]): string {
  let vtt = "WEBVTT\n\n";
  let currentTime = 0;

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const duration = scene.voice?.duration ?? 6;

    if (scene.dialogue?.trim()) {
      const start = formatVTTTime(currentTime);
      const end = formatVTTTime(currentTime + duration);
      vtt += `${start} --> ${end}\n${scene.dialogue.trim()}\n\n`;
    }

    if (i < scenes.length - 1) {
      currentTime += duration - transitionDurations[i];
    } else {
      currentTime += duration;
    }
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

// ─── Main pipeline ───────────────────────────────────────────────────────

function validateKeyframes(kfs: Keyframe[]): Keyframe[] {
  let validated = (kfs || [])
    .filter(
      (kf) =>
        typeof kf.t === "number" &&
        !isNaN(kf.t) &&
        typeof kf.x === "number" &&
        !isNaN(kf.x) &&
        kf.x >= 0 &&
        kf.x < 1 &&
        typeof kf.y === "number" &&
        !isNaN(kf.y) &&
        kf.y >= 0 &&
        kf.y < 1 &&
        typeof kf.w === "number" &&
        !isNaN(kf.w) &&
        kf.w >= 0.6 &&
        kf.w <= 1 &&
        typeof kf.h === "number" &&
        !isNaN(kf.h) &&
        kf.h >= 0.6 &&
        kf.h <= 1 &&
        kf.x + kf.w <= 1.02 &&
        kf.y + kf.h <= 1.02,
    )
    .map((kf) => ({
      t: kf.t,
      x: Math.max(0, Math.min(kf.x, 1 - kf.w)),
      y: Math.max(0, Math.min(kf.y, 1 - kf.h)),
      w: Math.min(kf.w, 1),
      h: Math.min(kf.h, 1),
    }))
    .sort((a, b) => a.t - b.t);

  validated = validated.filter(
    (kf, i, arr) => i === 0 || Math.abs(kf.t - arr[i - 1].t) > 0.1,
  );

  if (validated.length === 0 || validated[0].t > 0.1) {
    validated.unshift({ t: 0, x: 0, y: 0, w: 1, h: 1 });
  } else {
    validated[0].t = 0;
  }

  if (validated.length < 2) validated = getDefaultKeyframes();
  return validated;
}

function getDefaultKeyframes(): Keyframe[] {
  return [
    { t: 0, x: 0, y: 0, w: 1, h: 1 },
    { t: 2.5, x: 0.02, y: 0.02, w: 0.92, h: 0.92 },
    { t: 6.0, x: 0.04, y: 0.03, w: 0.88, h: 0.88 },
  ];
}

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
    const updatedScenes: Scene[] = [...scenes];
    const sceneClipPaths: string[] = [];
    const sceneDurations: number[] = [];

    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      const prefix = path.join(tmpDir, `s${scene.index}`);
      const finalPath = `${prefix}-final.mp4`;

      if (scene.clipUrl) {
        try {
          await downloadToFile(scene.clipUrl, finalPath);
          const dur = await probeDuration(finalPath);
          if (dur > 0.5) {
            sceneClipPaths.push(finalPath);
            sceneDurations.push(dur);
            continue;
          }
          console.warn(
            `[render:${videoId}] Cached clip ${scene.index} has invalid duration ${dur}, re-rendering`,
          );
        } catch (e) {
          console.warn(
            `[render:${videoId}] Failed to reuse cached clip ${scene.index}, re-rendering`,
          );
        }
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

      duration = Math.max(2, duration);

      let keyframes: Keyframe[] =
        (scene.keyframes?.length ?? 0) >= 2
          ? scene.keyframes
          : [
              { t: 0, x: 0, y: 0, w: 1, h: 1 },
              { t: duration * 0.3, x: 0.05, y: 0.03, w: 0.85, h: 0.85 },
              { t: duration * 0.7, x: 0.1, y: 0.06, w: 0.72, h: 0.72 },
              { t: duration, x: 0.12, y: 0.08, w: 0.65, h: 0.65 },
            ];

      keyframes = validateKeyframes(keyframes);

      const emotion = scene.narration
        ? detectEmotion(scene.narration)
        : "drama";

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
        emotion,
      );

      const selectedSFX = autoSelectSoundEffects(
        scene.narration ?? "",
        scene.effects || [],
        emotion,
      );

      const sfxPaths: string[] = [];
      for (const sfx of selectedSFX) {
        const sfxDest = path.join(tmpDir, `s${i}-${sfx.id}.mp3`);
        try {
          await resolveMedia(sfx.url, sfxDest);
          sfxPaths.push(sfxDest);
        } catch (err) {
          console.warn(
            `[render:${videoId}] SFX missing (${sfx.url}), skipping`,
          );
        }
      }

      if (audioPath) {
        await muxVideoAudio(
          silentPath,
          audioPath,
          duration,
          finalPath,
          sfxPaths.length > 0 ? sfxPaths : undefined,
        );
      } else {
        await addSilentAudio(silentPath, duration, finalPath);
      }

      const clipKey = `clips/${userId}/${videoId}/scene-${scene.index}-${Date.now()}.mp4`;
      const clipBlob = await put(clipKey, await fs.readFile(finalPath), {
        access: "public",
        contentType: "video/mp4",
        addRandomSuffix: false,
      });

      updatedScenes[scene.index] = { ...scene, clipUrl: clipBlob.url };
      sceneClipPaths.push(finalPath);
      sceneDurations.push(duration);
    }

    let finalVideoPath = sceneClipPaths[0];
    let finalVideoDuration = sceneDurations[0];

    for (let i = 1; i < sceneClipPaths.length; i++) {
      const transitionOut = path.join(tmpDir, `transition-${i}.mp4`);
      finalVideoDuration = await applySceneTransition(
        finalVideoPath,
        sceneClipPaths[i],
        updatedScenes[i - 1],
        updatedScenes[i],
        finalVideoDuration,
        transitionOut,
        tmpDir,
      );
      finalVideoPath = transitionOut;
    }

    const blobKey = `renders/${userId}/${videoId}/output-${Date.now()}.mp4`;

    // ── Optional BGM pass — skips silently if no track matches or file is missing ──
    // selectBackgroundMusic returns null when no mood-matched track exists in the
    // library, and mixBGM is only attempted if the track's audio file actually
    // resolves on disk/remote. Any failure here falls back to the BGM-less video
    // rather than failing the whole render — music is a nice-to-have, not required.
    let videoForUpload = finalVideoPath;
    const bgmTrack = selectBackgroundMusic(
      updatedScenes.map((s) => ({ emotion: s.emotion, effects: s.effects })),
      finalVideoDuration,
    );

    if (bgmTrack) {
      const bgmDest = path.join(tmpDir, `bgm-${bgmTrack.id}.mp3`);
      try {
        await resolveMedia(bgmTrack.url, bgmDest);
        const bgmOutPath = path.join(tmpDir, "with-bgm.mp4");
        await mixBGM(finalVideoPath, bgmDest, bgmOutPath, finalVideoDuration);
        videoForUpload = bgmOutPath;
        console.log(`[render:${videoId}] BGM mixed: ${bgmTrack.id}`);
      } catch (err) {
        console.warn(
          `[render:${videoId}] BGM track "${bgmTrack.id}" unavailable (${bgmTrack.url}), skipping music`,
        );
        // videoForUpload stays as finalVideoPath — render continues without music
      }
    }

    const blob = await put(blobKey, await fs.readFile(videoForUpload), {
      access: "public",
      contentType: "video/mp4",
      addRandomSuffix: false,
    });

    let subtitleUrl = null;
    if (subtitlesEnabled && updatedScenes.some((s) => s.dialogue?.trim())) {
      const transitionDurations: number[] = [];
      for (let i = 0; i < updatedScenes.length - 1; i++) {
        const t = autoSelectTransition(
          {
            emotion: updatedScenes[i].emotion,
            effects: updatedScenes[i].effects,
          },
          {
            emotion: updatedScenes[i + 1].emotion,
            effects: updatedScenes[i + 1].effects,
          },
        );
        const durA = updatedScenes[i].voice?.duration ?? 6;
        const durB = updatedScenes[i + 1].voice?.duration ?? 6;
        transitionDurations.push(
          Math.min(t.duration, durA * 0.4, durB * 0.4, 1.0),
        );
      }

      const vttContent = generateVTT(updatedScenes, transitionDurations);
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
        duration: Math.round(finalVideoDuration),
        timeline: JSON.stringify(updatedScenes),
      })
      .where(and(eq(videos.id, videoId), eq(videos.userId, userId)));
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

// ─── Route ────────────────────────────────────────────────────────────────

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
