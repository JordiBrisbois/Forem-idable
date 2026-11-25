export async function register() {
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return;
  }

  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { assertServerEnv } = await import("@/config/env");
    assertServerEnv();

    // Keeps the local Forem offers mirror fresh; search reads only that mirror.
    const { startOffersSyncWorker } = await import("@/lib/server/offers/worker");
    startOffersSyncWorker();
  }
}
