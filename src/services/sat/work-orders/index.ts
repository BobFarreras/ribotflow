/**
 * Creation/modification date: 01/06/2026
 * Path: src/services/sat/work-orders/index.ts
 * Description: Barrel export for the work-orders sub-domain.
 */

export { workOrderService } from "./workOrderService";
export { materialService } from "./materialService";
export { attachmentService } from "./attachmentService";
export { signatureService, SignatureService } from "./signatureService";
export type { SignatureEntityType, SaveSignatureInput } from "./signatureService";
export { locationService, calculateDistance } from "./locationService";
export { productService } from "./productService";
