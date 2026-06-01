/**
 * Creation/modification date: 01/06/2026
 * Path: src/services/pdf/layout/components/SignatureBlock.ts
 * Description: Signature section with empty line or embedded PNG.
 */

import { PdfBuilder } from "../../builder/PdfBuilder";
import { MARGIN, CONTENT_W, COLORS } from "../../constants";
import { LABELS } from "../../labels";
import { embedImage } from "../../utils/image";

export async function drawSignatureBlock(
  builder: PdfBuilder,
  opts: { signaturePngUrl?: string | null; signedBy?: string | null; signedAt?: Date | null }
) {
  builder.ensureSpace(140);
  const t = LABELS[builder.lang];
  const topY = builder.y;
  const halfW = CONTENT_W / 2 - 10;

  let leftY = topY;
  builder.drawText(t.signatureTitle, MARGIN, leftY, { bold: true, size: 10, color: COLORS.slate900 });
  leftY -= 14;
  builder.drawText(t.signatureCaption, MARGIN, leftY, { size: 8, color: COLORS.slate500 });
  leftY -= 16;

  if (opts.signaturePngUrl) {
    try {
      const img = await embedImage(builder.pdfDoc, opts.signaturePngUrl);
      const imgW = 200;
      const imgH = imgW * (img.height / img.width);
      builder.page.drawRectangle({
        x: MARGIN - 2, y: leftY - imgH - 2, width: imgW + 4, height: imgH + 4,
        borderColor: COLORS.slate400, borderWidth: 0.5, color: COLORS.white,
      });
      builder.page.drawImage(img, { x: MARGIN, y: leftY - imgH, width: imgW, height: imgH });
      leftY -= imgH + 6;
      if (opts.signedBy) {
        builder.drawText(`${t.signedBy}: ${opts.signedBy}`, MARGIN, leftY, { size: 8, color: COLORS.slate600 });
        leftY -= 11;
      }
      if (opts.signedAt) {
        builder.drawText(
          `${t.signedOn}: ${opts.signedAt.toLocaleDateString("ca-ES")}`,
          MARGIN, leftY, { size: 8, color: COLORS.slate600 }
        );
        leftY -= 11;
      }
    } catch {
      leftY -= 30;
      builder.drawLine(leftY, COLORS.slate400, 0.5);
      leftY -= 8;
    }
  } else {
    leftY -= 30;
    builder.drawLine(leftY, COLORS.slate400, 0.5);
    leftY -= 8;
    builder.drawText(t.signatureLine, MARGIN, leftY, { size: 8, color: COLORS.slate500 });
    leftY -= 16;
  }

  builder.drawText(t.signatureThanks, MARGIN + halfW + 20, topY - 4, { size: 8, color: COLORS.slate400 });

  builder.y = Math.min(leftY, topY - 60) - 20;
}
