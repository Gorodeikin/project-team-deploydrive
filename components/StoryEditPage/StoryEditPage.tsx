'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { AxiosError } from 'axios';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/apiClient';
import { useAuthStore } from '@/lib/store/authStore';
import styles from './StoryEditPage.module.css';

interface Props {
  storyId: string;
}

interface EditableStory {
  _id: string;
  title: string;
  article: string;
  category: string;
  ownerId: string;
  img: string;
}

interface CategoryOption {
  _id: string;
  name: string;
}

type FieldErrors = Partial<
  Record<'title' | 'article' | 'category' | 'image', string>
>;

const TITLE_MAX = 80;
const ARTICLE_MAX = 2500;
const IMAGE_MAX_BYTES = 2 * 1024 * 1024;

function validateFields(values: {
  title: string;
  article: string;
  category: string;
  imageFile: File | null;
}): FieldErrors {
  const errors: FieldErrors = {};

  const trimmedTitle = values.title.trim();
  if (!trimmedTitle) {
    errors.title = 'Введіть заголовок історії.';
  } else if (trimmedTitle.length > TITLE_MAX) {
    errors.title = 'Заголовок не може перевищувати 80 символів.';
  }

  const trimmedArticle = values.article.trim();
  if (!trimmedArticle) {
    errors.article = 'Введіть текст історії.';
  } else if (trimmedArticle.length > ARTICLE_MAX) {
    errors.article = 'Текст не може перевищувати 2500 символів.';
  }

  if (!values.category) {
    errors.category = 'Оберіть категорію.';
  }

  if (values.imageFile) {
    if (!values.imageFile.type.startsWith('image/')) {
      errors.image = 'Оберіть файл зображення.';
    } else if (values.imageFile.size > IMAGE_MAX_BYTES) {
      errors.image = 'Розмір зображення не може перевищувати 2 МБ.';
    }
  }

  return errors;
}

export default function StoryEditPage({ storyId }: Props) {
  const router = useRouter();
  const { user, isAuthenticated, isAuthReady } = useAuthStore();

  const returnPath = `/stories/edit/${storyId}`;
  const encodedReturnPath = encodeURIComponent(returnPath);

  useEffect(() => {
    if (!isAuthReady) return;
    if (!isAuthenticated) {
      router.replace(`/auth/login?next=${encodedReturnPath}`);
    }
  }, [isAuthReady, isAuthenticated, encodedReturnPath, router]);

  const queryEnabled = isAuthReady && isAuthenticated && !!user && !!storyId;

  const storyQuery = useQuery({
    queryKey: ['story-edit', storyId],
    queryFn: async () => {
      const res = await apiClient.get(`/stories/${storyId}`);
      return res.data?.data as EditableStory;
    },
    enabled: queryEnabled,
    retry: false,
  });

  const categoriesQuery = useQuery({
    queryKey: ['story-edit-categories'],
    queryFn: async () => {
      const res = await apiClient.get('/categories');
      return (res.data?.data ?? []) as CategoryOption[];
    },
    enabled: queryEnabled,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const isOwner =
    !!user && !!storyQuery.data && user._id === storyQuery.data.ownerId;

  const [title, setTitle] = useState('');
  const [article, setArticle] = useState('');
  const [category, setCategory] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const titleRef = useRef<HTMLInputElement>(null);
  const articleRef = useRef<HTMLTextAreaElement>(null);
  const categoryRef = useRef<HTMLSelectElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Initialize the form fields exactly once from the loaded story, using the
  // React-recommended "adjusting state during render" pattern instead of an
  // effect, so a later refetch never overwrites the user's in-progress edits.
  const [initializedStoryId, setInitializedStoryId] = useState<string | null>(
    null
  );
  if (
    isOwner &&
    storyQuery.data &&
    initializedStoryId !== storyQuery.data._id
  ) {
    setInitializedStoryId(storyQuery.data._id);
    setTitle(storyQuery.data.title);
    setArticle(storyQuery.data.article);
    setCategory(storyQuery.data.category);
  }

  const previewUrl = useMemo(() => {
    if (!imageFile) return null;
    return URL.createObjectURL(imageFile);
  }, [imageFile]);

  useEffect(() => {
    if (!previewUrl) return;
    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Tracks in-flight submission synchronously (unlike updateMutation.isPending,
  // which only updates after a re-render) so two 'submit' events dispatched
  // back-to-back in the same tick can't both slip past the guard below.
  const isSubmittingRef = useRef(false);

  const updateMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await apiClient.patch(`/stories/${storyId}`, formData);
      return res.data?.data as EditableStory | undefined;
    },
    onSuccess: updated => {
      isSubmittingRef.current = false;
      if (!updated?._id) return;
      router.replace(`/stories/${storyId}`);
      router.refresh();
    },
    onError: () => {
      isSubmittingRef.current = false;
      console.error('Failed to update story');
      setApiError('Не вдалося оновити історію. Спробуйте ще раз.');
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmittingRef.current || updateMutation.isPending) return;

    setApiError(null);

    const errors = validateFields({ title, article, category, imageFile });
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      if (errors.title) titleRef.current?.focus();
      else if (errors.article) articleRef.current?.focus();
      else if (errors.category) categoryRef.current?.focus();
      else if (errors.image) imageInputRef.current?.focus();
      return;
    }

    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('article', article.trim());
    formData.append('category', category);
    if (imageFile) {
      formData.append('img', imageFile);
    }

    isSubmittingRef.current = true;
    updateMutation.mutate(formData);
  };

  // === auth initialization ===
  if (!isAuthReady) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.state} role="status" aria-live="polite">
            <p className={styles.stateText}>Завантаження...</p>
          </div>
        </div>
      </div>
    );
  }

  // === unauthenticated redirect in progress ===
  if (!isAuthenticated) {
    return null;
  }

  // === story / categories loading ===
  if (storyQuery.isLoading || categoriesQuery.isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.state} role="status" aria-live="polite">
            <p className={styles.stateText}>Завантаження історії...</p>
          </div>
        </div>
      </div>
    );
  }

  // === story not found ===
  const storyError = storyQuery.error as AxiosError | null;
  if (storyQuery.isError && storyError?.response?.status === 404) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.state}>
            <h1 className={styles.stateTitle}>Історію не знайдено</h1>
            <p className={styles.stateText}>
              Можливо, її було видалено або адресу вказано неправильно.
            </p>
            <Link href="/stories" className={styles.submitButton}>
              До всіх історій
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // === generic load error ===
  if (storyQuery.isError || categoriesQuery.isError) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.state} role="alert">
            <h1 className={styles.stateTitle}>Не вдалося завантажити дані</h1>
            <p className={styles.stateText}>
              Спробуйте оновити сторінку або повторити спробу пізніше.
            </p>
            <button
              type="button"
              className={styles.submitButton}
              onClick={() => {
                storyQuery.refetch();
                categoriesQuery.refetch();
              }}
            >
              Спробувати ще раз
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!storyQuery.data) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.state} role="status" aria-live="polite">
            <p className={styles.stateText}>Завантаження історії...</p>
          </div>
        </div>
      </div>
    );
  }

  // === non-owner access denied ===
  if (!isOwner) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.state}>
            <h1 className={styles.stateTitle}>Редагування недоступне</h1>
            <p className={styles.stateText}>
              Ви можете редагувати лише власні історії.
            </p>
            <Link href={`/stories/${storyId}`} className={styles.submitButton}>
              Повернутися до історії
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const categories = categoriesQuery.data ?? [];
  const displayedImage = previewUrl ?? storyQuery.data.img;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.heading}>Редагування історії</h1>
        <p className={styles.description}>
          Змініть заголовок, текст, категорію або зображення вашої історії.
        </p>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <label htmlFor="edit-title" className={styles.label}>
              Заголовок
            </label>
            <input
              ref={titleRef}
              id="edit-title"
              name="title"
              type="text"
              className={styles.input}
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              maxLength={TITLE_MAX}
              autoComplete="off"
              aria-invalid={!!fieldErrors.title}
              aria-describedby="edit-title-hint edit-title-error"
            />
            <div className={styles.hint} id="edit-title-hint">
              <span>
                {title.length}/{TITLE_MAX}
              </span>
            </div>
            {fieldErrors.title && (
              <span
                id="edit-title-error"
                className={styles.fieldError}
                role="alert"
              >
                {fieldErrors.title}
              </span>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="edit-article" className={styles.label}>
              Текст історії
            </label>
            <textarea
              ref={articleRef}
              id="edit-article"
              name="article"
              className={styles.textarea}
              value={article}
              onChange={e => setArticle(e.target.value)}
              required
              maxLength={ARTICLE_MAX}
              aria-invalid={!!fieldErrors.article}
              aria-describedby="edit-article-hint edit-article-error"
            />
            <div className={styles.hint} id="edit-article-hint">
              <span>
                {article.length}/{ARTICLE_MAX}
              </span>
            </div>
            {fieldErrors.article && (
              <span
                id="edit-article-error"
                className={styles.fieldError}
                role="alert"
              >
                {fieldErrors.article}
              </span>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="edit-category" className={styles.label}>
              Категорія
            </label>
            <select
              ref={categoryRef}
              id="edit-category"
              name="category"
              className={styles.select}
              value={category}
              onChange={e => setCategory(e.target.value)}
              required
              aria-invalid={!!fieldErrors.category}
              aria-describedby="edit-category-error"
            >
              <option value="" disabled>
                Оберіть категорію
              </option>
              {categories.map(c => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
            {fieldErrors.category && (
              <span
                id="edit-category-error"
                className={styles.fieldError}
                role="alert"
              >
                {fieldErrors.category}
              </span>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="edit-image" className={styles.label}>
              Нове зображення
            </label>

            {displayedImage && (
              <div className={styles.imagePreview}>
                <Image
                  src={displayedImage}
                  alt="Попередній перегляд зображення історії"
                  fill
                  unoptimized={!!previewUrl}
                  className={styles.image}
                  sizes="(max-width: 768px) 100vw, 880px"
                />
              </div>
            )}

            <input
              ref={imageInputRef}
              id="edit-image"
              name="img"
              type="file"
              accept="image/*"
              className={styles.input}
              onChange={handleImageChange}
              aria-invalid={!!fieldErrors.image}
              aria-describedby="edit-image-hint edit-image-error"
            />
            <p className={styles.hint} id="edit-image-hint">
              Залиште поле порожнім, щоб зберегти поточне зображення.
            </p>
            {fieldErrors.image && (
              <span
                id="edit-image-error"
                className={styles.fieldError}
                role="alert"
              >
                {fieldErrors.image}
              </span>
            )}
          </div>

          {apiError && (
            <p className={styles.apiError} role="alert">
              {apiError}
            </p>
          )}

          <div className={styles.actions}>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Збереження...' : 'Зберегти зміни'}
            </button>
            <Link
              href={`/stories/${storyId}`}
              className={styles.cancelButton}
              aria-disabled={updateMutation.isPending}
              onClick={e => {
                if (updateMutation.isPending) e.preventDefault();
              }}
            >
              Скасувати
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
