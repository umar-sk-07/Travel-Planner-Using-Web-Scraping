/**
 * Next.js instrumentation hook.
 *
 * The BullMQ worker now runs as a separate backend service (backend/worker.ts).
 * The frontend only enqueues jobs — it does NOT process them here.
 *
 * This file is intentionally minimal.
 */
export const register = async () => {
  // Worker processing is handled by the standalone backend container.
  // See backend/worker.ts and docker-compose.yml.
};
