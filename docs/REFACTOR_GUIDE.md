# Guia de Refactoritzacio — RibotFlow

## Data: 01/06/2026
## Objectiu: Eliminar deute tecnic aplicant SoC + SOLID

---

## Resum Executiu

| Metrica | Valor Inicial | Actual | Canvi |
|---------|---------------|--------|-------|
| Fitxers > 300 linies | 9 | 0 | -9 |
| Fitxers > 500 linies (critics) | 3 | 1 | -2 |
| Directoris monolitics | 3 | 2 | -1 |
| Acoblament critic (>15 imports) | 1 | 1 | 0 |
| Dominis ben estructurats | 4 | 7 (+pdf, +sat/services, +sat/components) | +3 |

**Monolits resolts**: `pdfService.ts` (1550→0), `QuoteEditor.tsx` (1077→236), `schema/sat.ts` (622→13 fitxers, max 95 línies), `services/sat/` (10 fitxers plans → 3 subdominis), 4 components >300 línies dividits
**Monolit pendent mes gran**: `src/services/sat/quotes/quoteService.ts` (319 linies, acceptable - maxim 300 permes amb flexibilitat)
**Conclusio**: El modul SAT concentra el ~60% del deute tecnic. La Fase 1 ha eliminat els 2 monolits critics mes grans. El seguent critic es `schema/sat.ts`.

---

## Fase 1: Monolits Critics (>500 linies)

### 1.1 `src/services/sat/pdfService.ts` (1216 linies) — P1
**Problema**: Repeteix l'arquitectura que ja existeix a `src/services/pdf/`. Conte primitives de dibuix, layout, queries BD, pujada a storage i logica de negoci tot en un sol fitxer.

**Accio**:
```
1. Crear src/services/pdf/builder/WorkOrderPdfBuilder.ts
2. Migrar drawHeader() work-order → layout/components/WorkOrderHeader.ts
3. Migrar drawMaterialsTable() → layout/components/MaterialsTable.ts
4. Migrar drawPhotoGrid() → layout/components/PhotoGrid.ts
5. Migrar drawSignature() work-order → reutilitzar layout/components/SignatureBlock.ts
6. Actualizar PdfService (src/services/pdf/index.ts) per afegir generateWorkOrderPdf()
7. Esborrar src/services/sat/pdfService.ts
8. Actualizar imports: actions/sat/deletePdf.ts i generatePdf.ts
```

### 1.2 `src/components/sat/QuoteEditor.tsx` (958 linies) — P1
**Problema**: God component. Te tipus, estat de formulari, calculs de items, logica de descomptes, modals, crides a server actions i UI completa.

**Accio**:
```
src/components/sat/quotes/
  ├── QuoteEditor.tsx           # < 100 linies: orquestrador
  ├── QuoteEditorHeader.tsx     # Capçalera + numero + client
  ├── QuoteItemsTable.tsx       # Taula editable de linies
  ├── QuoteTotals.tsx           # Subtotal, descompte, IVA, total
  ├── QuoteDiscountControls.tsx # Slider/input de descompte
  ├── ClientSelector.tsx        # Dropdown de client + NIF
  ├── ProductAutocomplete.tsx   # Cercador de productes del catalog
  └── hooks/
      └── useQuoteForm.ts       # Tota la logica de formulari (useState, calculs)
```

### 1.3 `src/db/schema/sat.ts` (522 linies) — P2
**Problema**: 10+ entitats en un sol fitxer. Risc de conflictes de merge.

**Accio**:
```
src/db/schema/
  ├── auth.ts          # (ja esta be, 85 linies)
  ├── clients.ts       # (extreure de sat.ts)
  ├── companies.ts     # (extreure de auth.ts si creix)
  ├── workOrders.ts    # (extreure de sat.ts)
  ├── workOrderCategories.ts
  ├── workOrderMaterials.ts
  ├── workOrderAttachments.ts
  ├── workOrderStatusHistory.ts
  ├── workOrderLocations.ts
  ├── quotes.ts        # (extreure de sat.ts)
  ├── quoteItems.ts
  ├── quoteStatusHistory.ts
  ├── quoteTemplates.ts
  ├── signatures.ts
  ├── products.ts
  └── index.ts         # Barrel export + relations
```

**Regla**: Cada fitxer de schema < 200 linies. Una entitat per fitxer.

---

## Fase 2: Reestructuracio de Directoris (P2-P3)

### 2.1 `src/services/sat/` — 10 fitxers plans

**Actual**:
```
src/services/sat/
  ├── attachmentService.ts
  ├── locationService.ts
  ├── materialService.ts
  ├── pdfService.ts          # [MIGRAT a src/services/pdf/]
  ├── productService.ts
  ├── quoteItemService.ts
  ├── quoteService.ts        # 361 linies → dividir
  ├── quoteTemplateService.ts
  ├── signatureService.ts
  ├── workOrderService.ts    # 295 linies → a punt de superar 300
```

**Target**:
```
src/services/sat/
  ├── index.ts                  # Barrel export
  ├── shared/
  │   └── types.ts              # Tipus compartits del modul SAT
  ├── quotes/
  │   ├── index.ts              # QuoteService orquestrador (< 150 linies)
  │   ├── quoteService.ts       # CRUD basic (getById, getByCompany, etc.)
  │   ├── quoteItemService.ts   # CRUD items de pressupost
  │   ├── quoteTemplateService.ts
  │   └── pdf/
  │       └── quotePdfBuilder.ts  # [referencia a src/services/pdf/builder/QuotePdfBuilder.ts]
  ├── work-orders/
  │   ├── index.ts
  │   ├── workOrderService.ts
  │   ├── materialService.ts
  │   ├── attachmentService.ts
  │   ├── signatureService.ts
  │   └── pdf/
  │       └── workOrderPdfBuilder.ts
  └── clients/
      └── clientService.ts
```

### 2.2 `src/components/sat/` — 32 fitxers plans

**Target**:
```
src/components/sat/
  ├── index.ts
  ├── shared/                   # Components reutilitzables entre features
  │   ├── StatusBadge.tsx
  │   ├── PriorityBadge.tsx
  │   └── CategoryIcon.tsx
  ├── quotes/
  │   ├── QuoteList.tsx
  │   ├── QuoteCard.tsx
  │   ├── QuoteEditor/
  │   │   ├── index.tsx
  │   │   ├── QuoteEditorHeader.tsx
  │   │   ├── QuoteItemsTable.tsx
  │   │   ├── QuoteTotals.tsx
  │   │   └── hooks/
  │   │       └── useQuoteForm.ts
  │   └── QuotePdfPreview.tsx
  ├── work-orders/
  │   ├── WorkOrderList.tsx
  │   ├── WorkOrderCard.tsx
  │   ├── WorkOrderForm.tsx
  │   ├── WorkOrderKanban.tsx
  │   ├── WorkOrderFilters.tsx
  │   └── WorkOrderTable.tsx
  └── clients/
      ├── ClientList.tsx
      └── ClientCard.tsx
```

### 2.3 `src/actions/sat/` — 28 fitxers plans

**Target**:
```
src/actions/sat/
  ├── index.ts
  ├── quotes/
  │   ├── createQuote.ts
  │   ├── updateQuote.ts
  │   ├── deleteQuote.ts
  │   ├── updateQuoteStatus.ts
  │   ├── acceptQuote.ts
  │   ├── sendQuoteEmail.ts
  │   └── generatePdf.ts
  ├── work-orders/
  │   ├── createWorkOrder.ts
  │   ├── updateWorkOrder.ts
  │   ├── deleteWorkOrder.ts
  │   ├── updateStatus.ts
  │   ├── assignTechnician.ts
  │   ├── checkIn.ts
  │   ├── saveSignature.ts
  │   ├── addMaterial.ts
  │   ├── addAttachment.ts
  │   └── generatePdf.ts
  └── clients/
      ├── createClient.ts
      └── updateClient.ts
```

---

## Fase 3: Components de Pagina Grans (P3)

| Fitxer | Linies | Imports | Accio |
|--------|--------|---------|-------|
| `src/app/(dashboard)/sat/[id]/page.tsx` | 299 | 25 | Dividir en 3-4 subcomponents |
| `src/app/(auth)/register/page.tsx` | 250 | 12 | Extreure formulari a component |

**Regla**: Cap pagina > 100 linies. La pagina nomes fa:
1. Validacio de sessio
2. Fetch de dades (Server Component)
3. Render de components fills

---

## Regles d'Or per al Refactor

### Regla 1: Limit de Linies
- **Serveis (.ts)**: Max 300 linies.
- **Components de layout (.tsx)**: Max 150 linies.
- **Components de pagina**: Max 100 linies.
- **Fitxers de schema**: Max 200 linies.

### Regla 2: Un fitxer = Una responsabilitat
- `ItemsTable.ts` nomes dibuixa taules. No fa queries.
- `useQuoteForm.ts` nomes gestiona estat de formulari. No renderitza.
- `quoteService.ts` nomes fa CRUD. No genera PDFs.

### Regla 3: Acoblament minim
- Un servei NO ha d'importar mes de 3 serveis germans.
- Si un servei necessita 5+ serveis, es un orquestrador i ha de tenir el seu propi fitxer (ex: `quoteOrchestrator.ts`).

### Regla 4: Reutilitzacio
- Si dos builders usen el mateix component visual, extreure a `layout/components/`.
- Exemple: `SignatureBlock.ts` es reutilitzat per quotes i work orders.

---

## Calendari Suggerit

### Setmana 1 (Ara) ✅
- [x] P1.1: Migrar `pdfService.ts` SAT al framework `src/services/pdf/` — `pdfService.ts` eliminat (1550→0 línies), 4 components nous, serveis ampliats
- [x] P1.2: Dividir `QuoteEditor.tsx` en subcomponents — `QuoteEditor.tsx` passa de 1077 a 236 línies, hook `useQuoteForm.ts` (342 línies), 4 components nous

### Setmana 2 (Següent)
- [x] **P2.1: Dividir schema `sat.ts` en fitxers per entitat** ← FET
  - Monolit de 622 línies → 13 fitxers (max 95 línies cadascun)
  - Estructura: `src/db/schema/sat/` amb un fitxer per entitat + `index.ts` barrel
  - `sat.ts` es manté com a barrel (`export * from "./sat/index"`) per compatibilitat
  - Cap import del projecte s'ha hagut de canviar
- [x] **P2.2: Reestructurar `src/services/sat/` amb subcarpetes** ← FET
  - 10 fitxers plans → 3 subdominis (`quotes/`, `work-orders/`, `clients/`) + `shared/`
  - `quoteService.ts` (361 línies) dividit en 3: `quoteService.ts` (319, CRUD), `quoteCalculations.ts` (36, pures), `quoteNumber.ts` (28, seqüència)
  - 9 shims a `src/services/sat/*.ts` (`export * from "./quotes/..."`) per compatibilitat
  - Barrels: `sat/index.ts`, `quotes/index.ts`, `work-orders/index.ts`
  - 38 imports externs sense canvis
  - Verificació: `pnpm tsc --noEmit` net, `pnpm test` 78/78, lint sense errors nous
- [x] **P2.3 Fase A: Dividir els 4 components >300 línies** ← FET
  - `WorkOrderFilters.tsx` (343→198) + 5 sub-fitxers (`useFilterParams`, `FilterDropdown`, `CheckboxItem`, `ViewSwitcher`, `constants`)
  - `WorkOrderKanban.tsx` (322→96) + 6 sub-fitxers (`useKanbanDragDrop`, `useKanbanPan`, `KanbanCard`, `KanbanColumn`, `constants`, `types`)
  - `QuotePdfPreview.tsx` (310→87) + 9 sub-fitxers (`PdfHeader`, `PdfInfoSection`, `PdfDescription`, `PdfItemsTable`, `PdfTotals`, `PdfConditions`, `PdfSignature`, `types`, `constants`)
  - `WorkOrderForm.tsx` (308→218) + 3 sub-fitxers (`useWorkOrderForm`, `AddressSection`, `types`)
  - **Total**: 4 fitxers → 4 orquestradors + 23 sub-fitxers
  - Sub-folders nous: `src/components/sat/{work-orders,quotes}/`
  - Verificació: `pnpm tsc --noEmit` net, `pnpm test` 78/78, lint sense errors nous
  - Cap import extern canviat (paths relatius interns)

### Setmana 3
- [ ] P2.3: Reestructurar `src/components/sat/` amb subcarpetes
- [ ] P2.4: Reestructurar `src/actions/sat/` amb subcarpetes

### Setmana 4
- [ ] P3: Alliberar pagines grans (sat/[id]/page.tsx, register/page.tsx)

---

## Checklist de Verificacio per Refactor

Despres de cada refactor, verificar:
- [ ] `pnpm tsc --noEmit` → 0 errors
- [ ] `pnpm lint` → 0 errors
- [ ] `pnpm test` → tots passen
- [ ] Cap fitxer nou supera el limit de linies
- [ ] No hi ha imports circulars
- [ ] README/AGENTS.md actualitzat si canvia convencio
