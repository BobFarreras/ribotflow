/**
 * Creation/modification date: 01/06/2026
 * Path: src/db/schema/sat/index.ts
 * Description: Barrel export for all SAT schema entities.
 *              Each entity lives in its own file (<200 lines).
 */

/* ---------- Entities ---------- */
export { clients, clientsRelations } from "./clients";
export { workOrderCategories, workOrderCategoriesRelations } from "./workOrderCategories";
export { products, productsRelations } from "./products";
export { workOrders, workOrdersRelations } from "./workOrders";
export { workOrderStatusHistory, workOrderStatusHistoryRelations } from "./workOrderStatusHistory";
export { workOrderMaterials, workOrderMaterialsRelations } from "./workOrderMaterials";
export { workOrderAttachments, workOrderAttachmentsRelations } from "./workOrderAttachments";
export { signatures } from "./signatures";
export { workOrderLocations, workOrderLocationsRelations } from "./workOrderLocations";
export { quotes, quotesRelations } from "./quotes";
export { quoteItems, quoteItemsRelations } from "./quoteItems";
export { quoteTemplates, quoteTemplatesRelations } from "./quoteTemplates";
export { quoteStatusHistory, quoteStatusHistoryRelations } from "./quoteStatusHistory";
export { smtpConfigs, type SmtpConfigRow, type NewSmtpConfigRow } from "./smtpConfigs";
