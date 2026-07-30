'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import StoryForm from '@/components/AddStoryForm/AddStoryForm';
import { useAuthStore } from '@/lib/store/authStore';
import css from './CreateStory.module.css';

export default function CreateStory() {
  const router = useRouter();
  const { isAuthenticated, isAuthReady } = useAuthStore();

  const returnPath = '/stories/create';
  const encodedReturnPath = encodeURIComponent(returnPath);

  useEffect(() => {
    if (!isAuthReady) return;
    if (!isAuthenticated) {
      router.replace(`/auth/login?next=${encodedReturnPath}`);
    }
  }, [isAuthReady, isAuthenticated, encodedReturnPath, router]);

  if (!isAuthReady) {
    return (
      <div className="container">
        <div role="status" aria-live="polite">
          <p>Завантаження...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="container">
      <h1 className={css.title}>Створити нову історію</h1>
      <StoryForm
        onSuccess={storyId => router.push(`/stories/${storyId}`)}
        onCancel={() => router.back()}
      />
    </div>
  );
}
