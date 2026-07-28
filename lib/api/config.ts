function resolveApiOrigin(): string {
  const raw = (process.env.NEXT_PUBLIC_API_URL ?? '').trim();
  const withoutTrailingSlash = raw.replace(/\/+$/, '');

  if (!withoutTrailingSlash) {
    throw new Error('NEXT_PUBLIC_API_URL is missing or invalid');
  }

  let parsed: URL;
  try {
    parsed = new URL(withoutTrailingSlash);
  } catch {
    throw new Error('NEXT_PUBLIC_API_URL is missing or invalid');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('NEXT_PUBLIC_API_URL is missing or invalid');
  }

  return withoutTrailingSlash;
}

export const API_ORIGIN = resolveApiOrigin();
export const API_BASE_URL = `${API_ORIGIN}/api`;
export const API_TIMEOUT_MS = 30000;
