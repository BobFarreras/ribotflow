/**
 * Data de creació/modificació: 21/05/2026
 * Ruta: src/services/jobs/interface.ts
 * Descripció: Interfície abstracta per a la cua de tasques asíncrones.
 *             Permet intercanviar entre RedisQueue (Cloud) i PostgresQueue (Self-Hosted).
 */

export interface JobData {
  type: string;
  payload: Record<string, unknown>;
  companyId: string;
  priority?: "low" | "normal" | "high" | "critical";
}

export interface JobHandler {
  name: string;
  execute(data: JobData): Promise<void>;
}

export interface JobQueue {
  enqueue(job: JobData, options?: { delay?: number; attempts?: number }): Promise<string>;
  registerHandler(handler: JobHandler): void;
  start(): Promise<void>;
  stop(): Promise<void>;
}

export type QueueProvider = "redis" | "postgres";

export function getQueueProvider(): QueueProvider {
  const mode = process.env.NEXT_PUBLIC_APP_MODE;
  const hasRedis = !!process.env.REDIS_URL;

  if (mode === "self_hosted" || !hasRedis) {
    return "postgres";
  }

  return "redis";
}
