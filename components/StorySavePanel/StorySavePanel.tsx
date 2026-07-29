'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import { clientApi } from '@/lib/api/clientApi';
import ConfirmModal from '@/components/ConfirmModal/ConfirmModal';
import styles from './StorySavePanel.module.css';

interface Props {
  storyId: string;
  ownerId: string;
}

export default function StorySavePanel({ storyId, ownerId }: Props) {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const isAuthReady = useAuthStore(s => s.isAuthReady);
  const setUser = useAuthStore(s => s.setUser);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isOwner = user?._id === ownerId;
  const isSaved = user?.savedStories?.includes(storyId) ?? false;

  const handleSaveClick = async () => {
    if (!isAuthReady || isOwner || isSaving) return;

    if (!isAuthenticated) {
      setIsConfirmOpen(true);
      return;
    }

    setErrorMessage(null);
    setIsSaving(true);

    try {
      const response = isSaved
        ? await clientApi.delete(`/users/me/saved/${storyId}`)
        : await clientApi.post(`/users/me/saved/${storyId}`);

      const updatedUser = response.data?.data;
      if (updatedUser) {
        setUser(updatedUser);
      }
    } catch {
      setErrorMessage('Не вдалося зберегти історію. Спробуйте ще раз.');
    } finally {
      setIsSaving(false);
    }
  };

  const returnPath = `/stories/${storyId}`;
  const encodedReturnPath = encodeURIComponent(returnPath);

  const handleConfirmRegister = () => {
    setIsConfirmOpen(false);
    router.push(`/auth/register?next=${encodedReturnPath}`);
  };

  const handleCancelLogin = () => {
    setIsConfirmOpen(false);
    router.push(`/auth/login?next=${encodedReturnPath}`);
  };

  const handleCloseModal = () => {
    setIsConfirmOpen(false);
  };

  const buttonText = isOwner
    ? 'Ваша історія'
    : isSaving
      ? 'Збереження...'
      : isSaved
        ? 'Збережено'
        : 'Зберегти';

  return (
    <aside className={styles.panel}>
      <h2 className={styles.title}>Збережіть собі історію</h2>
      <p className={styles.text}>
        Вона буде доступна у вашому профілі у розділі збережене
      </p>

      <button
        type="button"
        className={styles.button}
        onClick={handleSaveClick}
        disabled={!isAuthReady || isOwner || isSaving}
        aria-pressed={isSaved}
      >
        {buttonText}
      </button>

      {errorMessage && (
        <p className={styles.error} role="alert">
          {errorMessage}
        </p>
      )}

      {isConfirmOpen && (
        <ConfirmModal
          title="Помилка під час збереження"
          message="Щоб зберегти статтю вам треба увійти. Якщо ще немає облікового запису — зареєструйтесь."
          confirmButtonText="Зареєструватись"
          cancelButtonText="Увійти"
          onConfirm={handleConfirmRegister}
          onCancel={handleCancelLogin}
          onClose={handleCloseModal}
        />
      )}
    </aside>
  );
}
