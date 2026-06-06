/**
 * Creation/modification date: 01/06/2026
 * Path: src/services/pdf/utils/image.ts
 * Description: Image embedding helper for pdf-lib.
 */

import { PDFDocument } from "pdf-lib";

export async function embedImage(pdfDoc: PDFDocument, imageUrl: string) {
  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error(`Failed to fetch image: ${imageUrl}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("png")) return pdfDoc.embedPng(buf);
  if (ct.includes("jpg") || ct.includes("jpeg")) return pdfDoc.embedJpg(buf);
  throw new Error(`Unsupported image type: ${ct}`);
}
