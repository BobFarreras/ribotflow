# [SKILL:UI_UX]

## Contexto de Activación
Esta skill se despierta cuando se requiere: diseño de componentes React, layouts, estilos, accesibilidad, responsividad, dark/light mode, o cualquier aspecto de la interfaz de usuario.

## 📐 Sistema de Diseño

**Referencia principal:** `DESIGN.md` en la raíz del proyecto.

Todos los tokens de color, tipografía, espaciado, bordes, sombras y animaciones están definidos en:
- **CSS Variables:** `src/styles/globals.css`
- **Documentación:** `DESIGN.md`

### Principios
- **Claridad:** Cada elemento tiene un propósito
- **Jerarquía:** Título → acción → detalle
- **Consistencia:** Mismos patrones en toda la app
- **Espacio:** El whitespace es diseño
- **Feedback:** Cada acción tiene respuesta visual

## 🎨 Stack de UI
- **Framework:** Next.js 16+ (App Router, Server Components por defecto)
- **Estilos:** Tailwind CSS 4+ (utility-first, design tokens en CSS variables)
- **Componentes:** Radix UI (headless, accessible) + variants de clase (CVA)
- **Iconos:** Lucide React (consistent, lightweight, animables)
- **Animaciones:** Motion (Framer Motion) para micro-interacciones
- **Forms:** React Hook Form + Zod (validación type-safe)
- **Utils:** `cn()` de `@/lib/utils/cn` para clases dinámicas

## 🌗 Dark / Light Mode

Implementado con **variables CSS** en `:root` (light) y `.dark` (dark).

```css
/* Uso en componentes */
<div className="bg-[var(--bg)] text-[var(--text)]">
  <div className="bg-[var(--surface)] border border-[var(--border)]">
    Surface card
  </div>
</div>
```

### Clases de utilidad disponibles
- `.surface` → Card con fondo, borde y sombra
- `.surface-hover` → Hover en superficies
- `.text-muted` → Texto secundario
- `.badge-success`, `.badge-warning`, `.badge-danger`, `.badge-info`

## 📱 Filosofía de Diseño
- **Mobile-First:** Interfaz optimizada para operarios de campo (SAT)
- **Command-Center:** Vistas de escritorio expansivas para oficinas
- **PWA:** Soporte offline con IndexedDB
- **Accesible:** WCAG 2.1 AA mínimo, navegación por teclado, ARIA labels

## 🧩 Estructura de Componentes (`/src/components/`)
```
ui/              → Componentes atómicos (Button, Input, Modal, Table, Badge)
layout/          → Estructuras (Header, Sidebar, Shell, Breadcrumb)
modules/         → Componentes por módulo (sat/, erp/, billing/, crm/, access/)
forms/           → Formularios con validación Zod
charts/          → Visualizaciones de datos (kanban, dashboards, reports)
pwa/             → Componentes PWA (offline indicator, sync status)
theme/           → Theme toggle, dark mode provider
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

## ✨ Animaciones

### Filosofía
- **Sutiles:** No distraen, guían
- **Rápidas:** 150-300ms máximo
- **Consistentes:** Misma curva de easing

### Uso de Motion
```typescript
import { motion } from "motion/react";

<motion.div
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.2, ease: "easeOut" }}
>
  Content
</motion.div>
```

### Iconos animados
```typescript
import { motion } from "motion/react";
import { Settings } from "lucide-react";

<motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
  <Settings className="w-5 h-5" />
</motion.div>
```

## 📐 Responsive Breakpoints
- **xs:** < 640px (móviles pequeños)
- **sm:** 640-768px (móviles grandes)
- **md:** 768-1024px (tabletas)
- **lg:** 1024-1280px (portátiles)
- **xl:** 1280-1536px (escritorio)
- **2xl:** > 1536px (pantallas grandes)

## ⚠️ Reglas Críticas
1. **Nunca** estilos inline → siempre Tailwind classes o CSS variables
2. **Nunca** texto hardcoded → siempre i18n keys
3. **Siempre** `aria-label` en elementos interactivos sin texto visible
4. **Siempre** loading states para operaciones asíncronas
5. **Siempre** error states con acciones de recuperación
6. **Siempre** respetar `prefers-reduced-motion`
7. **Siempre** usar `cn()` para clases condicionales
