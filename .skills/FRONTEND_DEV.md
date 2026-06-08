# [SKILL:FRONTEND_DEV]

## Contexto de Activación
Esta skill se despierta cuando se requiere: desarrollo de componentes React, Server Components, Client Components, hooks personalizados, formularios, gestión de estado, o cualquier aspecto de la capa de presentación.

## 🎨 Stack de Frontend
- **Framework:** Next.js 16+ (App Router)
- **Runtime:** React 19
- **Estilos:** Tailwind CSS 4+ (utility-first)
- **Componentes:** Radix UI (headless, accessible)
- **Forms:** React Hook Form + Zod
- **Estado:** React state + Server Actions (no Redux necesario)

## 📐 Server Components vs Client Components

### Server Components (por defecto)
- No llevan `'use client'`
- Pueden hacer queries DB directamente
- Pueden llamar a Server Actions
- No pueden usar hooks (useState, useEffect)
- No pueden usar event handlers (onClick)
- Ideal para: layouts, páginas, fetch de datos, componentes estáticos

### Client Components (cuando se necesita interactividad)
- Llevan `'use client'` en la primera línea
- Pueden usar hooks, event handlers, browser APIs
- No pueden acceder a DB directamente
- Ideal para: formularios, botones, modales, gráficos interactivos

## 🧩 Patrones de Componentes

### Composición sobre Herencia
```typescript
// ✅ Bien: composición
<Card>
  <CardHeader><CardTitle>Título</CardTitle></CardHeader>
  <CardContent>Contenido</CardContent>
</Card>

// ❌ Mal: props booleanas excesivas
<Card variant="header" withTitle withContent showFooter />
```

### Server Action como handler de formulario
```typescript
// Client Component
export function CreateWorkOrderForm() {
  const form = useForm({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    const result = await createWorkOrder(data);
    if (result.error) form.setError("root", { message: result.error });
  }

  return <form onSubmit={form.handleSubmit(onSubmit)}>...</form>;
}
```

## 🪝 Hooks Personalizados

### Ubicación: `/src/hooks/`
```
hooks/
├── useSession.ts          → Acceso a sesión + rol
├── useCompany.ts          → Contexto de empresa actual
├── useToast.ts            → Notificaciones
├── sat/
│   ├── useWorkOrders.ts   → Fetch + mutate órdenes de trabajo
│   └── useSignature.ts    → Captura de firma biométrica
├── erp/
│   └── useStock.ts        → Gestión de stock en tiempo real
└── billing/
    └── useInvoice.ts      → Creación y preview de facturas
```

## 📱 Responsive Design
- **Mobile-First:** Escribir estilos para móvil primero, luego `md:`, `lg:`, `xl:`
- **Breakpoints:** xs <640, sm 640, md 768, lg 1024, xl 1280, 2xl 1536
- **Técnico en campo:** Interfaz grande, botones táctiles, alto contraste

## ⚠️ Reglas Críticas
1. **Nunca** `'use client'` sin justificación (interactividad necesaria)
2. **Nunca** pasar datos sensibles al cliente (tokens, contraseñas, company_id sin necesidad)
3. **Siempre** Server Components por defecto
4. **Siempre** loading states para datos asíncronos
5. **Siempre** error boundaries por módulo
6. **Siempre** validar inputs de formulario con Zod antes de enviar
