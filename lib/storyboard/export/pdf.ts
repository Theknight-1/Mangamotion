import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { put } from "@vercel/blob";

export interface StoryboardPdfShot {
  orderIndex: number;
  description: string;
  shotType?: string | null;
  cameraAngle?: string | null;
  dialogue?: string | null;
  duration?: number | null;
  imageUrl?: string | null;
  sceneTitle?: string | null;
}

export interface GeneratePdfParams {
  projectId: string;
  title: string;
  genre?: string | null;
  artStyle: string;
  aspectRatio: string;
  shots: StoryboardPdfShot[];
}

export async function generateStoryboardPdf(
  params: GeneratePdfParams,
): Promise<{ pdfUrl: string; pdfBuffer: Buffer }> {
  const { projectId, title, genre, artStyle, aspectRatio, shots } = params;

  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const PAGE_WIDTH = 595.28; // A4 portrait
  const PAGE_HEIGHT = 841.89;
  const MARGIN = 36;
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

  // Render Cover / First Page Header
  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  // Header Banner
  page.drawRectangle({
    x: MARGIN,
    y: y - 55,
    width: CONTENT_WIDTH,
    height: 55,
    color: rgb(0.06, 0.08, 0.1),
  });

  page.drawText("STORYBOARDER AI STUDIO", {
    x: MARGIN + 14,
    y: y - 22,
    size: 9,
    font: fontBold,
    color: rgb(0.95, 0.8, 0.2), // Yellow brand accent
  });

  page.drawText(title.toUpperCase(), {
    x: MARGIN + 14,
    y: y - 42,
    size: 16,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  y -= 70;

  // Metadata pills
  const metaText = `Genre: ${genre || "Standard"}  |  Style: ${artStyle}  |  Aspect Ratio: ${aspectRatio}  |  Total Shots: ${shots.length}`;
  page.drawText(metaText, {
    x: MARGIN,
    y,
    size: 9,
    font: fontRegular,
    color: rgb(0.4, 0.45, 0.5),
  });

  y -= 24;

  // Render 2 Shots Per Page for generous readability and clean presentation
  const SHOT_CARD_HEIGHT = 320;
  const IMAGE_WIDTH = 220;
  const IMAGE_HEIGHT = 160;

  for (let i = 0; i < shots.length; i++) {
    const shot = shots[i];

    // Check if we need a new page
    if (y - SHOT_CARD_HEIGHT < MARGIN) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN - 20;
    }

    const cardY = y - SHOT_CARD_HEIGHT + 20;

    // Shot Card Container Box
    page.drawRectangle({
      x: MARGIN,
      y: cardY,
      width: CONTENT_WIDTH,
      height: SHOT_CARD_HEIGHT - 20,
      color: rgb(0.97, 0.97, 0.98),
      borderColor: rgb(0.85, 0.87, 0.9),
      borderWidth: 1,
    });

    // Shot Number & Scene Header bar
    page.drawRectangle({
      x: MARGIN,
      y: cardY + SHOT_CARD_HEIGHT - 48,
      width: CONTENT_WIDTH,
      height: 28,
      color: rgb(0.12, 0.14, 0.18),
    });

    page.drawText(`SHOT ${i + 1}`, {
      x: MARGIN + 12,
      y: cardY + SHOT_CARD_HEIGHT - 39,
      size: 10,
      font: fontBold,
      color: rgb(0.95, 0.8, 0.2),
    });

    if (shot.sceneTitle) {
      page.drawText(shot.sceneTitle.slice(0, 45), {
        x: MARGIN + 80,
        y: cardY + SHOT_CARD_HEIGHT - 39,
        size: 9,
        font: fontRegular,
        color: rgb(0.9, 0.9, 0.9),
      });
    }

    // Try embedding image if available
    let embedded = false;
    if (shot.imageUrl) {
      try {
        const imgRes = await fetch(shot.imageUrl);
        if (imgRes.ok) {
          const imgBytes = await imgRes.arrayBuffer();
          const contentType = imgRes.headers.get("content-type") || "";
          let embeddedImage;
          if (contentType.includes("jpeg") || contentType.includes("jpg")) {
            embeddedImage = await pdfDoc.embedJpg(imgBytes);
          } else {
            embeddedImage = await pdfDoc.embedPng(imgBytes);
          }

          page.drawImage(embeddedImage, {
            x: MARGIN + 14,
            y: cardY + 70,
            width: IMAGE_WIDTH,
            height: IMAGE_HEIGHT,
          });
          embedded = true;
        }
      } catch (imgError) {
        console.warn(`[generateStoryboardPdf] Failed to embed image for shot ${i + 1}:`, imgError);
      }
    }

    // Image placeholder if image failed to load or is absent
    if (!embedded) {
      page.drawRectangle({
        x: MARGIN + 14,
        y: cardY + 70,
        width: IMAGE_WIDTH,
        height: IMAGE_HEIGHT,
        color: rgb(0.9, 0.92, 0.94),
        borderColor: rgb(0.8, 0.82, 0.85),
        borderWidth: 1,
      });

      page.drawText("No Image Rendered", {
        x: MARGIN + 60,
        y: cardY + 145,
        size: 9,
        font: fontRegular,
        color: rgb(0.5, 0.55, 0.6),
      });
    }

    // Right Side: Shot Metadata & Direction Details
    const textX = MARGIN + IMAGE_WIDTH + 26;
    const textWidth = CONTENT_WIDTH - IMAGE_WIDTH - 40;
    let textY = cardY + SHOT_CARD_HEIGHT - 65;

    // Badges: Camera & Timing
    const cameraBadge = `${shot.shotType || "Medium"} · ${shot.cameraAngle || "Eye-level"} · ${shot.duration || 3}s`;
    page.drawText(cameraBadge.toUpperCase(), {
      x: textX,
      y: textY,
      size: 8,
      font: fontBold,
      color: rgb(0.2, 0.5, 0.8),
    });

    textY -= 18;

    // Description Header & Body
    page.drawText("VISUAL ACTION:", {
      x: textX,
      y: textY,
      size: 8,
      font: fontBold,
      color: rgb(0.2, 0.2, 0.25),
    });

    textY -= 14;

    // Wrap description text to fit
    const desc = shot.description || "No visual description provided.";
    const words = desc.split(" ");
    let line = "";
    for (const word of words) {
      const testLine = line + (line ? " " : "") + word;
      if (testLine.length > 34) {
        page.drawText(line, {
          x: textX,
          y: textY,
          size: 8.5,
          font: fontRegular,
          color: rgb(0.15, 0.15, 0.2),
        });
        line = word;
        textY -= 12;
        if (textY < cardY + 50) break;
      } else {
        line = testLine;
      }
    }
    if (line && textY >= cardY + 50) {
      page.drawText(line, {
        x: textX,
        y: textY,
        size: 8.5,
        font: fontRegular,
        color: rgb(0.15, 0.15, 0.2),
      });
      textY -= 16;
    }

    // Dialogue (if present)
    if (shot.dialogue && textY >= cardY + 30) {
      page.drawText("DIALOGUE / AUDIO:", {
        x: textX,
        y: textY,
        size: 8,
        font: fontBold,
        color: rgb(0.7, 0.35, 0.05),
      });
      textY -= 12;
      page.drawText(`"${shot.dialogue.slice(0, 70)}"`, {
        x: textX,
        y: textY,
        size: 8,
        font: fontOblique,
        color: rgb(0.25, 0.25, 0.3),
      });
    }

    y -= SHOT_CARD_HEIGHT;
  }

  // Save PDF & Upload to Vercel Blob
  const pdfBytes = await pdfDoc.save();
  const pdfBuffer = Buffer.from(pdfBytes);

  const filename = `storyboard/projects/${projectId}/export-${Date.now()}.pdf`;
  const blob = await put(filename, pdfBuffer, {
    access: "public",
    contentType: "application/pdf",
  });

  return {
    pdfUrl: blob.url,
    pdfBuffer,
  };
}
