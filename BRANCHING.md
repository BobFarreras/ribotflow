# RIBOTFLOW - Guía de Ramas

Este documento describe la estrategia de branching del proyecto.

## 🌿 Modelo: Git Flow Simplificado

```
main                    → Producción (estable, solo releases)
develop                 → Integración continua (último código estable)
features/*              → Nuevas funcionalidades
release/*               → Preparación de versión (testing, docs)
hotfix/*                → Correcciones urgentes de producción
```

## 📋 Convención de Nombres

| Tipo | Patrón | Ejemplo |
|------|--------|---------|
| Feature | `features/<descripción-corta>` | `features/invoice-module` |
| Release | `release/v<major>.<minor>.<patch>` | `release/v1.0.0` |
| Hotfix | `hotfix/<descripción-corta>` | `hotfix/company-id-filter` |

## 🔄 Flujo de Trabajo

### Nueva Funcionalidad

```bash
# 1. Crear rama desde develop
git checkout develop
git pull origin develop
git checkout -b features/nombre-feature

# 2. Trabajar y hacer commits
git add .
git commit -m "feat: add invoice creation"

# 3. Push y crear PR
git push origin features/nombre-feature
# Crear PR en GitHub: features/nombre-feature → develop

# 4. Tras merge, borrar rama
git branch -d features/nombre-feature
```

### Release

```bash
# 1. Crear rama de release desde develop
git checkout -b release/v1.0.0 develop

# 2. Actualizar CHANGELOG.md y version en package.json
# 3. Corregir bugs encontrados en testing
# 4. Merge a main y develop
git checkout main
git merge release/v1.0.0 --no-ff
git tag -a v1.0.0 -m "Release v1.0.0"
git checkout develop
git merge release/v1.0.0 --no-ff
```

### Hotfix

```bash
# 1. Crear rama desde main
git checkout -b hotfix/fix-critical-bug main

# 2. Corregir y commitear
git commit -m "fix: resolve critical company_id leak"

# 3. Merge a main y develop
git checkout main
git merge hotfix/fix-critical-bug --no-ff
git checkout develop
git merge hotfix/fix-critical-bug --no-ff
```

## 🚫 Reglas

- **Nunca** commitear directamente a `main`
- **Nunca** commitear directamente a `develop` (siempre vía PR)
- **Siempre** crear PR para features
- **Siempre** actualizar `CHANGELOG.md` en releases
- **Siempre** borrar ramas tras merge
