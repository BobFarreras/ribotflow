# Security Policy

## 📋 Versiones Soportadas

| Versión | Soportada |
|---------|-----------|
| 0.1.x   | ✅ |

## 🐛 Reportar una Vulnerabilidad

Si descubres una vulnerabilidad de seguridad, por favor:

1. **NO** crees un issue público
2. Envía un email a: `security@ribotflow.com` (o contacta directamente con el maintainer)
3. Incluye:
   - Descripción de la vulnerabilidad
   - Pasos para reproducir
   - Impacto potencial
   - Sugerencia de fix (si la tienes)

Recibirás una respuesta en un máximo de **48 horas**.

## 🔒 Prácticas de Seguridad del Proyecto

- **Cookies**: `httpOnly`, `secure`, `sameSite: "lax"`
- **Sesiones**: JWT firmado, nunca modificable desde el cliente
- **Base de datos**: Todas las consultas filtran por `company_id` (multi-tenancy)
- **Inputs**: Validados con Zod en el servidor
- **Headers**: CSP, X-Frame-Options, X-Content-Type-Options
- **Dependencias**: Auditoría automática en CI (`pnpm audit`)
- **Secrets**: Nunca en el repositorio, siempre en variables de entorno

## 🛡️ OWASP Top 10

El proyecto implementa protecciones contra:
- Inyección SQL (Drizzle ORM parametrizado)
- Autenticación rota (Auth.js v5 + JWT)
- Exposición de datos sensibles (filtro company_id)
- XSS (React escapa por defecto + CSP)
- CSRF (sameSite cookies)
