# [SKILL:UI_UX]

## Contexto de Activación
Esta skill se despierta cuando se requiere: diseño de componentes React, layouts, estilos, accesibilidad, responsividad, o cualquier aspecto de la interfaz de usuario.

## 🎨 Stack de UI
- **Framework:** Next.js 16+ (App Router, Server Components por defecto)
- **Estilos:** Tailwind CSS 4+ (utility-first, design tokens)
- **Componentes:** Radix UI (headless, accessible) + variants de clase (CVA)
- **Iconos:** Lucide React (consistent, lightweight)
- **Forms:** React Hook Form + Zod (validación type-safe)

## 📱 Filosofía de Diseño
- **Mobile-First:** Interfaz optimizada para operarios de campo (SAT)
- **Command-Center:** Vistas de escritorio expansivas para oficinas (ERP, CRM, Billing)
- **PWA:** Soporte offline con IndexedDB para modo de campo sin cobertura
- **Accesible:** WCAG 2.1 AA mínimo, navegación por teclado, ARIA labels

## 🧩 Estructura de Componentes (`/src/components/`)
```
ui/              → Componentes atómicos reutilizables (Button, Input, Modal, Table)
layout/          → Estructuras de página (Header, Sidebar, Shell, Breadcrumb)
modules/         → Componentes específicos de módulo (sat/, erp/, billing/, crm/, access/)
forms/           → Formularios complejos con validación Zod
charts/          → Visualizaciones de datos (kanban, dashboards, reports)
pwa/             → Componentes específicos PWA (offline indicator, sync status)
```

## 🌐 Multi-idioma (I18n)
- **Soporte:** Catalán y Castellano desde el día 1
- **Implementación:** Archivos JSON en `/src/locales/{ca,es}/`
- **Regla:** Nunca texto hardcoded en componentes → siempre claves de traducción
- **Tablas DB:** Categorías y estados con sistema de claves, nunca texto rígido

## 🎯 Patrones de Diseño
- **Server Components por defecto:** `'use client'` solo cuando se necesita interactividad
- **Suspense boundaries:** Loading states para datos asíncronos
- **Error boundaries:** Captura de errores de renderizado por módulo
- **Optimistic updates:** UI responde inmediatamente, sync en segundo plano

## 📐 Responsive Breakpoints
- **xs:** < 640px (móviles pequeños, técnicos en campo)
- **sm:** 640-768px (móviles grandes)
- **md:** 768-1024px (tabletas)
- **lg:** 1024-1280px (portátiles, vista estándar)
- **xl:** 1280-1536px (escritorio, command-center)
- **2xl:** > 1536px (pantallas grandes, dashboards)

## ⚠️ Reglas Críticas
1. **Nunca** estilos inline → siempre Tailwind classes
2. **Nunca** texto hardcoded → siempre i18n keys
3. **Siempre** `aria-label` en elementos interactivos sin texto visible
4. **Siempre** loading states para operaciones asíncronas
5. **Siempre** error states con acciones de recuperación
