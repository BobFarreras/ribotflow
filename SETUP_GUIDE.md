# Procediments per Configurar RIBOTFLOW a una Màquina Nova

## Requisits Previs

- **Node.js 22+** (recomanat: instal·lar via nvm-windows o descarregar de nodejs.org)
- **pnpm** (gestor de paquets obligatori)
- **Docker Desktop** (per PostgreSQL i MinIO en contenidors)
- **Git** (per clonar el repositori)
- **.env.local** (fitxer de variables d'entorn, proporcionat per l'equip)

---

## 1. Clonar el Repositori

```bash
git clone https://github.com/BobFarreras/ribotflow.git
cd ribotflow
git checkout features/sat-work-orders
```

## 2. Instal·lar Dependències

```bash
# Instal·lar pnpm globalment si no el tens
npm install -g pnpm

# Instal·lar totes les dependències del projecte
pnpm install
```

## 3. Configurar Variables d'Entorn

Copiar el fitxer `.env.local` proporcionat per l'equip a l'arrel del projecte.

**Contingut típic de `.env.local`:**
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/ribotflow
AUTH_SECRET=un_secret_llarg_per_a_jwt_firma
NEXT_PUBLIC_APP_MODE=cloud

# === File Storage (MinIO per a dev) ===
STORAGE_PROVIDER=minio
MINIO_ENDPOINT=http://localhost:9002
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=ribotflow-uploads
```

**IMPORTANT:** No compartir mai `AUTH_SECRET` en repositoris públics.

> **Nota sobre `STORAGE_PROVIDER`:**
> - `minio` → Usa el contenidor MinIO local (recomanat per dev)
> - `local` → Guarda fitxers a `./uploads/` (fallback, mostra warning)
> - `supabase` → Usa Supabase Storage (només per a cloud/producció)

## 4. Iniciar PostgreSQL (Docker)

```bash
pnpm db:setup
```

Això:
1. Engega el contenidor PostgreSQL al port **5433**
2. Espera 8 segons perquè el servidor estigui llest
3. Aplica totes les migracions de Drizzle

**Per aturar:**
```bash
pnpm db:down
```

---

## 5. Iniciar MinIO (Object Storage)

RIBOTFLOW utilitza **MinIO** per a desar fitxers (fotos, PDFs, firmes) en desenvolupament. El `docker-compose.dev.yml` ja inclou el servei.

### 5.1 Engegar MinIO

```bash
# Si uses docker-compose.dev.yml (inclòs al repo)
docker compose -f docker-compose.dev.yml up -d minio
```

Això aixeca:
- **API MinIO** al port **9002** (on l'app puja fitxers)
- **Consola Web** al port **9003** (per veure fitxers com a S3)

### 5.2 Configurar el Bucket (Primera vegada)

Accedeix a la consola: **http://localhost:9003**
- **Usuari:** `minioadmin`
- **Contrasenya:** `minioadmin`

Crea el bucket `ribotflow-uploads` i fes-lo públic:
```bash
# Amb el client mc de MinIO (opcional)
mc alias set local http://localhost:9002 minioadmin minioadmin
mc mb local/ribotflow-uploads
mc anonymous set public local/ribotflow-uploads
```

> **Per què públic?** En dev és pràctic per veure fotos/PDFs directament. En producció es fan servir Signed URLs.

### 5.3 Verificar que funciona

Puja un fitxer de prova:
```bash
curl -X POST http://localhost:9002/ribotflow-uploads/test.txt \
  -H "Content-Type: text/plain" \
  -d "Hello MinIO"
```

I visualitza'l: **http://localhost:9002/ribotflow-uploads/test.txt**

---

## 6. Crear Dades de Demostració (DigitAIStudios)

```bash
pnpm db:seed:demo
```

Això crea l'empresa de test amb totes les dades:
- **Empresa:** DigitAIStudios
- **Usuari:** Adrià (OWNER)
- **Email:** `dais@test.com`
- **Contrasenya:** `12345678`
- **Clients:** 8 (restaurant, gimnàs, clínica, hotel, escola, supermercat, oficines, taller)
- **Categories SAT:** 5 (reparació, manteniment, instal·lació, muntatge, revisió)
- **Ordres de Treball:** 12 amb diferents estats i prioritats

## 7. Engegar el Servidor de Desenvolupament

```bash
pnpm dev
```

Accedir a: **http://localhost:3000**

> **Nota:** Cal reiniciar `pnpm dev` després de canviar `.env.local`. Next.js només llegeix variables d'entorn a l'inici.

## 8. Accedir amb l'Usuari de Test

- Vés a `/login`
- Entra amb: `dais@test.com` / `12345678`
- Clica el mòdul **SAT** al Dashboard
- Hauries de veure **12 ordres de treball** reals

## 9. Veure la Base de Dades (UI Web)

```bash
pnpm db:studio
```

Obrir **http://localhost:4983** al navegador (recomanat Firefox, Chrome pot bloquejar localhost).

## 10. Veure Fitxers al MinIO (Consola Web)

- Obrir **http://localhost:9003**
- Usuari: `minioadmin` / Contrasenya: `minioadmin`
- Navegar pel bucket `ribotflow-uploads`
- Estructura de carpetes esperada:
  ```
  sat/
    {companyId o companyName}/
      OT-2026-0001/
        foto_pantalla-a1b2c3d4.jpg
      OT-2026-0001-report-ca.pdf
      OT-2026-0001-signature.png
  ```

---

## Estructura de Branques Git

| Branca | Propòsit |
|--------|----------|
| `main` | Codi estable en producció |
| `develop` | Integració contínua, tests passats |
| `features/sat-work-orders` | Mòdul SAT (on treballem ara) |

**Per crear una nova feature:**
```bash
git checkout -b features/nom-de-la-feature
```

---

## Comandes Útils

| Comanda | Descripció |
|---------|------------|
| `pnpm dev` | Servidor de desenvolupament amb Turbopack |
| `pnpm build` | Build de producció |
| `pnpm test` | Executar tests unitaris |
| `pnpm ci:check` | Validació completa (typecheck + lint + format + tests + build) |
| `pnpm db:studio` | UI web de Drizzle per veure dades |
| `pnpm db:seed:demo` | Recrear dades de demo (DigitAIStudios) |
| `pnpm db:up` | Engegar PostgreSQL Docker |
| `pnpm db:down` | Aturar PostgreSQL Docker |
| `pnpm format` | Formatejar codi amb Prettier |
| `pnpm lint` | Revisar codi amb ESLint |

---

## Solució de Problemes Comuns

### Error: "MinIO bucket not found" o "Connection refused"

**Causa:** El contenidor MinIO no està engegat o el bucket no existeix.

**Solució:**
```bash
# 1. Verificar que el contenidor corre
docker ps | grep minio

# 2. Si no corre, engegar-lo
docker compose -f docker-compose.dev.yml up -d minio

# 3. Crear el bucket si no existeix
mc alias set local http://localhost:9002 minioadmin minioadmin
mc mb local/ribotflow-uploads
mc anonymous set public local/ribotflow-uploads
```

### Error: "Could not resolve translation key"

**Causa:** Falta una clau de traducció als fitxers `src/locales/ca/sat.json` o `es/sat.json`.

**Solució:** Afegir la clau que falta als dos fitxers i reconstruir.

### Error: "Invalid status transition"

**Causa:** L'ordre de treball té un estat que no està definit al workflow (`src/services/sat/workOrderService.ts`).

**Solució:** Afegir l'estat a `WorkOrderStatus` (tipus + schema + traduccions + workflow).

### Error: "CredentialsSignin" tot i contrasenya correcta

**Causa:** La cookie de sessió no es guarda. Revisar que `AUTH_SECRET` estigui definit al `.env.local`.

---

## Compte de Test Oficial (NO TOCAR)

**Empresa:** DigitAIStudios  
**Usuari:** Adrià  
**Email:** `dais@test.com`  
**Contrasenya:** `12345678`  
**Rol:** OWNER  

> Aquest compte és el PERMANENT per a desenvolupament i demos. No esborrar mai. Si cal netejar la BD, usar `scripts/seed-demo.ts` per recrear-lo.

---

## Contacte

Per dubtes tècnics o decisions arquitectòniques, consultar la memòria persistent d'Engram MCP o preguntar a l'equip.
