/**
 * Data de creació/modificació: 21/05/2026
 * Ruta: src/lib/errors/index.ts
 * Descripció: Classes d'error personalitzades per a gestió estructurada d'errors.
 */

export class UnauthorizedError extends Error {
  constructor(message = "No autoritzat") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Accés denegat") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends Error {
  constructor(message = "No trobat") {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public fields?: Record<string, string[]>
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

export class TenantIsolationError extends Error {
  constructor(message = "Violació d'aïllament de tenant") {
    super(message);
    this.name = "TenantIsolationError";
  }
}
