/**
 * DEV-ONLY FALLBACK. Production deployments MUST set a real JWT_SECRET
 * env var — this fallback exists only so the app boots in this sandbox
 * without extra configuration. A hardcoded fallback secret in a real
 * deploy is a full authentication bypass; do not ship this as-is.
 */
export const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-only-insecure-secret-change-me';
export const JWT_EXPIRES_IN = '1h';
