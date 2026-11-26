/**
 * Every data function returns a Result instead of throwing.
 * The UI then decides per section: show the data, or show a retry button.
 */

// 📌 READ-ME: `ok: false` carries NO error message on purpose. The real
// database error is logged on the server (see `failed`), and the browser only
// learns "this part failed". Sending raw DB errors to the UI can leak table
// names, policy names or SQL details.
export type Result<T> = { ok: true; data: T } | { ok: false };

export function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

export function failed(where: string, error: { message: string }): { ok: false } {
  console.error(`[data] ${where} failed:`, error.message);
  return { ok: false };
}
