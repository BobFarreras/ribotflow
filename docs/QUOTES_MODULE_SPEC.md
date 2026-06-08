# Mòdul de Pressupostos (Quotes) — Especificació

> **Data creació:** 28/05/2026
> **Estat:** Draft (A revisar)
> **Depèn de:** Mòdul SAT (Fase 2 completada)

---

## 1. Visió General

El mòdul de Pressupostos permet crear pressupostos professionals vinculats a una OT, enviar-los al client, i gestionar-ne el cicle de vida complet. Un pressupost acceptat es pot convertir en factura al futur mòdul de Finances.

### Flux Principal

```
OT creada
   ↓
Tècnic fa valoració (check-in + diagnòstic)
   ↓
Oficina crea pressupost (o des de plantilla)
   ↓
Client rep pressupost per email
   ↓
Client accepta / rebuja / demana canvis
   ↓
Si acceptat → Factura (Futur: Finances)
   ↓
Execució de la feina (OT actualitzada)
```

---

## 2. Ubicació al Navegador

### Dins del SAT

| URL | Descripció |
|-----|------------|
| `/sat/quotes` | Llistat de tots els pressupostos (vista de l'oficina) |
| `/sat/[id]` → secció "Pressupostos" | Pressupostos associats a una OT específica |
| `/sat/quotes/[id]` | Detall d'un pressupost concret |
| `/sat/quotes/new?otId={id}` | Crear pressupost nou vinculat a una OT |
| `/sat/quotes/templates` | Gestió de plantilles de pressupostos |

### Dins del Sidebar

```
SAT
  ├── Ordres de Treball
  ├── Clients
  ├── Categories
  ├── Pressupostos          ← Nou
  │     ├── Llistat
  │     └── Plantilles
  ├── Mapa
  └── Rutes
```

---

## 3. Schema de Base de Dades

### 3.1 Taules Principals

```sql
-- PRESSUPOTOS
quotes
├── id                  UUID (PK)
├── company_id          UUID (FK → companies) NOT NULL
├── work_order_id       UUID (FK → work_orders) NOT NULL
├── client_id           UUID (FK → clients) NOT NULL
├── number              TEXT NOT NULL  -- PRES-{YYYY}-{SEQ}
├── title               TEXT NOT NULL
├── description         TEXT
├── status              TEXT NOT NULL  -- draft, sent, accepted, rejected, expired, cancelled
├── version             INTEGER DEFAULT 1
├── valid_until         DATE           -- Data de caducitat
├── subtotal            NUMERIC(10,2)  -- Base imposable
├── tax_rate            NUMERIC(5,2)   -- % IVA (ex: 21.00)
├── tax_amount          NUMERIC(10,2)  -- Quantitat IVA
├── total               NUMERIC(10,2)  -- Total amb IVA
├── currency            TEXT DEFAULT 'EUR'
├── notes               TEXT           -- Notes internes
├── client_notes        TEXT           -- Notes visibles pel client
├── template_id         UUID (FK → quote_templates)  -- Si ve d'una plantilla
├── accepted_at         TIMESTAMP      -- Quan el client va acceptar
├── rejected_at         TIMESTAMP      -- Quan el client va rebutjar
├── sent_at             TIMESTAMP      -- Quan es va enviar
├── created_by          UUID (FK → users) NOT NULL
├── created_at          TIMESTAMP DEFAULT NOW() NOT NULL
├── updated_at          TIMESTAMP DEFAULT NOW() NOT NULL
├── created_at          TIMESTAMP DEFAULT NOW() NOT NULL
├── updated_at          TIMESTAMP DEFAULT NOW() NOT NULL

-- UNIQUE (company_id, number)

-- Índexos:
-- idx_quotes_company_status (company_id, status)
-- idx_quotes_company_created (company_id, created_at DESC)
-- idx_quotes_work_order (work_order_id)
-- idx_quotes_client (client_id)
-- idx_quotes_number (company_id, number)
```

```sql
-- LÍNIES DE PRESSUPOST
quote_items
├── id                  UUID (PK)
├── quote_id            UUID (FK → quotes) NOT NULL
├── product_id          UUID (FK → products)  -- Si ve del catàleg
├── description         TEXT NOT NULL         -- Descripció de la línia
├── quantity            NUMERIC(10,2) NOT NULL
├── unit                TEXT DEFAULT 'unit'   -- unit, kg, hour, meter, etc.
├── unit_price          NUMERIC(10,2) NOT NULL
├── unit_cost           NUMERIC(10,2)        -- Cost intern (ocult al client)
├── discount_percent    NUMERIC(5,2) DEFAULT 0
├── discount_amount     NUMERIC(10,2) DEFAULT 0
├── subtotal            NUMERIC(10,2) NOT NULL -- quantity × unit_price - discount
├── tax_rate            NUMERIC(5,2)         -- Pot variar per línia
├── tax_amount          NUMERIC(10,2)
├── total               NUMERIC(10,2)        -- subtotal + tax
├── sort_order          INTEGER DEFAULT 0
├── category            TEXT                 -- 'material', 'labor', 'travel', 'other'
├── created_at          TIMESTAMP DEFAULT NOW() NOT NULL
├── updated_at          TIMESTAMP DEFAULT NOW() NOT NULL

-- Índexos:
-- idx_quote_items_quote (quote_id)
-- idx_quote_items_product (product_id)
```

```sql
-- PLANTILLES DE PRESSUPOST
quote_templates
├── id                  UUID (PK)
├── company_id          UUID (FK → companies) NOT NULL
├── name                TEXT NOT NULL
├── description         TEXT
├── category_id         UUID (FK → work_order_categories)  -- Tipus de treball
├── default_items       JSONB  -- Línies pre-definides (array d'objectes)
├── default_notes       TEXT   -- Notes pre-definides
├── default_tax_rate    NUMERIC(5,2) DEFAULT 21.00
├── is_active           BOOLEAN DEFAULT true
├── usage_count         INTEGER DEFAULT 0  -- Quant cops s'ha fet servir
├── created_by          UUID (FK → users) NOT NULL
├── created_at          TIMESTAMP DEFAULT NOW() NOT NULL
├── updated_at          TIMESTAMP DEFAULT NOW() NOT NULL

-- Índexos:
-- idx_templates_company_active (company_id, is_active)
-- idx_templates_category (category_id)
```

### 3.2 Relacions Drizzle ORM

```typescript
export const quotes = pgTable("quotes", {
  // ... campsn
}, (table) => ({
  companyStatusIdx: index("idx_quotes_company_status").on(table.companyId, table.status),
  companyCreatedIdx: index("idx_quotes_company_created").on(table.companyId, table.createdAt),
  workOrderIdx: index("idx_quotes_work_order").on(table.workOrderId),
  clientIdx: index("idx_quotes_client").on(table.clientId),
  numberIdx: index("idx_quotes_number").on(table.companyId, table.number),
}));

export const quoteItems = pgTable("quote_items", {
  // ... camps
}, (table) => ({
  quoteIdx: index("idx_quote_items_quote").on(table.quoteId),
  productIdx: index("idx_quote_items_product").on(table.productId),
}));

export const quoteTemplates = pgTable("quote_templates", {
  // ... camps
}, (table) => ({
  companyActiveIdx: index("idx_templates_company_active").on(table.companyId, table.isActive),
  categoryIdx: index("idx_templates_category").on(table.categoryId),
}));
```

### 3.3 Estats del Pressupost

```
┌─────────┐    ┌────────┐    ┌───────────┐
│  draft  │───▶│  sent  │───▶│ accepted  │
└─────────┘    └────────┘    └───────────┘
                   │              │
                   │              ▼
                   │         ┌─────────┐
                   │         │ invoiced│ (Futur: Finances)
                   │         └─────────┘
                   ▼
              ┌──────────┐
              │ rejected │
              └──────────┘
                   │
                   ▼
              ┌─────────┐
              │ expired │ (automàtic si valid_until < avui)
              └─────────┘
                   │
                   ▼
              ┌───────────┐
              │ cancelled │
              └───────────┘
```

**Transicions permeses:**
- `draft` → `sent`, `cancelled`
- `sent` → `accepted`, `rejected`, `cancelled`
- `accepted` → (cap, ja és definitiu)
- `rejected` → `draft` (revisar i reenviar)
- `expired` → `draft` (revisar i reenviar)
- `cancelled` → `draft` (reactivar)

---

## 4. Funcionalitats

### 4.1 Funcionalitats Core (MVP)

#### Crear Pressupost
- **Des de l'OT**: Botó "Crear pressupost" al detall de l'OT (`/sat/[id]`)
- **Des de plantilla**: Seleccionar plantilla → s'omplen les línies automàticament
- **En blanc**: Crear des de zero

#### Línies de Pressupost
- **Afegir línia**: Descripció, quantitat, preu unitari, descompte
- **Seleccionar del catàleg**: Buscar producte → omple descripció i preu
- **Categories de línia**: Material, Mà d'obra, Desplaçament, Altres
- **Reordenar**: Drag & drop per canviar ordre de les línies
- **Descomptes**: Per línia (percentatge o quantitat fixa)

#### Càlculs Automàtics
```
Subtotal = Σ (quantity × unit_price - discount)
Tax = subtotal × tax_rate / 100
Total = subtotal + tax
```

#### Vista Previa del Pressupost
- Mockup de com es veurà el PDF
- Edició inline de notes i descripcions

#### PDF Generation
- Reutilitzar `pdfService.ts` amb nova plantilla de pressupost
- Header amb logo de l'empresa
- Taules de línies amb descomptes
- Notes i condicions
- Signatura digital (reutilitzar `signatures` genèrica)

#### Enviament per Email
- Modal d'enviament amb:
  - Destinatari (pre-omplert amb email del client)
  - Assumpte (pre-omplert amb número de pressupost)
  - Cos del missatge (editable, amb template per defecte)
  - Adjunt PDF del pressupost
- Botó "Enviar pressupost" que:
  1. Genera el PDF
  2. Desa la firma (opcional)
  3. Envia l'email amb adjunt
  4. Actualitza estat a `sent`
  5. Registra a l'historial

#### Estat del Pressupost
- Badge de color amb estat
- Historial de canvis (reutilitzar taula `work_order_status_history` amb `entity_type = 'quote'`)

---

### 4.2 Funcionalitats Avançades (Futur)

#### 🎨 Plantilles de Pressupost
**Concepte:** Crear reutilitzacions de pressupostos freqüents.

**UI:**
```
┌─────────────────────────────────────────┐
│ Plantilles de Pressupost                │
├─────────────────────────────────────────┤
│ + Nova Plantilla                        │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 🔧 Reparació Elèctrica Bàsica     │ │
│ │ 3 línies · IVA 21% · Ús: 15 cops  │ │
│ │ [Editar] [Duplicar] [Eliminar]     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 🏠 Instal·lació Domòtica           │ │
│ │ 5 línies · IVA 21% · Ús: 8 cops   │ │
│ │ [Editar] [Duplicar] [Eliminar]     │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**Editor de Plantilla:**
- Nom de la plantilla
- Categoria associada (opcional)
- Línies pre-definides (mateix editor que pressupostos)
- Notes pre-definides
- IVA per defecte

**Creació de Pressupost des de Plantilla:**
1.usuari selecciona plantilla
2. Es copien les línies al nou pressupost
3. L'usuari pot modificar línies, preus, quantitats
4. Es desa com a pressupost normal

#### 📧 Enviament Directe
- Botó "Enviar per email" des del detall del pressupost
- Modal amb:
  - Assumpte auto-generat: "Pressupost PRES-2026-0001"
  - Cos del missatge editable (amb template HTML)
  - Botó "Enviar" que:
    1. Genera PDF
    2. Envia email amb adjunt
    3. Actualitza estat a `sent`
    4. Registra timestamp `sent_at`

#### 📱 Vista Client (Futur)
- Enllaç públic sense login: `https://ribotflow.com/quotes/{token}`
- El client pot:
  - Veure el pressupost
  - Acceptar / Rebutjar
  - Deixar comentaris
  - Descarregar PDF

#### 🔄 Conversió Automàtica
- Botó "Convertir en factura" (quan Finances estigui implementat)
- Copia les dades del pressupost a la factura
- Marca el pressupost com a `invoiced`

#### 📊 Estadístiques
- Pressupostos per tècnic
- Taxa d'acceptació / rebuig
- Import total de pressupostos acceptats
- Pressupostos pendents de respostar

---

## 5. Server Actions

### 5.1 CRUD Bàsic

```typescript
// src/actions/sat/quotes/

createQuoteAction(input: CreateQuoteInput)
// → Crea pressupost nou amb línies

updateQuoteAction(quoteId: string, input: UpdateQuoteInput)
// → Actualitza pressupost (només si status = draft)

deleteQuoteAction(quoteId: string)
// → Elimina pressupost (només si status = draft)

getQuoteById(quoteId: string)
// → Obté pressupost amb línies i relacions

getQuotesByCompany(companyId: string, filters?)
// → Llistat de pressupostos amb filtres
```

### 5.2 Gestió de Línies

```typescript
addQuoteItemAction(quoteId: string, input: AddQuoteItemInput)
// → Afegeix línia al pressupost

updateQuoteItemAction(itemId: string, input: UpdateQuoteItemInput)
// → Actualitza línia existent

removeQuoteItemAction(itemId: string)
// → Elimina línia del pressupost

reorderQuoteItemsAction(quoteId: string, itemIds: string[])
// → Reordena les línies
```

### 5.3 Estat i Flux

```typescript
updateQuoteStatusAction(quoteId: string, newStatus: QuoteStatus, reason?: string)
// → Canvia estat amb validació de transicions

markQuoteAsSentAction(quoteId: string)
// → Marca com enviat + timestamp

markQuoteAsAcceptedAction(quoteId: string)
// → Marca com acceptat + timestamp

markQuoteAsRejectedAction(quoteId: string, reason?: string)
// → Marca com rebutjat + timestamp
```

### 5.4 Plantilles

```typescript
createTemplateAction(input: CreateTemplateInput)
// → Crea plantilla de pressupost

updateTemplateAction(templateId: string, input: UpdateTemplateInput)
// → Actualitza plantilla

deleteTemplateAction(templateId: string)
// → Elimina plantilla

getTemplatesByCompany(companyId: string)
// → Llistat de plantilles actives
```

### 5.5 PDF i Email

```typescript
generateQuotePdfAction(quoteId: string, language?: 'ca' | 'es' | 'en')
// → Genera PDF del pressupost i retorna URL

sendQuoteByEmailAction(quoteId: string, input: SendQuoteEmailInput)
// → Genera PDF + envia email + marca com sent
```

---

## 6. UI / Components

### 6.1 Components Nous

| Component | Responsabilitat |
|-----------|----------------|
| `QuoteList.tsx` | Llistat de pressupostos amb filtres i paginació |
| `QuoteCard.tsx` | Card de pressupost per a vista grid |
| `QuoteTable.tsx` | Vista taula de pressupostos |
| `QuoteStatusBadge.tsx` | Badge d'estat del pressupost |
| `QuoteDetail.tsx` | Detall complet del pressupost |
| `QuoteForm.tsx` | Formulari de creació/edició |
| `QuoteItemEditor.tsx` | Editor de línies (taula editable) |
| `QuoteItemRow.tsx` | Fila individual de línia |
| `QuotePdfPreview.tsx` | Vista prèvia del PDF |
| `QuoteSendModal.tsx` | Modal d'enviament per email |
| `QuoteTemplateList.tsx` | Llistat de plantilles |
| `QuoteTemplateForm.tsx` | Editor de plantilles |
| `QuoteTemplateCard.tsx` | Card de plantilla |
| `QuoteStats.tsx` | Estadístiques de pressupostos |

### 6.2 Modificacions Existents

| Arxiu | Canvi |
|-------|-------|
| `/sat/[id]/page.tsx` | Reemplaçar placeholder "Crear pressupost" per llistat real |
| `SidebarNav.tsx` | Afegir "Pressupostos" al menú SAT |
| `workOrderService.ts` | Afegir relació amb pressupostos |

### 6.3 Pàgines Noves

| URL | Descripció |
|-----|------------|
| `/sat/quotes` | Llistat de pressupostos |
| `/sat/quotes/[id]` | Detall d'un pressupost |
| `/sat/quotes/new?otId={id}` | Crear pressupost nou |
| `/sat/quotes/templates` | Gestió de plantilles |
| `/sat/quotes/templates/new` | Crear plantilla nova |
| `/sat/quotes/templates/[id]` | Editar plantilla |

---

## 7. PDF de Pressupost

### Estructura del PDF

```
┌─────────────────────────────────────────┐
│  [Logo empresa]                         │
│  PRESSUPOST                             │
│  PRES-2026-0001                         │
├─────────────────────────────────────────┤
│  Data: 28/05/2026                       │
│  And而且还: 27/06/2026 (30 dies)        │
│  Client: Restaurant El Terrall          │
│  OT: OT-2026-0001                       │
├─────────────────────────────────────────┤
│  DESCRIPCIÓ DEL TREBALL                 │
│  Reparació sistema elèctric sala...     │
├─────────────────────────────────────────┤
│  # │ Descripció       │ Qtat │ Preu   │
│  ──┼──────────────────┼──────┼────────│
│  1 │ Cable H07RN-F    │ 10m  │ 35.00€ │
│  2 │ Disjuntor 16A    │ 2    │ 25.80€ │
│  3 │ Mà d'obra (4h)   │ 4    │ 200.00€│
│  ──┴──────────────────┴──────┴────────│
│                            Subtotal:   │
│                              IVA 21%:  │
│                            ─────────── │
│                              TOTAL:    │
├─────────────────────────────────────────┤
│  Notes:                                 │
│  Pressupost vàlid fins al 27/06/2026.  │
│  Els preus inclouen materials i mà     │
│  d'obra. Desplaçament inclòs.          │
├─────────────────────────────────────────┤
│  [Firma del client]                     │
│  Data: ___/___/______                   │
│  Signatura: _____________               │
└─────────────────────────────────────────┘
```

### Plantilles PDF

Reutilitzar `pdfService.ts` amb nova funció `buildQuotePdf()`:

```typescript
class QuotePdfBuilder extends PdfBuilder {
  // Header amb logo i dades de l'empresa
  // Taula de línies amb descomptes
  // Resum de totals
  // Notes i condicions generals
  // Espai per firma
}
```

---

## 8. i18n Keys

### Catalan (`src/locales/ca/sat.json`)

```json
{
  "quotes": {
    "title": "Pressupostos",
    "newButton": "Nou Pressupost",
    "list": {
      "title": "Llistat de Pressupostos",
      "noResults": "No hi ha pressupostos",
      "filters": {
        "status": "Estat",
        "client": "Client",
        "dateRange": "Període"
      }
    },
    "status": {
      "draft": "Esborrany",
      "sent": "Enviat",
      "accepted": "Acceptat",
      "rejected": "Rebutjat",
      "expired": "Caducat",
      "cancelled": "Cancel·lat"
    },
    "detail": {
      "title": "Detall del Pressupost",
      "client": "Client",
      "workOrder": "Ordre de Treball",
      "validUntil": "Vàlid fins a",
      "subtotal": "Base imposable",
      "tax": "IVA",
      "total": "Total",
      "sendByEmail": "Enviar per email",
      "downloadPdf": "Descarregar PDF",
      "accept": "Acceptar",
      "reject": "Rebutjar"
    },
    "create": {
      "title": "Nou Pressupost",
      "fromTemplate": "Des de plantilla",
      "blank": "En blanc",
      "selectTemplate": "Seleccionar plantilla"
    },
    "items": {
      "title": "Línies del Pressupost",
      "addItem": "Afegir línia",
      "description": "Descripció",
      "quantity": "Quantitat",
      "unitPrice": "Preu unitari",
      "discount": "Descompte",
      "subtotal": "Subtotal",
      "category": "Categoria",
      "material": "Material",
      "labor": "Mà d'obra",
      "travel": "Desplaçament",
      "other": "Altres"
    },
    "email": {
      "title": "Enviar Pressupost",
      "to": "Destinatari",
      "subject": "Assumpte",
      "message": "Missatge",
      "send": "Enviar",
      "sending": "Enviant..."
    },
    "templates": {
      "title": "Plantilles de Pressupost",
      "newButton": "Nova Plantilla",
      "emptyState": "No hi ha plantilles creades",
      "usageCount": "Ús: {{count}} cops"
    }
  }
}
```

---

## 9. Testing

### Tests Unitaris

| Arxiu | Descripció | Tests |
|-------|------------|-------|
| `quoteService.test.ts` | CRUD + workflow + càlculs | ~8 |
| `quoteItemService.test.ts` | CRUD de línies + reordenació | ~6 |
| `quoteTemplateService.test.ts` | CRUD plantilles | ~5 |
| `quotePdfService.test.ts` | Generació PDF | ~4 |

### Tests d'Integració

| Descripció | Tests |
|------------|-------|
| Crear pressupost amb línies | 1 |
| Convertir plantilla a pressupost | 1 |
| Canviar estats amb transicions | 3 |
| Calcular totals correctament | 2 |

**Total estimat:** ~25 tests nous

---

## 10. Pla d'Implementació

### Fase 3A: Schema + CRUD Bàsic (1 dia)
- [ ] Schema Drizzle (`quotes`, `quote_items`, `quote_templates`)
- [ ] Migració de BD
- [ ] Server Actions CRUD
- [ ] Tipus TypeScript
- [ ] Tests unitaris

### Fase 3B: UI Llistat + Detall (1 dia)
- [ ] Pàgina `/sat/quotes` (llistat)
- [ ] Components: QuoteList, QuoteCard, QuoteStatusBadge
- [ ] Detall `/sat/quotes/[id]`
- [ ] Integració amb detall d'OT

### Fase 3C: Editor de Pressupost (1 dia)
- [ ] Formulari de creació
- [ ] Editor de línies (taula editable)
- [ ] Càlculs automàtics
- [ ] Guardar / Esborrany

### Fase 3D: PDF + Email (1 dia)
- [ ] Plantilla PDF de pressupost
- [ ] Generació de PDF
- [ ] Modal d'enviament per email
- [ ] Integració amb notificationService

### Fase 3E: Plantilles (0.5 dies)
- [ ] Schema de plantilles
- [ ] CRUD de plantilles
- [ ] Editor de plantilles
- [ ] Creació de pressupost des de plantilla

### Fase 3F: Tests + Polish (0.5 dies)
- [ ] Tests d'integració
- [ ] i18n complet
- [ ] Edge cases
- [ ] Review final

**Durada total estimada:** 4-5 dies

---

## 11. Dependències

### Existent (Reutilitzar)
- `pdfService.ts` → per generar PDF
- `signatureService.ts` → per signatura del client
- `notificationService.ts` → per enviar email
- `workOrderService.ts` → relació OT-pressupost
- `clientService.ts` → dades del client
- `productService.ts` → catàleg de productes

### Nou (Crear)
- `quoteService.ts` → Lògica de pressupostos
- `quoteItemService.ts` → Gestió de línies
- `quoteTemplateService.ts` → Gestió de plantilles
- `quotePdfService.ts` → Generació PDF de pressupost

---

## 12. Qüestions Per Decidir

### ❓ Preguntes Resoltes

1. **Número de pressupost:** `PRE-{YYYY}-{SEQ}` ✅
2. **Caducitat per defecte:** Configurable a les configuracions de l'empresa (futur) ✅
3. **IVA per defecte:** 21% (configurable per empresa) ✅
4. **Múltiples pressupostos per OT:** Permesos ✅
5. **Vista pública del client:** Ara, de forma professional ✅
6. **Conversió a factura:** Futur, però estructurat perquè sigui fàcil d'implementar ✅

---

## 13. Decisions Preses

| Decisió | Opció Escollida | Raonament |
|---------|-----------------|-----------|
| Ubicació | SAT (llistat + detall OT) | El pressupost neix de l'OT |
| Taules separades | Sí (`quotes` + `quote_items` + `quote_templates`) | Net, reutilitzable, escalable |
| Plantilles | Sí, taula separada amb `defaultItems` JSONB | Reutilització i manteniment |
| PDF | Reutilitzar `pdfService` amb extensió | Consistència visual |
| Email | Reutilitzar `notificationService` | Ja tenim nodemailer configurat |
| Estats | Lliures (validats per server) | Flexibilitat |
| Firmes | Reutilitzar taula `signatures` genèrica | Ja implementat |
| Número | `PRE-{YYYY}-{SEQ}` | Format net i professional |
| Caducitat | Configurable per empresa (futur) | Flexibilitat per a cada client |
| Múltiples/OT | Permesos | Un client pot voler diverses opcions |
| Vista pública | Ara, professional | El client pot veure i acceptar sense login |
| Conversió factura | Futur, estructurat | Camps preparats a la taula `quotes` |
| Test unitaris | ~25 tests nous | Cobertura mínima 80% |
| Durada | 4-5 dies | Realista per a un mòdul complet |

---

*Document creat per l'agent de RIBOTFLOW — 28/05/2026*
*Pendent de revisió i aprovació abans d'implementar.*
