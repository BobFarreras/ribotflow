# Changelog

Todos los cambios notables en este proyecto se documentan en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y el proyecto sigue [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project structure with Clean Architecture
- Next.js 16.2.6 with App Router and proxy.ts
- Auth.js v5 with RBAC (OWNER, ADMIN, TECHNICIAN, OFFICE)
- Drizzle ORM schema with multi-tenancy (company_id)
- Docker multi-stage build (<200MB) + docker-compose
- GitHub Actions CI/CD pipelines
- Engram MCP for persistent agent memory
- Skills context for AI agents (9 skills)
- Login, Register, and Dashboard pages
- Zod environment validation
- i18n base files (Catalan/Spanish)
- Vitest testing setup with coverage
- ESLint + Prettier + lint-staged configuration
- GitHub issue and PR templates

[Unreleased]: https://github.com/BobFarreras/ribotflow/compare/main...develop
