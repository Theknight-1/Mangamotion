import ffmpeg from "fluent-ffmpeg";
import { put } from "@vercel/blob";
import fs from "fs/promises";
import path from "path";
import os from "os";

if (process.env.FFMPEG_PATH) ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH);
if (process.env.FFPROBE_PATH) ffmpeg.setFfprobePath(process.env.FFPROBE_PATH);

export interface SlideshowShotInput {
  orderIndex: number;
  imageUrl?: string | null;
  duration?: number | null;
  voiceAudioUrl?: string | null;
}

export interface GenerateSlideshowParams {
  projectId: string;
  shots: SlideshowShotInput[];
  aspectRatio?: string;
}

async function downloadToFile(url: string, destPath: string): Promise<void> {
  const opts: RequestInit = {};
  if (url.includes("blob.vercel-storage.com")) {
    opts.headers = {
      Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
    };
  }
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(`Download failed: ${url} -> ${res.status}`);
  await fs.writeFile(destPath, Buffer.from(await res.arrayBuffer()));
}

export async function generateStoryboardSlideshowVideo(
  params: GenerateSlideshowParams,
): Promise<{ videoUrl: string; duration: number }> {
  const { projectId, shots, aspectRatio = "16:9" } = params;

  if (!shots.length) {
    throw new Error("No shots provided for slideshow export");
  }

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "storyboard-slideshow-"));
  const outputVideoPath = path.join(tmpDir, "output.mp4");

  try {
    const validShots = shots.filter((s) => s.imageUrl);
    if (!validShots.length) {
      throw new Error("At least one shot must have a generated image for video export");
    }

    // Determine dimensions based on aspect ratio
    let width = 1920;
    let height = 1080;
    if (aspectRatio === "9:16") {
      width = 1080;
      height = 1920;
    } else if (aspectRatio === "1:1") {
      width = 1080;
      height = 1080;
    } else if (aspectRatio === "4:5") {
      width = 1080;
      height = 1350;
    } else if (aspectRatio === "2.39:1") {
      width = 1920;
      height = 804;
    }

    // Prepare shot segments list
    const segmentPaths: string[] = [];
    let totalDuration = 0;

    for (let i = 0; i < validShots.length; i++) {
      const shot = validShots[i];
      const duration = Math.max(2, shot.duration || 3);
      totalDuration += duration;

      const imgPath = path.join(tmpDir, `shot_${i}.png`);
      await downloadToFile(shot.imageUrl!, imgPath);

      const segmentPath = path.join(tmpDir, `segment_${i}.mp4`);

      // If shot or scene has voice audio, download it
      let audioPath: string | null = null;
      if (shot.voiceAudioUrl) {
        audioPath = path.join(tmpDir, `audio_${i}.mp3`);
        try {
          await downloadToFile(shot.voiceAudioUrl, audioPath);
        } catch (e) {
          audioPath = null;
        }
      }

      await new Promise<void>((resolve, reject) => {
        let cmd = ffmpeg()
          .input(imgPath)
          .loop(duration)
          .videoCodec("libx264")
          .size(`${width}x${height}`)
          .outputOptions([
            "-pix_fmt yuv420p",
            "-tune stillimage",
            `-t ${duration}`,
            "-r 30",
          ]);

        if (audioPath) {
          cmd = cmd.input(audioPath).audioCodec("aac").outputOptions(["-shortest"]);
        } else {
          // Add silent audio track for consistent container stitching
          cmd = cmd
            .input("anullsrc=r=44100:cl=stereo")
            .inputFormat("lavfi")
            .audioCodec("aac")
            .outputOptions([`-t ${duration}`]);
        }

        cmd
          .output(segmentPath)
          .on("end", () => resolve())
          .on("error", (err) => reject(err))
          .run();
      });

      segmentPaths.push(segmentPath);
    }

    // Concatenate all segments using FFmpeg concat demuxer
    const concatListPath = path.join(tmpDir, "concat_list.txt");
    const concatContent = segmentPaths
      .map((p) => `file '${p.replace(/\\/g, "/")}'`)
      .join("\n");
    await fs.writeFile(concatListPath, concatContent);

    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input(concatListPath)
        .inputOptions(["-f concat", "-safe 0"])
        .videoCodec("copy")
        .audioCodec("copy")
        .output(outputVideoPath)
        .on("end", () => resolve())
        .on("error", (err) => reject(err))
        .run();
    });

    const videoBuffer = await fs.readFile(outputVideoPath);
    const filename = `storyboard/projects/${projectId}/slideshow-${Date.now()}.mp4`;
    const blob = await put(filename, videoBuffer, {
      access: "public",
      contentType: "video/mp4",
    });

    return {
      videoUrl: blob.url,
      duration: totalDuration,
    };
  } finally {
    // Clean up temporary files
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup error
    }
  }
}
