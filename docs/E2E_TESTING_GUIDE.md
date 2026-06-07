# Guia de Proves E2E — RIBOTFLOW

> **Objectiu**: Verificar manualment tots els fluxos crítics de l'aplicació abans de passar a producció.
> **Freqüència**: Abans de cada desplegament major, després de canvis d'autenticació/permisos, o quan s'afegeixi una funcionalitat core.

---

## 1. Autenticació (CRÍTIC)

### 1.1 Login amb credencials
- [ ] Anar a `/login`
- [ ] Introduir email i password vàlids (ex: `dais@test.com` / `12345678`)
- [ ] **Esperat**: Redirecció a `/dashboard`, sessió activa, cookie `authjs.session-token` present
- [ ] **Error comú**: `UnsupportedStrategy` (strategy database en lloc de JWT)

### 1.2 Login amb credencials incorrectes
- [ ] Introduir password erroni
- [ ] **Esperat**: Missatge "Credencials invàlides", NO redirecció

### 1.3 Logout
- [ ] Clicar "Tancar sessió" al SidebarFooter
- [ ] **Esperat**: Redirecció a `/login`, cookie esborrat, refrescar pàgina → `/login`

### 1.4 Sessió expirada
- [ ] Esperar 8h (o modificar `maxAge` a 5s per provar)
- [ ] **Esperat**: Redirecció a `/login` en la següent navegació

---

## 2. Permisos i Sidebar (CRÍTIC)

### 2.1 Filtrat per rol
- [ ] Entrar com **OWNER** → veure TOTS els mòduls (SAT, ERP, Billing, CRM, Configuració, Team)
- [ ] Entrar com **ADMIN** → veure SAT (read), Configuració (read), Team (read/write). NO veure Email (SMTP)
- [ ] Entrar com **OFFICE** → veure SAT (read-only), Clients (read), Materials (read), Rutes (read). NO botons d'escriure
- [ ] Entrar com **TECHNICIAN** → veure SAT, `/sat/field`, Clients (read), Materials (read). NO veure Configuració/Team

### 2.2 Sub-item "Camp" (mòbil)
- [ ] Entrar com TECHNICIAN → veure sub-item "Camp" al Sidebar
- [ ] Entrar com ADMIN → NO veure "Camp" (no té `workorder:read:own`)
- [ ] Navegar a `/sat/field` → llista d'OTs assignades, botons de canvi d'estat grans (40px+)

### 2.3 Protecció de rutes
- [ ] TECHNICIAN intenta accedir a `/settings/team` → **Esperat**: 403 o redirecció
- [ ] ADMIN intenta accedir a `/settings/email` → **Esperat**: 403 (no té `email:read`)
- [ ] Usuari no autenticat intenta `/dashboard` → **Esperat**: Redirecció a `/login`

---

## 3. Configuració / Settings

### 3.1 Company (`/settings/company`)
- [ ] OWNER pot editar tots els camps (nom, CIF, direcció, branding, preferències)
- [ ] ADMIN pot VEURE però NO editar (botó desactivat o 403)
- [ ] Canviar logo → upload correcte, preview visible, guardar a MinIO/Supabase
- [ ] Canviar `travelRatePerKm` → valor persistit, visible a les sessions

### 3.2 Team (`/settings/team`)
- [ ] OWNER pot convidar usuari nou → email rebut, token vàlid
- [ ] Usuari convidat clica `/accept-invitation?token=...` → formulari de password, auto-login
- [ ] OWNER canvia rol d'un usuari (ex: TECHNICIAN → ADMIN)
- [ ] OWNER desactiva usuari → no pot fer login
- [ ] OWNER reactiva usuari → pot tornar a fer login
- [ ] Últim OWNER no es pot desactivar (error protegit)

### 3.3 Profile (`/settings/profile`)
- [ ] Canviar avatar → upload, preview, guardar
- [ ] Canviar nom → persistit a BD
- [ ] Canviar password → logout obligatori o sessió segueix vàlida?
- [ ] **Tema**: commutar light/dark → cookie `ribot_theme`, persistit a BD, NO flash (FOUC)
- [ ] **Idioma**: commutar ca/es → cookie `ribot_locale`, persistit a BD, router refresh
- [ ] **Sessions actives**: llista visible, badge "Aquest dispositiu" correcte, "Tanca totes les altres" funciona

---

## 4. SAT / Ordres de Treball

### 4.1 CRUD bàsic
- [ ] Crear OT (OFFICE/ADMIN/OWNER) → apareix a la llista
- [ ] Assignar tècnic → tècnic la veu a `/sat/field`
- [ ] Canviar estat (TECHNICIAN des de `/sat/field`) → estat actualitzat, historial reflectit
- [ ] Completar OT → botons desapareixen (missatge "Tancada")

### 4.2 Vista `/sat/field` (Mòbil)
- [ ] Ordenació per prioritat d'estat (in_progress primer)
- [ ] Cards grans (40px+ touch targets)
- [ ] Canvi d'estat amb un sol clic
- [ ] NO permet canviar estat d'OT no assignada

---

## 5. Quotes / Pressupostos

- [ ] Crear pressupost → número auto-generat (`PRE-YYYY-NNNN`)
- [ ] Afegir ítems → càlculs correctes (subtotal, IVA, total)
- [ ] Generar PDF → logo de l'empresa visible, dades correctes
- [ ] Enviar per email (si SMTP configurat) → email rebut

---

## 6. ERP / Productes

- [ ] Llistat de productes visible
- [ ] Crear producte → apareix al llistat
- [ ] Categoria assignada correctament

---

## 7. Billing / Facturació

- [ ] Generar factura des d'OT completada
- [ ] Número d'factura auto-generat (`INV-YYYY-NNNN`)
- [ ] PDF de factura amb logo i dades fiscals correctes

---

## 8. CRM / Clients

- [ ] Crear client → validació de CIF, telèfon, email
- [ ] Cercar client al selector de pressupostos
- [ ] Geolocalització (lat/lng) opcional per calcular desplaçaments

---

## 9. Accesibilitat i Responsive

- [ ] **Mobile**: Sidebar col·lapsable, touch targets ≥ 40px
- [ ] **Desktop**: Sub-menus expandibles, indicador visual d'actiu
- [ ] **Teclat**: Navegació per tab, Enter per activar, Escape per tancar dialogs
- [ ] **i18n**: Textos en català (default) i castellà, mai hardcoded
- [ ] **FOUC**: Canvi de tema NO produeix flash blanc (script anti-FOUC al `<head>`)

---

## 10. Seguretat

- [ ] **SQL Injection**: Provar input amb `' OR '1'='1` → Zod valida, mai arriba a la query
- [ ] **XSS**: Provar `<script>alert(1)</script>` a camps de text → escapat o rebutjat
- [ ] **CSRF**: Server Actions amb `auth()` check, cookies `sameSite: lax`
- [ ] **IDOR**: Usuari A no pot veure dades de company B (filtrat per `company_id`)
- [ ] **RBAC**: ADMIN no pot editar SMTP, OWNER sí. TECHNICIAN no pot veure Team.

---

## 11. Performance

- [ ] **Lighthouse**: Score ≥ 90 en Performance, Accessibilitat, Best Practices
- [ ] **Core Web Vitals**: LCP < 2.5s, CLS < 0.1, INP < 200ms
- [ ] **Bundle**: Build < 200MB (Docker multi-stage)

---

## 12. CI/CD Checklist (Automàtic)

Abans de cada push a `develop` o `main`:
- [ ] `pnpm tsc --noEmit` → 0 errors
- [ ] `pnpm lint` → 0 errors (warnings OK)
- [ ] `pnpm format:check` → All matched files
- [ ] `pnpm test --run` → 100% pass
- [ ] `pnpm build` → Compiled successfully

---

## Nota per als Agents IA

Si trobeu un error durant les proves E2E:
1. Reproduir-lo 3 vegades per confirmar
2. Guardar memòria a Engram (`engram save "..." --type bugfix`)
3. Crear test unitari que el reprodueixi (si és possible)
4. Fixar i tornar a provar tota la secció afectada
5. Mai assumir que "un fix petit no trenca res més"
