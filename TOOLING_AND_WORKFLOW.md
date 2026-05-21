# TOOLING_AND_WORKFLOW.md - Ecosistema de Calidad, CI/CD y Metodología Hermes

## 🐕 1. Calidad de Código Local (Husky & Lint-Staged)

Para evitar que código con errores de tipado, formato o tests fallidos llegue al repositorio remoto, se ejecutan obligatoriamente hooks de Git antes de cada commit.

### Pre-commit Hook

Ejecuta `npx lint-staged`.

**Configuración de `.lintstagedrc.json`:**

```json
{
  "src/**/*.{ts,tsx}": [
    "pnpm eslint --fix",
    "pnpm prettier --write",
    "pnpm vitest run --related --passWithNoTests"
  ]
}
```

### Pre-push Hook

Ejecuta `pnpm tsc --noEmit` para garantizar que no haya ningún error de TypeScript en todo el proyecto antes de subir el código.

---

## 🚀 2. Automatización Remota (GitHub Actions Pipelines)

El repositorio dispone de dos pipelines automatizadas en el entorno de CI/CD:

### Pipeline A: Validación de Calidad (`ci.yml`)

Se ejecuta automáticamente en cada Pull Request dirigida a `main` o `develop`.

1. Checkout del código e instalación de `pnpm`
2. Auditoría de seguridad de dependencias (`pnpm audit`)
3. Validación del linter y tipado estricto (`pnpm lint` + `pnpm tsc`)
4. Ejecución de la suite de tests unitarios y de integración (`pnpm test`)

### Pipeline B: Despliegue y Docker Build (`cd.yml`)

Se ejecuta automáticamente cuando se hace merge a la rama `main`.

1. Ejecución de tests y build de Next.js de producción
2. Generación de la imagen Docker optimizada con **Multi-stage builds** (<200MB)
3. Subida de la imagen al **GitHub Container Registry (GHCR)** con tag `:latest` + hash del commit
4. Imagen lista para clientes SaaS y Self-Hosted

---

## 🎯 3. Monitorización y Observabilidad (Sentry)

Sentry captura en tiempo real cualquier error en producción antes de que el cliente se dé cuenta:

- **Frontend:** Errores de renderizado o Hydration en Next.js
- **Backend:** Errores en Server Actions o rutas de la API

### Regla de oro para Self-Hosted

> Si la aplicación se ejecuta en modo `self_hosted`, los errores se redirigen al Sentry local del cliente o se desactivan completamente para proteger la privacidad de los datos de la empresa, según la configuración del archivo `.env`.

---

## 🧠 4. Memoria del Proyecto y Protocolos de Agentes

### A. MCP Engram (Model Context Protocol - Memory Core)

Este proyecto está optimizado para ser desarrollado en colaboración con agentes de IA utilizando **Engram**.

**Función:** Engram mantiene un índice de memoria semántica a largo plazo sobre las decisiones de arquitectura. Cada vez que un agente crea o modifica un servicio estructural (como la lógica de Veri*factu o los vectores del RAG), debe actualizar la memoria de Engram para que los siguientes agentes recuerden el contexto exacto sin necesidad de volver a leer todo el repositorio.

### B. Metodología Hermes (Desarrollo Proactivo Guiado por IA)

La metodología Hermes es el estándar de desarrollo que optimiza cómo los agentes de IA diseñan software en ciclos paralelos de forma asíncrona:

```
[ Especificación Declarativa ] ──> [ Agente Hermes ] ──> [ Generación Automática de Pruebas/Mocks ]
                                                                         │
[ Código Refinado Final ] <── [ Ejecución en Sandbox/Validación ] <─────┘
```

| Fase | Descripción |
|------|-------------|
| **Abstracción Declarativa** | No se pide código directamente. Primero se escribe la especificación o la interfaz pura a nivel de tipos (SDD) |
| **Generación Aislada en Sandbox** | El agente genera la funcionalidad en un archivo separado o rama aislada y genera inmediatamente los mocks de base de datos usando factories de test |
| **Feedback Loop Automatizado** | El agente utiliza su propia herramienta de ejecución de tests para probar el código 3-4 veces en segundo plano antes de presentar la solución final |

**Resultado:** Código que compila al 100% y respeta la separación de responsabilidades del `AGENTS.md`.
