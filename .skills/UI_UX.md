# [SKILL:UI_UX]

## Context d'Activació
Aquesta skill es desperta quan es requereix: disseny de components React, layouts, estils, accessibilitat, responsivitat, o qualsevol aspecte de la interfície d'usuari.

## 🎨 Stack de UI
- **Framework:** Next.js 15+ (App Router, Server Components per defecte)
- **Estils:** Tailwind CSS 4+ (utility-first, design tokens)
- **Components:** Radix UI (headless, accessible) + variants de classe (CVA)
- **Icons:** Lucide React (consistent, lightweight)
- **Forms:** React Hook Form + Zod (validació type-safe)

## 📱 Filosofia de Disseny
- **Mobile-First:** Interfície optimitzada per a operaris de camp (SAT)
- **Command-Center:** Vistes d'escriptori expansives per a oficines (ERP, CRM, Billing)
- **PWA:** Suport offline amb IndexedDB per a mode de camp sense cobertura
- **Accessible:** WCAG 2.1 AA mínim, navegació per teclat, ARIA labels

## 🧩 Estructura de Components (`/src/components/`)
```
ui/              → Components atòmics reutilitzables (Button, Input, Modal, Table)
layout/          → Estructures de pàgina (Header, Sidebar, Shell, Breadcrumb)
modules/         → Components específics de mòdul (sat/, erp/, billing/, crm/, access/)
forms/           → Formularis complexos amb validació Zod
charts/          → Visualitzacions de dades (kanban, dashboards, reports)
pwa/             → Components específics PWA (offline indicator, sync status)
```

## 🌐 Multi-idioma (I18n)
- **Suport:** Català i Castellà des del dia 1
- **Implementació:** Fitxers JSON a `/src/locales/{ca,es}/`
- **Regla:** Mai text hardcoded a components → sempre claus de traducció
- **Taules DB:** Categories i estats amb sistema de claus, mai text rígid

## 🎯 Patrons de Disseny
- **Server Components per defecte:** `'use client'` només quan cal interactivitat
- **Suspense boundaries:** Loading states per a dades asíncrones
- **Error boundaries:** Captura d'errors de renderitzat per mòdul
- **Optimistic updates:** UI respon immediatament, sync en segon pla

## 📐 Responsive Breakpoints
- **xs:** < 640px (mòbils petits, tècnics en camp)
- **sm:** 640-768px (mòbils grans)
- **md:** 768-1024px (tauletes)
- **lg:** 1024-1280px (portàtils, vista estàndard)
- **xl:** 1280-1536px (escriptori, command-center)
- **2xl:** > 1536px (pantalles grans, dashboards)

## ⚠️ Regles Crítiques
1. **Mai** estils inline → sempre Tailwind classes
2. **Mai** text hardcoded → sempre i18n keys
3. **Sempre** `aria-label` a elements interactius sense text visible
4. **Sempre** loading states per a operacions asíncrones
5. **Sempre** error states amb accions de recuperació
