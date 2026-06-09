// Narrow, safe error logging. Avoids dumping a raw third-party error object
// (which could carry request/response detail) into server logs. We log only a
// string message and, when present, a numeric status code.

/** Extract a safe message string from an unknown caught value. */
export function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Unknown error";
}

/** Extract a numeric status/code if the error carries one (e.g. SDK ApiError). */
export function errorStatus(err: unknown): number | undefined {
  const status = (err as { status?: unknown } | null)?.status;
  return typeof status === "number" ? status : undefined;
}

/** Log a single narrowed error line — never the raw error object. */
export function logError(scope: string, err: unknown): void {
  const status = errorStatus(err);
  const suffix = status !== undefined ? ` (status ${status})` : "";
  console.error(`[${scope}] ${errorMessage(err)}${suffix}`);
}
