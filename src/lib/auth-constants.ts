// Zod-free on purpose: client forms import from here, and pulling in
// `@/lib/validation` would ship every schema to the browser. Server Actions
// ('use server') can only export functions, so shared values live here.

export const PASSWORD_MIN = 8;

export const RESET_LINK_EXPIRED = 'That reset link has expired or was already used. Request a new one.';
