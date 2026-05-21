# [SKILL:ENGRAM_MCP]

## Contexto de Activación
Esta skill se despierta cuando se requiere: gestión de memoria persistente del proyecto, guardar decisiones de arquitectura, recuperar contexto de sesiones anteriores, o compartir conocimiento entre agentes IA.

## 🧠 Qué es Engram

Engram es un sistema de memoria persistente para agentes de IA coding. Usa SQLite + FTS5 para almacenar y recuperar contexto del proyecto sin consumir tokens de sesión.

## 📋 Cuándo Guardar Memoria

### ✅ GUARDAR SIEMPRE (auto-save obligatorio)

| Evento | Tipo | Ejemplo |
|--------|------|---------|
| **Decisión de arquitectura** | `architecture` | "Usar proxy.ts en vez de middleware.ts (Next.js 16)" |
| **Decisión de diseño DB** | `decision` | "company_id indexado en todas las tablas de negocio" |
| **Error encontrado + solución** | `bugfix` | "Drizzle pool timeout → aumentar idleTimeoutMillis" |
| **Nueva feature implementada** | `feature` | "Server Action createWorkOrder con validación Zod" |
| **Cambio de convención** | `convention` | "Comentarios en inglés, docs en castellano" |
| **Patrón reutilizable** | `pattern` | "Template Server Action con auth + role check" |
| **Dependencia añadida/eliminada** | `dependency` | "Añadido bcryptjs para hash de passwords" |
| **Variable de entorno nueva** | `config` | "NEXT_PUBLIC_APP_MODE determina modo cloud/self-hosted" |

### ❌ NO GUARDAR (ruido innecesario)

- Cambios de formato (prettier, orden de imports)
- Renombrar variables siguiendo convención existente
- Commits rutinarios sin impacto arquitectónico
- Texto de documentación sin decisiones asociadas

## 📝 Formato de Guardado

```bash
engram save "<título conciso>" "<descripción: qué, por qué, dónde>" --type <tipo> --project ribotflow
```

### Ejemplos

```bash
# Decisión de arquitectura
engram save "Proxy over middleware" "Next.js 16 deprecated middleware.ts, renamed to proxy.ts. Function export changed from middleware() to proxy()." --type architecture --project ribotflow

# Bugfix
engram save "Drizzle connection pool fix" "Production timeout due to low idleTimeoutMillis. Increased from 10000 to 30000 in src/db/index.ts." --type bugfix --project ribotflow

# Feature
engram save "Veri*factu chaining" "Implemented hash chaining for invoice records. Each record includes hash of previous record for immutability. Located in src/services/billing/verifactu.ts." --type feature --project ribotflow
```

## 🔍 Cómo Recuperar Contexto

### Búsqueda por query
```bash
engram search "multi-tenancy" --project ribotflow
```

### Timeline de una memoria
```bash
engram timeline <observation_id>
```

### Contexto reciente de sesión
```bash
engram context ribotflow
```

## 🔄 Flujo de Sesión

```
[ Agente trabaja ] → [ Decisión/Error/Feature ] → [ mem_save inmediato ]
                                                      ↓
[ Sigue trabajando ] → [ Otra decisión ] → [ mem_save inmediato ]
                                                      ↓
[ Fin de tarea ] → [ mem_session_summary resumen global ]
```

> **Regla:** Si otro agente futuro necesitaría saber esto para no repetir el mismo error o tomar la misma decisión → **GUARDAR**.

## 📊 Tipos de Memoria

| Tipo | Uso |
|------|-----|
| `architecture` | Decisiones de diseño estructural |
| `decision` | Elecciones técnicas específicas |
| `bugfix` | Errores encontrados y su solución |
| `feature` | Funcionalidades implementadas |
| `convention` | Cambios en convenciones de código |
| `pattern` | Patrones reutilizables descubiertos |
| `dependency` | Cambios en dependencias del proyecto |
| `config` | Variables de entorno y configuración |

## ⚠️ Reglas Críticas
1. **Siempre** guardar inmediatamente después de una decisión importante
2. **Siempre** incluir qué, por qué y dónde en la descripción
3. **Siempre** usar `--project ribotflow`
4. **Nunca** guardar cambios triviales (formato, renombrados)
5. **Nunca** guardar datos sensibles (contraseñas, tokens)
