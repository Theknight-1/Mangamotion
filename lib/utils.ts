import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const fadeUp = {
  hidden: {
    opacity: 0,
    y: 24,
  },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      delay,
      ease: "easeOut",
    },
  }),
};

export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await fn(items[i], i);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, worker);
  await Promise.all(workers);
  return results;
}


// Add this helper function outside your component, or at the top of your render logic
export const getAspectRatioClass = (ratio?: string | null) => {
  switch (ratio) {
    case "9:16":
      return "aspect-[9/16]"; // Vertical / Portrait
    case "1:1":
      return "aspect-square"; // Square
    case "4:5":
      return "aspect-[4/5]"; // Social Portrait
    case "2.39:1":
      return "aspect-[2.39/1]"; // Ultra-wide Anamorphic
    case "16:9":
    default:
      return "aspect-video"; // Standard Widescreen (Fallback)
  }
};