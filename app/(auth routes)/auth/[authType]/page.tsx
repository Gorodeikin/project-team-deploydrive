import AuthPage from '@/components/AuthPage/AuthPage';

type PageProps = {
  params: Promise<{
    authType: string;
  }>;
  searchParams: Promise<{
    next?: string | string[];
  }>;
};

const INTERNAL_ORIGIN = 'https://deploydrive.local';
const CONTROL_CHARS_PATTERN = /[\u0000-\u001F\u007F]/;

function sanitizeReturnPath(next: string | string[] | undefined): string {
  const value = Array.isArray(next) ? next[0] : next;

  if (typeof value !== 'string' || value.length === 0) return '/';
  if (CONTROL_CHARS_PATTERN.test(value)) return '/';

  let url: URL;
  try {
    url = new URL(value, INTERNAL_ORIGIN);
  } catch {
    return '/';
  }

  if (url.origin !== INTERNAL_ORIGIN) return '/';

  const normalizedPathname = url.pathname.replace(/\/+$/, '') || '/';
  if (
    normalizedPathname === '/auth/login' ||
    normalizedPathname === '/auth/register'
  ) {
    return '/';
  }

  return `${url.pathname}${url.search}${url.hash}`;
}

export default async function AuthPageRoute({
  params,
  searchParams,
}: PageProps) {
  const { authType } = await params;
  const { next } = await searchParams;
  const type = authType === 'login' ? 'login' : 'register';
  const returnPath = sanitizeReturnPath(next);

  return <AuthPage type={type} returnPath={returnPath} />;
}
