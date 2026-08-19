// lib/storyboard/image-generation/types.ts

export interface GenerateImageInput {
  prompt: string;
  /** Reference images for character consistency, as public HTTPS URLs (Vercel Blob). */
  referenceImageUrls?: string[];
  aspectRatio?: string;
}

export interface GenerateImageResult {
  /** Raw image bytes — caller uploads to Vercel Blob, adapters don't touch storage. */
  imageBuffer: Buffer;
  contentType: string;
  modelUsed: "flux" | "nano-banana";
}

export class ImageGenerationError extends Error {
  public readonly isSafetyFlag: boolean;
  public readonly isRateLimit: boolean;

  constructor(
    message: string,
    public readonly provider: "flux" | "nano-banana",
    public readonly cause?: unknown,
    options?: { isSafetyFlag?: boolean; isRateLimit?: boolean },
  ) {
    super(message);
    this.name = "ImageGenerationError";
    this.isSafetyFlag = options?.isSafetyFlag ?? false;
    this.isRateLimit = options?.isRateLimit ?? false;
  }
}
