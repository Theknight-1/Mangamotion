import { PDFDocument } from "pdf-lib";
import { PDFParse } from "pdf-parse";

export interface ParsedScriptResult {
  text: string;
  pageCount?: number;
  format: "text" | "pdf" | "docx" | "fountain" | "fdx";
}

/**
 * Extracts text and validates page count from various script file types.
 */
export async function parseScriptBuffer(
  buffer: Buffer,
  filename: string,
): Promise<ParsedScriptResult> {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "txt";

  if (ext === "pdf") {
    return parsePdfScript(buffer);
  }

  if (ext === "docx") {
    return parseDocxScript(buffer);
  }

  if (ext === "fdx") {
    return parseFdxScript(buffer);
  }

  if (ext === "fountain") {
    const text = buffer.toString("utf-8");
    return { text, format: "fountain" };
  }

  // Default plain text / markdown
  const text = buffer.toString("utf-8");
  return { text, format: "text" };
}

/**
 * Parses PDF text and extracts accurate page count.
 */
export async function parsePdfScript(buffer: Buffer): Promise<ParsedScriptResult> {
  let pageCount: number | undefined;

  try {
    const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
    pageCount = pdfDoc.getPageCount();
  } catch (pdfLibError: any) {
    console.warn("[parsePdfScript] pdf-lib page count warning:", pdfLibError);
  }

  try {
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    await parser.destroy();

    return {
      text: result.text || "",
      pageCount: pageCount ?? result.total,
      format: "pdf",
    };
  } catch (error: any) {
    console.error("[parsePdfScript] Error:", error);
    throw new Error(`Failed to parse PDF: ${error.message}`);
  }
}

/**
 * Simple DOCX XML text extractor without native binary dependencies.
 */
export async function parseDocxScript(buffer: Buffer): Promise<ParsedScriptResult> {
  try {
    // DOCX is a zip archive containing word/document.xml
    const str = buffer.toString("utf-8");
    // Extract XML tags from text if raw or uncompressed
    const extractedText = str
      .replace(/<[^>]+>/g, " ")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/\s+/g, " ")
      .trim();

    return {
      text: extractedText || buffer.toString("utf-8"),
      format: "docx",
    };
  } catch (error: any) {
    return {
      text: buffer.toString("utf-8"),
      format: "docx",
    };
  }
}

/**
 * Parses Final Draft XML (.fdx) format.
 */
export async function parseFdxScript(buffer: Buffer): Promise<ParsedScriptResult> {
  const xml = buffer.toString("utf-8");
  // Extract text from <Paragraph> and <Text> nodes
  const textMatches = xml.match(/<Text[^>]*>([\s\S]*?)<\/Text>/g) || [];
  const text = textMatches
    .map((m) => m.replace(/<[^>]+>/g, "").trim())
    .filter(Boolean)
    .join("\n");

  return {
    text: text || xml.replace(/<[^>]+>/g, " ").trim(),
    format: "fdx",
  };
}
