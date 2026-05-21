# TOOLING_AND_WORKFLOW.md - Ecosistema de Qualitat, CI/CD i Metodologia Hermes

## 🐕 1. Qualitat de Codi Local (Husky & Lint-Staged)

Per evitar que codi amb errors de tipat, format o tests fallits arribi al repositori remot, s'executen obligatòriament hooks de Git abans de cada commit.

### Pre-commit Hook

Executa `npx lint-staged`.

**Configuració de `.lintstagedrc.json`:**

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

Executa `pnpm tsc --noEmit` per garantir que no hi hagi cap error de TypeScript a tot el projecte abans de pujar el codi.

---

## 🚀 2. Automatització Remota (GitHub Actions Pipelines)

El repositori disposa de dues pipelines automatitzades en l'entorn de CI/CD:

### Pipeline A: Validació de Qualitat (`ci.yml`)

S'executa automàticament a cada Pull Request dirigida a `main` o `develop`.

1. Checkout del codi i instal·lació de `pnpm`
2. Auditoria de seguretat de dependències (`pnpm audit`)
3. Validació del linter i tipat rígid (`pnpm lint` + `pnpm tsc`)
4. Execució de la suite de tests unitaris i d'integració (`pnpm test`)

### Pipeline B: Desplegament i Docker Build (`cd.yml`)

S'executa automàticament quan es fa merge a la branca `main`.

1. Execució de tests i build de Next.js de producció
2. Generació de la imatge Docker optimitzada amb **Multi-stage builds** (<200MB)
3. Puja de la imatge al **GitHub Container Registry (GHCR)** amb tag `:latest` + hash del commit
4. Imatge llesta per a clients SaaS i Self-Hosted

---

## 🎯 3. Monitorització i Observabilitat (Sentry)

Sentry captura en temps real qualsevol error en producció abans que el client se n'adoni:

- **Frontend:** Errors de renderització o Hydration a Next.js
- **Backend:** Errors a Server Actions o rutes de l'API

### Regla d'or per a Self-Hosted

> Si l'aplicació s'executa en mode `self_hosted`, els errors es redirigeixen al Sentry local del client o es desactiven completament per protegir la privacitat de les dades de l'empresa, segons la configuració del fitxer `.env`.

---

## 🧠 4. Memòria del Projecte i Protocols d'Agents

### A. MCP Engram (Model Context Protocol - Memory Core)

Aquest projecte està optimitzat per ser desenvolupat en col·laboració amb agents de IA utilitzant **Engram**.

**Funció:** Engram manté un índex de memòria semàntica a llarg termini sobre les decisions d'arquitectura. Cada vegada que un agent crea o modifica un servei estructural (com la lògica de Veri*factu o els vectors del RAG), ha d'actualitzar la memòria d'Engram perquè els següents agents recordin el context exacte sense necessitat de tornar a llegir tot el repositori.

### B. Metodologia Hermes (Desenvolupament Proactiu Guiat per IA)

La metodologia Hermes és l'estàndard de desenvolupament que optimitza com els agents d'IA dissenyen programari en cicles paral·lels de forma asíncrona:

```
[ Especificació Declarativa ] ──> [ Agent Hermes ] ──> [ Generació Automàtica de Proves/Mocks ]
                                                                       │
[ Codi Refinat Final ] <── [ Execució en Sandbox/Validació ] <────────┘
```

| Fase | Descripció |
|------|------------|
| **Abstracció Declarativa** | No es demana codi directament. Primer s'escriu l'especificació o la interfície pura a nivell de tipus (SDD) |
| **Generació Aïllada en Sandbox** | L'agent genera la funcionalitat en un fitxer separat o branca aïllada i genera immediatament els mocks de base de dades utilitzant factories de test |
| **Feedback Loop Automatitzat** | L'agent utilitza la seva pròpia eina d'execució de tests per provar el codi 3-4 vegades en segon pla abans de presentar la solució final |

**Resultat:** Codi que compila al 100% i respecta la separació de responsabilitats de l'`AGENTS.md`.
