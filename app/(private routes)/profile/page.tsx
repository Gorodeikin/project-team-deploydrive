'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/authStore';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isAuthReady } = useAuthStore();

  useEffect(() => {
    if (!isAuthReady) return;

    if (!isAuthenticated) {
      router.replace(`/auth/login?next=${encodeURIComponent('/profile')}`);
      return;
    }

    if (user?._id) {
      router.replace(`/travellers/${encodeURIComponent(user._id)}`);
    }
  }, [isAuthReady, isAuthenticated, user?._id, router]);

  if (isAuthReady && isAuthenticated && !user?._id) {
    return (
      <div className="container">
        <p role="alert">Не вдалося завантажити профіль.</p>
        <Link href="/">На головну</Link>
      </div>
    );
  }

  return (
    <div className="container">
      <div role="status" aria-live="polite">
        <p>Завантаження профілю...</p>
      </div>
    </div>
  );
}
