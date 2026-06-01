/**
 * Creation/modification date: 01/06/2026
 * Path: src/services/pdf/layout/components/WorkOrderSignature.ts
 * Description: Digital signature block for work order PDFs.
 */

import { PdfBuilder } from "../../builder/PdfBuilder";
import { MARGIN, COLORS } from "../../constants";
import { LABELS } from "../../labels";
import { embedImage } from "../../utils/image";

export async function drawWorkOrderSignature(
  builder: PdfBuilder,
  pngUrl: string | null,
  signedBy: string | null
) {
  if (pngUrl) {
    try {
      const img = await embedImage(builder.pdfDoc, pngUrl);
      const imgW = 180;
      const imgH = imgW * (img.height / img.width);

      builder.ensureSpace(imgH + 30);
      builder.drawText(`${LABELS[builder.lang].signedBy}: ${signedBy ?? ""}`, MARGIN, builder.y, {
        size: 10,
        color: COLORS.textMuted,
      });
      builder.addSpace(16);

      // Border box
      builder.page.drawRectangle({
        x: MARGIN - 2,
        y: builder.y - imgH - 2,
        width: imgW + 4,
        height: imgH + 4,
        borderColor: COLORS.border,
        borderWidth: 0.5,
        color: COLORS.white,
      });

      builder.page.drawImage(img, { x: MARGIN, y: builder.y - imgH, width: imgW, height: imgH });
      builder.y -= imgH + 10;
    } catch {
      // Ignore signature embedding errors
    }
  } else if (signedBy) {
    builder.ensureSpace(20);
    builder.drawText(`${LABELS[builder.lang].signedBy}: ${signedBy}`, MARGIN, builder.y, { size: 10 });
    builder.addSpace(16);
  }
}
