/**
 * Creation/modification date: 01/06/2026
 * Path: src/services/pdf/layout/components/PhotoGrid.ts
 * Description: Photo grid for work order attachments (2 columns).
 */

import { PDFImage, rgb } from "pdf-lib";
import { PdfBuilder } from "../../builder/PdfBuilder";
import { MARGIN, CONTENT_W, COLORS } from "../../constants";
import { LABELS } from "../../labels";
import { embedImage } from "../../utils/image";
import type { PhotoRow } from "../../types";

export async function drawPhotoGrid(builder: PdfBuilder, photos: PhotoRow[]) {
  if (photos.length === 0) return;

  const imgWidth = (CONTENT_W - 12) / 2;

  for (let i = 0; i < photos.length; i += 2) {
    const row = photos.slice(i, i + 2);

    const embeds = await Promise.all(
      row.map(async (p) => {
        try {
          const img = await embedImage(builder.pdfDoc, p.url);
          const h = imgWidth * (img.height / img.width);
          return { img, h, photo: p };
        } catch {
          return null;
        }
      })
    );

    const valid = embeds.filter(Boolean) as { img: PDFImage; h: number; photo: PhotoRow }[];
    if (valid.length === 0) continue;

    const maxH = Math.max(...valid.map((v) => v.h));
    builder.ensureSpace(maxH + 28);

    for (let j = 0; j < valid.length; j++) {
      const { img, h, photo } = valid[j];
      const x = MARGIN + j * (imgWidth + 12);
      const yImg = builder.y - h;

      // Border box
      builder.page.drawRectangle({
        x: x - 2,
        y: yImg - 2,
        width: imgWidth + 4,
        height: h + 4,
        borderColor: COLORS.border,
        borderWidth: 0.5,
        color: rgb(0.98, 0.98, 0.98),
      });

      builder.page.drawImage(img, { x, y: yImg, width: imgWidth, height: h });

      const label = photo.isBefore ? LABELS[builder.lang].before : (photo.caption ?? "");
      if (label) {
        builder.drawText(label, x, yImg - 14, { size: 8, color: COLORS.textMuted });
      }
    }

    builder.y -= maxH + 24;
  }
}
