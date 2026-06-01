/**
 * Creation/modification date: 26/05/2026
 * Path: src/components/sat/SignatureCanvas.tsx
 * Description: Client canvas component for capturing digital signatures
 *              via mouse or touch input. Exports SVG and PNG for storage.
 */

"use client";

import { useRef, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { saveSignatureAction } from "@/actions/sat/work-orders/saveSignature";

interface Props {
  workOrderId: string;
  onSaved?: () => void;
}

export function SignatureCanvas({ workOrderId, onSaved }: Props) {
  const t = useTranslations("sat.signature");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawing, setHasDrawing] = useState(false);
  const [signedBy, setSignedBy] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCanvasPoint = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      let clientX: number;
      let clientY: number;

      if ("touches" in e) {
        clientX = e.touches[0]?.clientX ?? e.changedTouches[0]?.clientX ?? 0;
        clientY = e.touches[0]?.clientY ?? e.changedTouches[0]?.clientY ?? 0;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      };
    },
    []
  );

  const startDrawing = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const { x, y } = getCanvasPoint(e);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.strokeStyle = "#000000";

      setIsDrawing(true);
      setHasDrawing(true);
      setError(null);
    },
    [getCanvasPoint]
  );

  const draw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      if (!isDrawing) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const { x, y } = getCanvasPoint(e);
      ctx.lineTo(x, y);
      ctx.stroke();
    },
    [isDrawing, getCanvasPoint]
  );

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawing(false);
    setError(null);
  }, []);

  const canvasToSvg = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return "";

    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    // Read pixel data to generate SVG paths
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;

    // Find drawn pixels and group them into paths
    let svgPaths = "";
    const visited = new Set<number>();

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const alpha = data[idx + 3];

        if (alpha > 128 && !visited.has(idx)) {
          // Start of a stroke - trace it
          const points: string[] = [];
          let cx = x;
          let cy = y;

          while (cx < width && cy < height) {
            const cidx = (cy * width + cx) * 4;
            if (data[cidx + 3] <= 128 || visited.has(cidx)) break;
            visited.add(cidx);
            points.push(`${cx},${cy}`);

            // Look for next pixel in stroke
            let found = false;
            for (let dy = -2; dy <= 2 && !found; dy++) {
              for (let dx = -2; dx <= 2 && !found; dx++) {
                if (dx === 0 && dy === 0) continue;
                const nx = cx + dx;
                const ny = cy + dy;
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                  const nidx = (ny * width + nx) * 4;
                  if (data[nidx + 3] > 128 && !visited.has(nidx)) {
                    cx = nx;
                    cy = ny;
                    found = true;
                    break;
                  }
                }
              }
            }
            if (!found) break;
          }

          if (points.length > 1) {
            const d = points.map((p, i) => (i === 0 ? `M ${p}` : `L ${p}`)).join(" ");
            svgPaths += `<path d="${d}" stroke="#000000" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
          }
        }
      }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${svgPaths}</svg>`;
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!hasDrawing || !signedBy.trim()) {
      setError(hasDrawing ? t("signerNamePlaceholder") : t("drawHint"));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Generate SVG
      const svg = canvasToSvg();

      // Generate PNG blob
      const pngBlob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob ?? new Blob());
        }, "image/png");
      });

      const formData = new FormData();
      formData.append("workOrderId", workOrderId);
      formData.append("signedBy", signedBy.trim());
      formData.append("signatureSvg", svg);
      formData.append("signaturePng", pngBlob, "signature.png");

      const result = await saveSignatureAction(formData);

      if (!result.success) {
        setError(result.error ?? "Failed to save signature");
        return;
      }

      onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsSubmitting(false);
    }
  }, [hasDrawing, signedBy, workOrderId, canvasToSvg, onSaved]);

  return (
    <div className="space-y-4">
      {/* Name input */}
      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--text)]">
          {t("signerNameLabel")}
        </label>
        <input
          type="text"
          value={signedBy}
          onChange={(e) => setSignedBy(e.target.value)}
          placeholder={t("signerNamePlaceholder")}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--module-sat)]"
        />
      </div>

      {/* Canvas */}
      <div className="rounded-lg border border-[var(--border)] bg-white">
        <canvas
          ref={canvasRef}
          width={600}
          height={200}
          className="w-full cursor-crosshair touch-none"
          style={{ aspectRatio: "3 / 1" }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={clearCanvas}
          disabled={isSubmitting}
          className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--surface)] disabled:opacity-50"
        >
          {t("clearButton")}
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || !hasDrawing}
          className="rounded-lg bg-[var(--module-sat)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isSubmitting ? t("saving") : t("confirmButton")}
        </button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
