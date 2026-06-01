# Guia de Refactoritzacio — RibotFlow

## Data: 01/06/2026
## Objectiu: Eliminar deute tecnic aplicant SoC + SOLID

---

## Resum Executiu

| Metrica | Valor |
|---------|-------|
| Fitxers > 300 linies | 9 |
| Fitxers > 500 linies (critics) | 3 |
| Directoris monolitics | 3 (services/sat, components/sat, actions/sat) |
| Acoblament critic (>15 imports) | 1 (sat/[id]/page.tsx) |
| Dominis ben estructurats | 4 (auth, routing, storage, pdf) |

**Conclusio**: El modul SAT concentra el ~60% del deute tecnic. Es el prioritari.

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

### Setmana 1 (Ara)
- [ ] P1.1: Migrar `pdfService.ts` SAT al framework `src/services/pdf/`
- [ ] P1.2: Dividir `QuoteEditor.tsx` en subcomponents

### Setmana 2
- [ ] P2.1: Dividir schema `sat.ts` en fitxers per entitat
- [ ] P2.2: Reestructurar `src/services/sat/` amb subcarpetes

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
