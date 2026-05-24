# Especificació del Mòdul SAT — RIBOTFLOW

> **Metodologia:** SDD (Specification-Driven Development)
> **Data:** 24/05/2026
> **Versió:** 1.0.0
> **Estat:** Draft per a revisió

---

## 1. Resum Executiu

El **Mòdul SAT (Servei d'Assistència Tècnica)** és el nucli operatiu de RIBOTFLOW per a empreses de servei tècnic. Dissenyat amb una arquitectura **Mobile-First** perquè els tècnics puguin treballar des del mòbil al carrer, i un **Command-Center** per a l'oficina.

### Objectius
1. Digitalitzar el 100% de les ordres de treball.
2. Reduir el temps administratiu de tancament d'ordres un 70%.
3. Garantir traçabilitat completa: qui, què, quan, on i amb quins materials.
4. Compliment legal de la firma del client i generació de PDFs.

---

## 2. Entitats i Model de Dades

### 2.1 Diagrama Entitat-Relació (Textual)

```
┌─────────────────┐     ┌──────────────────────┐     ┌──────────────────┐
│   companies     │1    │      clients         │1    │  work_orders   │
│  (ja existeix)  │◄────┤  (SAT + CRM shared)  │◄────┤   (nucli SAT)  │
└─────────────────┘     └──────────────────────┘     └────────┬─────────┘
         ▲                         ▲                            │
         │1                        │1                           N│
         │                        │                             │
         │     ┌──────────────────┴───────┐                  │
         │     │ work_order_categories      │                  │
         │     │ (tipus: manteniment,       │                  │
         │     │  reparació, muntatge...)   │                  │
         │     └────────────────────────────┘                  │
         │                                                   │
         │     ┌──────────────────────┐                     │
         │     │ work_order_status    │                     │
         │     │    _history          │                     │
         │     │ (audit log d'estats) │                     │
         │     └──────────────────────┘                     │
         │                                                   │
         │N                                   ┌──────────────┼──────────────┐
         │                                   N│              │              │
         │                                    │              │              │
         │                                    │              │              │
┌────────┴─────────┐     ┌────────────────────┴──┐  ┌───────┴────────┐  ┌────┴─────────────────┐
│  work_order_     │N   M│   work_order_        │  │ work_order_    │  │ work_order_          │
│  materials       │◄────┤   attachments        │  │ _signatures    │  │ _locations           │
│  (rel·lació amb  │     │   (fotos/vídeos/docs) │  │ (firma client) │  │ (geolocalització)    │
│   products ERP)  │     └───────────────────────┘  └────────────────┘  └─────────────────────┘
└──────────────────┘
```

### 2.2 Taules i Responsabilitats

#### `clients` (Compartit amb CRM)
| Camp | Tipus | Notes |
|------|-------|-------|
| `id` | uuid (PK) | |
| `company_id` | uuid (FK → companies) | **Multi-tenancy** |
| `name` | text | Nom del client |
| `email` | text | |
| `phone` | text | |
| `address` | text | Adreça principal |
| `location` | jsonb | `{ lat, lng }` per a mapes |
| `tax_id` | text | NIF/CIF |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

> **Index:** `company_id`, `email` (unique per company).

---

#### `work_order_categories` (Tipus d'Ordre Configurables)
Cada empresa pot definir els seus propis tipus d'ordre: manteniment, reparació, muntatge, instal·lació, revisió, etc.

| Camp | Tipus | Notes |
|------|-------|-------|
| `id` | uuid (PK) | |
| `company_id` | uuid (FK → companies) | **Multi-tenancy** |
| `name` | text | Nom visible: "Manteniment", "Reparació"... |
| `slug` | text | Clau tècnica per a i18n: `maintenance`, `repair`, `installation`, `assembly`, `inspection` |
| `color` | text (nullable) | Color del badge (hex): `#3b82f6`, `#22c55e`... |
| `icon` | text (nullable) | Clau d'icona (Lucide): `Wrench`, `Hammer`, `ClipboardCheck`... |
| `is_default` | boolean | `true` = categoria per defecte per a noves ordres |
| `sort_order` | integer | Ordre de visualització al selector |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

> **Index:** `company_id` + `slug` (unique), `company_id` + `sort_order`.
> **Constraint:** Màxim 1 `is_default = true` per `company_id`.

**Categories per defecte (seed):**
| Nom (CA) | Slug | Ús típic |
|----------|------|----------|
| Reparació | `repair` | Avaria, urgència |
| Manteniment | `maintenance` | Preventiu, contracte |
| Instal·lació | `installation` | Nou equip, primera vegada |
| Muntatge | `assembly` | Mobiliari, estructures |
| Revisió | `inspection` | Control periòdic, legal |
| Substituir | `replacement` | Canvi de peça/equip |

---

#### `work_orders` (Nucli del SAT)
| Camp | Tipus | Notes |
|------|-------|-------|
| `id` | uuid (PK) | |
| `company_id` | uuid (FK → companies) | **Multi-tenancy obligatori** |
| `client_id` | uuid (FK → clients) | |
| `category_id` | uuid (FK → work_order_categories) | **Tipus d'ordre** (manteniment, reparació...) |
| `assigned_to` | uuid (FK → users, nullable) | Tècnic assignat |
| `created_by` | uuid (FK → users) | Usuari que crea l'ordre |
| `number` | text | Número d'ordre human-readable (ex: "OT-2026-0001") |
| `title` | text | Títol breu de la incidència |
| `description` | text | Descripció detallada |
| `status` | text | `pending`, `assigned`, `in_progress`, `paused`, `completed`, `closed`, `cancelled` |
| `priority` | text | `low`, `medium`, `high`, `urgent` |
| `scheduled_date` | timestamp (nullable) | Data programada de visita |
| `started_at` | timestamp (nullable) | Quan el tècnic comença |
| `completed_at` | timestamp (nullable) | Quan el tècnic marca com a completada |
| `closed_at` | timestamp (nullable) | Quan l'oficina tanca l'ordre |
| `estimated_duration_minutes` | integer | Estimació inicial |
| `actual_duration_minutes` | integer (nullable) | Durada real calculada |
| `notes` | text | Notes internes de l'oficina |
| `signature_url` | text (nullable) | URL de la firma capturada |
| `signature_at` | timestamp (nullable) | Data de la firma |
| `pdf_url` | text (nullable) | URL del PDF generat |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |
| `scheduled_date` | timestamp (nullable) | Data programada de visita |
| `started_at` | timestamp (nullable) | Quan el tècnic comença |
| `completed_at` | timestamp (nullable) | Quan el tècnic marca com a completada |
| `closed_at` | timestamp (nullable) | Quan l'oficina tanca l'ordre |
| `estimated_duration_minutes` | integer | Estimació inicial |
| `actual_duration_minutes` | integer (nullable) | Durada real calculada |
| `notes` | text | Notes internes de l'oficina |
| `signature_url` | text (nullable) | URL de la firma capturada |
| `signature_at` | timestamp (nullable) | Data de la firma |
| `pdf_url` | text (nullable) | URL del PDF generat |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

> **Index:** `company_id` + `status`, `company_id` + `assigned_to`, `company_id` + `client_id`, `number` (unique per company).

---

#### `work_order_status_history` (Audit Log)
| Camp | Tipus | Notes |
|------|-------|-------|
| `id` | uuid (PK) | |
| `work_order_id` | uuid (FK → work_orders, cascade delete) | |
| `status_from` | text | Estat anterior |
| `status_to` | text | Estat nou |
| `changed_by` | uuid (FK → users) | Qui va fer el canvi |
| `reason` | text (nullable) | Motiu del canvi (ex: "esperant peça") |
| `created_at` | timestamp | |

> **Index:** `work_order_id` + `created_at` (per a timeline).

---

#### `work_order_materials` (Materials Consumits)
| Camp | Tipus | Notes |
|------|-------|-------|
| `id` | uuid (PK) | |
| `work_order_id` | uuid (FK → work_orders, cascade delete) | |
| `product_id` | uuid (FK → products, nullable) | Si vinculat a catàleg ERP |
| `name` | text | Nom del material (per a materials lliures) |
| `quantity` | numeric(10,2) | Quantitat usada |
| `unit_price` | numeric(10,2) (nullable) | Preu de cost (per a informes) |
| `unit_cost` | numeric(10,2) (nullable) | Preu de venda al client |
| `created_at` | timestamp | |

> **Index:** `work_order_id`.

---

#### `work_order_attachments` (Fotos, Vídeos, Documents)
| Camp | Tipus | Notes |
|------|-------|-------|
| `id` | uuid (PK) | |
| `work_order_id` | uuid (FK → work_orders, cascade delete) | |
| `uploaded_by` | uuid (FK → users) | |
| `type` | text | `photo`, `video`, `document`, `audio` |
| `file_name` | text | Nom original del fitxer |
| `storage_key` | text | Ruta/identificador al storage (S3 o local) |
| `url` | text (nullable) | URL pública (signed URL temporal) |
| `mime_type` | text | `image/jpeg`, `video/mp4`, etc. |
| `size_bytes` | integer | Mida del fitxer |
| `width` | integer (nullable) | Amplada en píxels (per a imatges) |
| `height` | integer (nullable) | Alçada en píxels (per a imatges) |
| `duration_seconds` | integer (nullable) | Durada (per a vídeos/àudio) |
| `location` | jsonb (nullable) | `{ lat, lng, accuracy }` GPS de captura |
| `is_before` | boolean | `true` = foto de "abans", `false` = "després" |
| `caption` | text (nullable) | Peu de foto/descripció |
| `created_at` | timestamp | |

> **Index:** `work_order_id` + `type`, `work_order_id` + `created_at`.

---

#### `work_order_signatures` (Firma Biomètrica)
| Camp | Tipus | Notes |
|------|-------|-------|
| `id` | uuid (PK) | |
| `work_order_id` | uuid (FK → work_orders, cascade delete) | |
| `signed_by` | text | Nom de qui signa (client) |
| `signature_svg` | text | SVG vectorial de la firma |
| `signature_png_url` | text (nullable) | URL de la versió PNG renderitzada |
| `ip_address` | text (nullable) | IP del dispositiu |
| `user_agent` | text (nullable) | Navegador/dispositiu |
| `location` | jsonb (nullable) | `{ lat, lng }` on es va signar |
| `created_at` | timestamp | |

> **Index:** `work_order_id` (unique, 1 firma per ordre).

---

#### `work_order_locations` (Geolocalització / Tracking)
| Camp | Tipus | Notes |
|------|-------|-------|
| `id` | uuid (PK) | |
| `work_order_id` | uuid (FK → work_orders, cascade delete) | |
| `user_id` | uuid (FK → users) | Tècnic que genera la ubicació |
| `event_type` | text | `check_in`, `check_out`, `location_update`, `route_point` |
| `lat` | numeric(10,7) | Latitud |
| `lng` | numeric(10,7) | Longitud |
| `accuracy` | numeric(5,2) (nullable) | Precisió en metres |
| `altitude` | numeric(8,2) (nullable) | Altitud |
| `battery_level` | integer (nullable) | % de bateria del dispositiu (per a diagnostics) |
| `metadata` | jsonb (nullable) | Dades addicionals del dispositiu |
| `created_at` | timestamp | |

> **Index:** `work_order_id` + `event_type` + `created_at`.

---

## 3. Workflow del Cicle de Vida d'una Ordre

```
┌─────────┐    assigna      ┌───────────┐   check-in    ┌─────────────┐
│ PENDING │ ──────────────► │ ASSIGNED  │ ────────────► │ IN_PROGRESS│
│ (gris)  │                 │ (blau)    │               │ (taronja)   │
└─────────┘                 └───────────┘               └──────┬──────┘
     ▲                                                           │
     │                    ┌─────────────┐   pausa               │
     │                    │   PAUSED    │ ◄───────────────────────┘
     │                    │ (groc)      │   (esperant peça, etc.)
     │                    └──────┬──────┘
     │                           │ reprendre
     │                           ▼
     │                    ┌─────────────┐   completar    ┌─────────────┐
     │                    │ IN_PROGRESS │ ──────────────► │  COMPLETED  │
     │                    │             │                │  (verd)     │
     │                    └─────────────┘                └──────┬──────┘
     │                                                         │
     │                    signatura + PDF                     │
     │                    ┌─────────────┐   tancar            │
     └────────────────────│   CLOSED    │ ◄───────────────────┘
                          │ (lila)      │   (oficina valida)
                          └─────────────┘

CANCELLED (vermell) ←── des de qualsevol estat (excepte CLOSED)
```

### Transicions permeses
| Des de | Pot anar a | Rol requerit | Notes per Categoria |
|--------|-----------|--------------|-------------------|
| `pending` | `assigned`, `cancelled` | ADMIN / OFFICE / OWNER | — |
| `assigned` | `in_progress`, `cancelled` | Tècnic assignat / ADMIN | **Manteniment:** pot requerir validació de contracte actiu |
| `in_progress` | `paused`, `completed`, `cancelled` | Tècnic assignat | **Reparació:** si `paused` > 48h, notificar oficina automàticament |
| `paused` | `in_progress`, `cancelled` | Tècnic assignat | — |
| `completed` | `closed`, `in_progress` (reobrir) | OFFICE / ADMIN / OWNER | **Instal·lació:** requereix checklist de verificació abans de tancar |
| `closed` | — (final) | — | — |
| `cancelled` | `pending` (reactivar) | ADMIN / OWNER | — |

> **Regla per Categoria (Futur):** El tipus d'ordre pot activar regles de negoci específiques. Per exemple:
> - `maintenance` → pot tenir un **checklist obligatori** de punts a revisar.
> - `installation` → requereix **foto de "abans" i "després"** obligatòries per tancar.
> - `repair` → si es pausa per "esperant peça", suggereix generar **comanda automàtica** a l'ERP.

---

## 4. Estructura de Directoris del Mòdul SAT

```
src/
├── app/(dashboard)/dashboard/sat/
│   ├── page.tsx                    # Llistat d'ordres (Kanban + Llista)
│   ├── layout.tsx                  # Layout del mòdul SAT
│   ├── new/
│   │   └── page.tsx                # Formulari nova ordre
│   ├── categories/
│   │   └── page.tsx                # Gestió de categories (ADMIN)
│   ├── [id]/
│   │   └── page.tsx                # Detall de l'ordre
│   ├── [id]/edit/
│   │   └── page.tsx                # Editar ordre (oficina)
│   └── [id]/signature/
│       └── page.tsx                # Pantalla de firma (mòbil client)
│
├── actions/sat/
│   ├── createWorkOrder.ts
│   ├── updateWorkOrder.ts
│   ├── assignWorkOrder.ts
│   ├── updateStatus.ts
│   ├── addMaterial.ts
│   ├── removeMaterial.ts
│   ├── addAttachment.ts
│   ├── deleteAttachment.ts
│   ├── captureSignature.ts
│   ├── generatePdf.ts
│   ├── createCategory.ts           # Crear categoria d'ordre
│   ├── updateCategory.ts           # Editar categoria
│   └── deleteCategory.ts           # Eliminar categoria
│
├── services/sat/
│   ├── workOrderService.ts         # Lògica de negoci (CRUD + workflow)
│   ├── materialService.ts          # Gestió de materials
│   ├── attachmentService.ts        # Gestió d'arxius (upload/delete)
│   ├── signatureService.ts         # Captura i validació de firmes
│   ├── locationService.ts          # Tracking GPS
│   └── categoryService.ts          # Gestió de categories configurables
│
├── db/schema/sat.ts                # Esquemes Drizzle del SAT
│
├── components/modules/sat/
│   ├── WorkOrderList.tsx           # Llistat amb filtres i search
│   ├── WorkOrderKanban.tsx         # Vista Kanban (oficina)
│   ├── WorkOrderCard.tsx           # Targeta resum (mòbil)
│   ├── WorkOrderDetail.tsx         # Detall complet
│   ├── WorkOrderForm.tsx           # Formulari crear/editar
│   ├── WorkOrderTimeline.tsx       # Històric d'estats
│   ├── CategorySelector.tsx        # Selector de tipus d'ordre (visual)
│   ├── CategoryBadge.tsx           # Badge de categoria amb color/icona
│   ├── CategoryManager.tsx         # Panell de gestió de categories
│   ├── MaterialList.tsx            # Materials usats
│   ├── AttachmentGrid.tsx          # Galeria de fotos/vídeos
│   ├── AttachmentUploader.tsx      # Upload drag&drop
│   ├── SignatureCanvas.tsx         # Canvas per a firma
│   ├── SignaturePad.tsx            # Component de firma biomètrica
│   ├── LocationMap.tsx             # Mapa amb ubicació
│   ├── CheckInButton.tsx           # Botó check-in GPS
│   └── StatusBadge.tsx             # Badge d'estat amb color
│
├── hooks/sat/
│   ├── useWorkOrders.ts            # Fetch + cache de llistat
│   ├── useWorkOrder.ts             # Fetch d'una ordre
│   ├── useCreateWorkOrder.ts       # Mutation crear
│   ├── useUpdateStatus.ts          # Mutation canviar estat
│   ├── useUploadAttachment.ts      # Mutation upload arxiu
│   ├── useCaptureSignature.ts      # Mutation capturar firma
│   ├── useCategories.ts            # Fetch categories de l'empresa
│   └── useCreateCategory.ts        # Mutation crear categoria
│
├── types/sat/
│   ├── index.ts                    # Tipus principals (WorkOrder, Client...)
│   ├── status.ts                   # Enum d'estats i transicions
│   ├── category.ts                 # Tipus de categoria d'ordre
│   └── attachment.ts               # Tipus d'adjunts
│
└── lib/validators/sat/
    ├── workOrderSchema.ts          # Zod schema per a ordres
    ├── materialSchema.ts           # Zod schema per a materials
    ├── categorySchema.ts           # Zod schema per a categories
    └── signatureSchema.ts          # Zod schema per a firmes
```

---

## 5. Matriu de Funcionalitats per Tier (Free / Plus / Enterprise)

| Funcionalitat | FREE | PLUS | ENTERPRISE | Detall |
|---------------|:----:|:----:|:----------:|--------|
| **Crear ordre de treball** | ✅ | ✅ | ✅ | Títol, descripció, client, prioritat |
| **Tipus d'ordre (categories)** | ✅ | ✅ | ✅ | 5 per defecte (repair, maintenance, installation, assembly, inspection) |
| **Categories personalitzades** | ❌ | ✅ (max 10) | ✅ (ilimitat) | Crear tipus propis amb color i icona |
| **Assignar a tècnic** | ✅ | ✅ | ✅ | Dropdown d'usuaris amb rol TECHNICIAN |
| **Canviar estat** | ✅ | ✅ | ✅ | Workflow complet fins a `completed` |
| **Afegir materials** | ✅ | ✅ | ✅ | Manual o des de catàleg ERP |
| **Notes internes** | ✅ | ✅ | ✅ | Text lliure |
| **Adjuntar fotos** | ✅ (max 5) | ✅ (ilimitat) | ✅ (ilimitat) | JPEG/PNG amb compressió |
| **Adjuntar vídeos** | ❌ | ✅ (max 2 min) | ✅ (max 10 min) | MP4, compressió server-side |
| **Firma biomètrica** | ✅ | ✅ | ✅ | SVG + PNG, geolocalitzada |
| **Generar PDF** | ✅ | ✅ | ✅ | Plantilla amb logo de l'empresa |
| **Check-in GPS** | ❌ | ✅ | ✅ | Botó + validació de distància |
| **Tracking de ruta** | ❌ | ❌ | ✅ | Pings cada 2 minuts en actiu |
| **Integració Google Calendar** | ❌ | ✅ | ✅ | Crea esdeveniment a la visita |
| **Enllaç Google Maps/Waze** | ❌ | ✅ | ✅ | Navegació amb un clic |
| **Mode Offline (PWA)** | ❌ | ✅ | ✅ | IndexedDB + sync en reconnectar |
| **Optimitzador de Rutes** | ❌ | ❌ | ✅ | Algorisme per a múltiples ordres/dia |
| **Notificacions push** | ❌ | ✅ | ✅ | Nova ordre assignada, recordatori |
| **Històric complet d'auditoria** | ❌ | ❌ | ✅ | Qui va fer què i quan |

---

## 6. Seccions UI i Prioritats

### 🔴 Prioritat 1 — MVP Free (Imprescindible)
1. **Llistat d'Ordres (`/dashboard/sat`)**
   - Vista de llista per a mòbil: client, estat, data, prioritat, **categoria (badge de color)**.
   - Filtres ràpids: Meves ordres (tècnic), Pendents, En curs, **per categoria**, Totes.
   - Cercador per client o número d'ordre.
   - Botó flotant (+) per a nova ordre.

2. **Detall de l'Ordre (`/dashboard/sat/[id]`)**
   - Capçalera: número, estat (badge), prioritat, **categoria (badge amb color i icona)**.
   - Dades del client (nom, telèfon, adreça, botó trucar).
   - Descripció de la incidència.
   - Timeline d'estats (històric).
   - Llistat de materials.
   - Galeria de fotos (grid 3x3, preview modal).
   - Botons d'acció segons estat: "Començar", "Pausar", "Completar", "Tancar".

3. **Formulari Nova Ordre (`/dashboard/sat/new`)**
   - **Tipus d'Ordre (selector visual amb icones i colors):** Reparació, Manteniment, Instal·lació, Muntatge, Revisió...
   - Client (autocomplete + crear nou inline).
   - Títol + descripció.
   - Prioritat (selector visual: baixa, mitjana, alta, urgent).
   - Data programada (date picker).
   - Assignar tècnic (dropdown).
   - Botó submit amb validació Zod.

4. **Captura de Firma (`/dashboard/sat/[id]/signature`)**
   - Pantalla completa neta (sense distraccions).
   - Canvas tactile per a dibuixar la firma.
   - Botó "Esborrar" i "Confirmar".
   - Després de confirmar: generació de PDF + redirecció.

### 🟡 Prioritat 2 — Free Tier (Completitud)
5. **Kanban Board** (`/dashboard/sat?view=kanban`)
   - Columnes: Pendent, Assignada, En Curs, Completada.
   - Drag & drop per a canviar estat (només ADMIN/OFFICE).
   - Ideal per a oficina (no mòbil).

6. **Gestionar Materials**
   - Afegir material des del detall de l'ordre.
   - Selector de productes del catàleg ERP.
   - O entrada manual (nom + quantitat + preu).
   - Resum de costos totals.

7. **Upload de Fotos**
   - Drag & drop o selecció de càmera (mòbil).
   - Compressió automàtica abans d'enviar.
   - Etiqueta "Abans" / "Després".
   - Visualització en grid amb zoom (lightbox).

### 🟢 Prioritat 3 — Plus Tier (Growth)
8. **Geolocalització i Check-in**
   - Botó "Check-in" que valida que el tècnic està a <100m de l'adreça.
   - Mapa incrustat amb la ubicació del client.
   - Enllaç extern a Google Maps / Waze.

9. **Integració Calendari**
   - Sync amb Google Calendar de l'empresa.
   - Crea event "Visita SAT: [Client]" a la data programada.

10. **Mode PWA Offline**
    - Sync de llistat d'ordres assignades a IndexedDB.
    - Crear/modificar ordres offline, sync quan hi hagi connexió.
    - Cua d'uploads (fotos/firmes) amb retry.

### 🔵 Prioritat 4 — Enterprise Tier (Robustesa)
11. **Tracking de Rutes**
    - Background geolocation pings cada 2 minuts.
    - Visualització de la ruta al mapa (polilínia).

12. **Optimitzador de Rutes**
    - Input: llistat d'ordres assignades per demà.
    - Output: ordre òptim de visites (minimitzar temps + distància).
    - Considera: trànsit en temps real (API Google).

---

## 7. Influència del Tipus d'Ordre (Categoria) en el Negoci

El tipus d'ordre no és només una etiqueta visual. Pot activar comportaments diferents:

### Exemples per Categoria

| Categoria | Comportament específic | Detall |
|-----------|------------------------|--------|
| **Reparació** | Urgència per defecte | Prioritat = `high` si no se'n especifica cap. Permet pausa per "esperant peça". |
| **Manteniment** | Checklist obligatori | Llista de punts a revisar (configurable per empresa) que el tècnic ha de marcar. |
| **Instal·lació** | Foto abans/després | Requereix mínim 2 fotos (1 abans, 1 després) per tancar l'ordre. |
| **Muntatge** | Materials predefinits | Pot suggerir materials típics segons el tipus de muntatge. |
| **Revisió** | Alerta legal | Si la data de propera revisió s'apropa (<30 dies), notificar al client. |

### Configuració per Empresa

Cada empresa (OWNER/ADMIN) pot:
- **Crear** noves categories (ex: "Desinfecció", "Auditoria energètica").
- **Editar** noms, colors, icones.
- **Eliminar** categories (només si no tenen ordres associades).
- **Definir** quina és la categoria per defecte.
- **(Enterprise)** Assignar **workflows personalitzats** per categoria (ex: manteniment requereix 3 signatures, reparació només 1).

---

## 8. Consideracions Tècniques

### 7.1 Gestió d'Arxius (Fotos/Vídeos)

**Problema:** PostgreSQL no és eficient per emmagatzemar fitxers binaris grans.
**Solució:** Guardar metadades a PostgreSQL + fitxers a un object storage.

| Mode | Storage |
|------|---------|
| **Cloud (SaaS)** | S3-compatible (AWS S3, Cloudflare R2, MinIO). URLs firmades temporals. |
| **Self-Hosted** | Volum Docker muntat a `/app/uploads`. Nginx serve static. |
| **Dev Local** | Carpeta local `/uploads` al projecte (gitignored). |

**Fluxe d'upload:**
```
Client → Server Action → Validació Zod (tipus, mida)
       → Generar UUID + path (ex: sat/company-id/wo-id/photo-uuid.jpg)
       → Guardar fitxer al storage
       → Guardar registre a work_order_attachments
       → Retornar URL (o signed URL)
```

### 7.2 Compressió de Fotos
- Client-side: Comprimir a max 1920px d'amplada, qualitat 80% JPEG.
- Mida màxima per foto: 5MB → target <500KB.
- Per a vídeos (Plus): FFmpeg server-side o limitar gravació a 720p.

### 7.3 Geolocalització
- **Browser Geolocation API** per a check-in (requereix HTTPS).
- **Mobile:** GPS natiu via PWA / Capacitor (futur).
- **Precisió:** Validar `accuracy < 100m` per a check-in.
- **Privacitat:** Només recollir ubicació quan l'ordre està en `in_progress`.

### 7.4 Signatura Biomètrica
- **Tecnologia:** Canvas HTML5 amb touch events.
- **Format:** Guardar com a SVG (vectorial, escalable) + PNG renderitzat (per a PDF).
- **Metadades:** Timestamp, geolocalització, IP, user-agent (prova legal).
- **PDF:** Generar amb `pdf-lib` o `jsPDF` (client-side per a preview, server-side per a versió final).

### 7.5 Número d'Ordre Human-Readable
- Format: `OT-{YYYY}-{SECUENCIA}`
- Seqüència: per company (no global). Ex: `OT-2026-0001`, `OT-2026-0002`.
- Implementació: Funció SQL `nextval('work_order_number_seq')` o lògica a la app.

---

## 8. Plan d'Implementació (Fases Tècniques)

### Fase 2A — Esquelet de Dades i Accions (Setmana 1)
- [ ] Crear esquema `work_order_categories` amb categories per defecte (seed)
- [ ] Crear esquemes Drizzle restants (`clients`, `work_orders`, `attachments`...)
- [ ] Generar migracions (`pnpm db:generate`)
- [ ] Aplicar migracions (`pnpm db:migrate`)
- [ ] Seed de categories per defecte (reparació, manteniment, instal·lació, muntatge, revisió)
- [ ] Crear Server Actions base (CRUD + validació Zod)
- [ ] Tests TDD per a Server Actions (Vitest + DB de test)

### Fase 2B — UI Llistat i Detall (Setmana 1-2)
- [ ] Pàgina `/dashboard/sat` — llistat amb filtres
- [ ] Component `WorkOrderCard` (Mobile-First)
- [ ] Pàgina `/dashboard/sat/[id]` — detall de l'ordre
- [ ] Timeline d'estats
- [ ] Accions de canvi d'estat (botons condicionals)

### Fase 2C — Nova Ordre i Formularis (Setmana 2)
- [ ] Pàgina `/dashboard/sat/new`
- [ ] Formulari amb React Hook Form + Zod
- [ ] Autocomplete de clients (amb creació inline)
- [ ] Assignació de tècnic

### Fase 2D — Materials i Adjunts (Setmana 3)
- [ ] Gestió de materials (afegir/eliminar)
- [ ] Upload de fotos (drag & drop + càmera)
- [ ] Grid de fotos amb lightbox
- [ ] Compressió client-side

### Fase 2E — Firma i PDF (Setmana 3-4)
- [ ] Component `SignatureCanvas`
- [ ] Pàgina de firma full-screen
- [ ] Generació de PDF (logo empresa + dades + firma)
- [ ] Descàrrega i enviament per email (futur)

### Fase 2F — Geolocalització i Kanban (Plus — Setmana 4-5)
- [ ] Check-in GPS amb validació
- [ ] Mapa incrustat (Leaflet / MapLibre)
- [ ] Vista Kanban per a oficina
- [ ] Integració Google Calendar (futur)

---

## 9. Tests TDD a Implementar

### Unitari (Servicis)
- `categoryService.create()` → valida `company_id`, `slug` únic
- `categoryService.setDefault()` → només 1 default per empresa
- `workOrderService.create()` → valida `company_id`, genera número correcte, assigna categoria per defecte
- `workOrderService.updateStatus()` → valida transició permesa, rebutja il·legal
- `workOrderService.assign()` → només ADMIN/OFFICE poden assignar
- `materialService.add()` → actualitza total de costos

### Integració (Server Actions)
- `createCategoryAction` → crea categoria amb color i icona
- `createWorkOrderAction` → crea ordre + número seqüencial + categoria per defecte si no s'especifica
- `updateStatusAction` → crea registre a `status_history`
- `addMaterialAction` → requereix `company_id` de la sessió
- `captureSignatureAction` → valida que l'ordre està en `completed`

### E2E (Futur — Playwright)
- Tècnic crea ordre, assigna, completa, firma, genera PDF.
- Fluxe complet des del login fins al tancament.
- Administrador crea nova categoria i l'usa en una ordre.

---

> **Nota:** Aquest document és l'especificació viva del Mòdul SAT. Qualsevol canvi d'arquitectura o funcionalitat ha de ser reflectit aquí abans d'implementar-se al codi.
