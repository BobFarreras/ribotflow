# DESIGN.md - Sistema de Diseño de RIBOTFLOW

> Inspirado en Attio, Linear y Vercel Dashboard.
> Principios: limpio, funcional, moderno, accesible.

---

## 🎨 Filosofía de Diseño

| Principio | Descripción |
|-----------|-------------|
| **Claridad** | Cada elemento tiene un propósito. Sin decoración innecesaria. |
| **Jerarquía** | El ojo del usuario sigue un camino claro: título → acción → detalle. |
| **Consistencia** | Mismos patrones, mismos componentes, mismos comportamientos. |
| **Espacio** | El whitespace es diseño. Dar aire a los elementos. |
| **Feedback** | Cada acción tiene una respuesta visual inmediata. |

---

## 🌗 Modo Claro / Oscuro

El sistema usa **variables CSS** con `prefers-color-scheme` como base, con override manual del usuario.

### Modo Claro (Default)

```
Fondo:       #fafafa (gray-50)
Superficie:  #ffffff
Borde:       #e5e5e5 (gray-200)
Texto:       #171717 (gray-900)
Texto suave: #737373 (gray-500)
Acento:      #2563eb (blue-600)
```

### Modo Oscuro

```
Fondo:       #0a0a0a (gray-950)
Superficie:  #171717 (gray-900)
Borde:       #262626 (gray-800)
Texto:       #fafafa (gray-50)
Texto suave: #a3a3a3 (gray-400)
Acento:      #3b82f6 (blue-500)
```

---

## 🔤 Tipografía

### Fuente Principal: **Inter**
- Legible, profesional, optimizada para interfaces
- Pesos: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

### Escala Tipográfica

| Nombre | Tamaño | Peso | Uso |
|--------|--------|------|-----|
| `display` | 2.5rem / 40px | 700 | Títulos de página |
| `h1` | 1.875rem / 30px | 600 | Secciones principales |
| `h2` | 1.5rem / 24px | 600 | Subsecciones |
| `h3` | 1.25rem / 20px | 600 | Cards, modales |
| `body` | 0.875rem / 14px | 400 | Texto general |
| `small` | 0.75rem / 12px | 400 | Labels, hints |
| `caption` | 0.6875rem / 11px | 500 | Badges, tags |

### Line Heights
- Títulos: `1.2`
- Body: `1.5`
- Small: `1.4`

---

## 🎨 Paleta de Colores

### Neutros

| Token | Light | Dark | Uso |
|-------|-------|------|-----|
| `--bg` | `#fafafa` | `#0a0a0a` | Fondo de página |
| `--surface` | `#ffffff` | `#171717` | Cards, paneles |
| `--surface-hover` | `#f5f5f5` | `#1f1f1f` | Hover en superficies |
| `--border` | `#e5e5e5` | `#262626` | Bordes, separadores |
| `--border-strong` | `#d4d4d4` | `#404040` | Bordes activos/focus |
| `--text` | `#171717` | `#fafafa` | Texto principal |
| `--text-muted` | `#737373` | `#a3a3a3` | Texto secundario |
| `--text-inverse` | `#fafafa` | `#171717` | Texto sobre fondo oscuro |

### Semánticos

| Token | Light | Dark | Uso |
|-------|-------|------|-----|
| `--primary` | `#2563eb` | `#3b82f6` | Botones principales, links |
| `--primary-hover` | `#1d4ed8` | `#2563eb` | Hover primario |
| `--success` | `#16a34a` | `#22c55e` | Éxito, completado |
| `--warning` | `#ca8a04` | `#eab308` | Advertencia, pendiente |
| `--danger` | `#dc2626` | `#ef4444` | Error, eliminar |
| `--info` | `#0891b2` | `#06b6d4` | Información, help |

### Módulos (Badges)

| Módulo | Color | Token |
|--------|-------|-------|
| SAT | Azul | `--module-sat: #3b82f6` |
| ERP | Verde | `--module-erp: #22c55e` |
| Facturación | Ámbar | `--module-billing: #f59e0b` |
| CRM | Violeta | `--module-crm: #8b5cf6` |
| Control Acceso | Rojo | `--module-access: #ef4444` |
| Configuración | Gris | `--module-settings: #6b7280` |

---

## 📐 Espaciado

Sistema basado en **4px** (0.25rem).

| Token | Valor | Uso |
|-------|-------|-----|
| `space-1` | 0.25rem / 4px | Gap mínimo |
| `space-2` | 0.5rem / 8px | Padding inline, icon gap |
| `space-3` | 0.75rem / 12px | Padding botones pequeños |
| `space-4` | 1rem / 16px | Padding estándar, gap cards |
| `space-6` | 1.5rem / 24px | Secciones |
| `space-8` | 2rem / 32px | Layout padding |
| `space-12` | 3rem / 48px | Entre secciones |
| `space-16` | 4rem / 64px | Layout margin |

---

## 🔲 Bordes y Sombras

### Border Radius

| Token | Valor | Uso |
|-------|-------|-----|
| `radius-sm` | 0.375rem / 6px | Inputs, badges |
| `radius-md` | 0.5rem / 8px | Botones, cards |
| `radius-lg` | 0.75rem / 12px | Modales, dropdowns |
| `radius-xl` | 1rem / 16px | Contenedores grandes |
| `radius-full` | 9999px | Avatares, pills |

### Sombras (Modo Claro)

| Token | Valor | Uso |
|-------|-------|-----|
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Cards, inputs |
| `shadow-md` | `0 4px 6px -1px rgba(0,0,0,0.1)` | Dropdowns, popovers |
| `shadow-lg` | `0 10px 15px -3px rgba(0,0,0,0.1)` | Modales |
| `shadow-xl` | `0 20px 25px -5px rgba(0,0,0,0.1)` | Toasts, alerts |

### Sombras (Modo Oscuro)
- Mismos valores pero con `rgba(0,0,0,0.3)` para más contraste

---

## 🧩 Componentes Base

### Botones

| Variante | Estilo | Uso |
|----------|--------|-----|
| `primary` | Fondo primario, texto blanco | Acción principal |
| `secondary` | Borde, fondo transparente | Acción secundaria |
| `ghost` | Sin borde, hover sutil | Links, icon buttons |
| `danger` | Fondo rojo, texto blanco | Eliminar, acciones destructivas |

### Inputs

- Borde sutil (`--border`)
- Focus ring: `2px solid --primary` con `ring-offset`
- Altura: `2.5rem` (40px)
- Padding: `0.5rem 0.75rem`
- Border radius: `radius-sm`

### Cards

- Fondo: `--surface`
- Borde: `1px solid --border`
- Border radius: `radius-lg`
- Padding: `space-6` (1.5rem)
- Hover: `--surface-hover` + sombra sutil

### Tablas

- Header: fondo `--surface`, texto `--text-muted`, border-bottom
- Filas: hover `--surface-hover`
- Celdas: padding `space-3` vertical, `space-4` horizontal
- Border: `--border` entre filas

### Badges / Status

| Estado | Color | Fondo |
|--------|-------|-------|
| Activo | `--success` | `rgba(34,197,94,0.1)` |
| Pendiente | `--warning` | `rgba(234,179,8,0.1)` |
| Completado | `--primary` | `rgba(59,130,246,0.1)` |
| Cancelado | `--danger` | `rgba(239,68,68,0.1)` |

---

## ✨ Animaciones

### Filosofía
- **Sutiles**: No distraen, guían
- **Rápidas**: 150-300ms máximo
- **Consistentes**: Misma curva de easing en todo

### Duraciones

| Token | Valor | Uso |
|-------|-------|-----|
| `duration-fast` | 150ms | Hover, focus |
| `duration-normal` | 200ms | Transiciones UI |
| `duration-slow` | 300ms | Modales, page transitions |
| `duration-slower` | 500ms | Loading states |

### Easing

| Token | Valor | Uso |
|-------|-------|-----|
| `ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | Entrada |
| `ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Salida |
| `ease-default` | `cubic-bezier(0.4, 0, 0.2, 1)` | General |

### Iconos Animados
- Usar `motion` (Framer Motion) para micro-interacciones
- Hover en iconos: `scale(1.1)` + rotación sutil
- Loading: spinner con `animate-spin`
- Success: check con `animate-pulse` breve

---

## ♿ Accesibilidad

- **Contraste mínimo**: WCAG 2.1 AA (4.5:1 para texto normal, 3:1 para grande)
- **Focus visible**: Ring de 2px en todos los elementos interactivos
- **Tamaño mínimo de toque**: 44x44px (móvil)
- **ARIA labels**: En todos los icon buttons y elementos sin texto
- **Reduced motion**: Respetar `prefers-reduced-motion`

---

## 📱 Responsive

| Breakpoint | Ancho | Uso |
|------------|-------|-----|
| `sm` | 640px | Móviles grandes |
| `md` | 768px | Tabletas |
| `lg` | 1024px | Portátiles |
| `xl` | 1280px | Escritorio |
| `2xl` | 1536px | Pantallas grandes |

### Sidebar
- **Desktop**: Visible, 256px fijo
- **Tablet**: Colapsable, 64px (solo iconos)
- **Móvil**: Drawer overlay

---

## 🎯 Referencias Visuales

| Referencia | Qué tomar |
|------------|-----------|
| **Attio** | Tablas limpias, jerarquía visual, dark mode |
| **Linear** | Velocidad, atajos de teclado, micro-animaciones |
| **Vercel Dashboard** | Cards, métricas, layout grid |
| **Raycast** | Command palette, iconos, search-first |
