'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import Image from 'next/image';
import css from './AddStoryForm.module.css';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createStory, fetchCategories } from '@/lib/api/api';
import type { Category, CreateStoryResponse } from '@/types/story';
import { useStoryDraft, initialDraft } from '@/lib/store/storyStore';
import { Modal } from '@/components/CreateStoryErrorModal/Modal';
import { useFormik } from 'formik';
import * as Yup from 'yup';

interface StoryFormProps {
  onSuccess: (id: string) => void;
  onCancel: () => void;
}

function autoResizeTextarea(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
}

const validationSchema = Yup.object({
  storyImage: Yup.mixed()
    .required('Додайте фото до історії')
    .test('fileType', 'Файл має бути у форматі JPEG, PNG або WEBP', value => {
      if (!value) return false;
      const file = value as File;
      return ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
    })
    .test('fileSize', 'Файл завеликий — максимум 2MB', value => {
      if (!value) return false;
      const file = value as File;
      return file.size <= 2 * 1024 * 1024;
    }),

  title: Yup.string()
    .trim()
    .max(80, 'Максимум 80 символів')
    .required('Вкажіть заголовок'),

  categoryId: Yup.string().required('Оберіть категорію'),

  body: Yup.string()
    .trim()
    .max(2500, 'Опис занадто великий — максимум 2500 символів')
    .required('Додайте опис історії'),
});

export default function StoryForm({ onSuccess, onCancel }: StoryFormProps) {
  const qc = useQueryClient();
  const { draft, setDraft, clearDraft } = useStoryDraft();
  const [errorOpen, setErrorOpen] = useState(false);

  const bodyRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    autoResizeTextarea(bodyRef.current);
  }, []);

  const { data: categories, isLoading: isCategoriesLoading } = useQuery<
    Category[]
  >({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000,
  });

  // Tracks in-flight submission synchronously (unlike mutation.isPending,
  // which only updates after a re-render) so two 'submit' events dispatched
  // back-to-back in the same tick can't both slip past the guard below.
  const isSubmittingRef = useRef(false);

  const mutation = useMutation({
    mutationFn: (fd: FormData) => createStory(fd),
    onSuccess: (data: CreateStoryResponse) => {
      isSubmittingRef.current = false;
      qc.invalidateQueries({ queryKey: ['myStories'] });
      clearDraft();
      onSuccess(data.id);
    },
    onError: () => {
      isSubmittingRef.current = false;
      setErrorOpen(true);
    },
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const formik = useFormik({
    initialValues: {
      storyImage: draft.storyImage ?? null,
      title: draft.title ?? initialDraft.title,
      categoryId: draft.categoryId ?? initialDraft.categoryId,
      body: draft.body ?? initialDraft.body,
    },
    enableReinitialize: false,
    validateOnMount: true,
    validationSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: values => {
      if (isSubmittingRef.current) return;
      if (!values.storyImage) return;

      const fd = new FormData();

      fd.append('img', values.storyImage);
      fd.append('title', values.title.trim());
      fd.append('category', values.categoryId);
      fd.append('article', values.body.trim());

      isSubmittingRef.current = true;
      mutation.mutate(fd);
    },
  });

  const previewUrl = useMemo(() => {
    if (!formik.values.storyImage) return null;
    return URL.createObjectURL(formik.values.storyImage);
  }, [formik.values.storyImage]);

  useEffect(() => {
    if (!previewUrl) return;

    const url = previewUrl;

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [previewUrl]);

  const isSaveDisabled = !formik.isValid || !formik.dirty || mutation.isPending;

  function updateDraft(update: Partial<typeof draft>) {
    setTimeout(() => {
      setDraft(update);
    }, 0);
  }

  const titleErrorId = 'title-error';
  const categoryErrorId = 'categoryId-error';
  const bodyErrorId = 'body-error';
  const storyImageErrorId = 'storyImage-error';

  return (
    <form className={css.form} onSubmit={formik.handleSubmit} noValidate>
      {/* Обкладинка */}
      <div className={css.formGroup}>
        <label className={css.label} htmlFor="storyImage">
          Обкладинка статті
        </label>

        <div className={css.coverRow}>
          <div className={css.coverPreview}>
            {previewUrl ? (
              <Image
                src={previewUrl}
                alt="Попередній перегляд обкладинки історії"
                width={280}
                height={160}
                unoptimized
                className={css.coverImg}
              />
            ) : (
              <Image
                src="/images/avatar.webp.webp"
                alt="Стандартне зображення обкладинки історії"
                width={280}
                height={160}
                className={css.coverImg}
              />
            )}
          </div>

          <button
            type="button"
            className={css.uploadBtn}
            onClick={() => fileInputRef.current?.click()}
          >
            Завантажити фото
          </button>

          <input
            ref={fileInputRef}
            id="storyImage"
            name="storyImage"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className={css.fileHidden}
            onChange={e => {
              const file = e.target.files?.[0] ?? null;
              formik.setFieldValue('storyImage', file);
              updateDraft({ storyImage: file });
            }}
            onBlur={formik.handleBlur}
            aria-invalid={
              formik.touched.storyImage && !!formik.errors.storyImage
            }
            aria-describedby={storyImageErrorId}
          />
        </div>

        {formik.touched.storyImage && formik.errors.storyImage && (
          <span id={storyImageErrorId} className={css.error}>
            {formik.errors.storyImage as string}
          </span>
        )}
      </div>

      {/* Заголовок */}
      <div className={css.formGroup}>
        <label htmlFor="title" className={css.label}>
          Заголовок
        </label>
        <input
          id="title"
          name="title"
          className={css.input}
          placeholder="Введіть заголовок"
          value={formik.values.title}
          onChange={e => {
            formik.handleChange(e);
            updateDraft({ title: e.target.value });
          }}
          onBlur={formik.handleBlur}
          required
          maxLength={80}
          aria-invalid={formik.touched.title && !!formik.errors.title}
          aria-describedby={titleErrorId}
        />
        {formik.touched.title && formik.errors.title && (
          <span id={titleErrorId} className={css.error}>
            {formik.errors.title}
          </span>
        )}
      </div>

      {/* Категорії */}
      <div className={css.formGroup}>
        <label htmlFor="categoryId" className={css.label}>
          Категорія
        </label>

        <select
          id="categoryId"
          name="categoryId"
          className={css.select}
          disabled={isCategoriesLoading}
          value={formik.values.categoryId}
          onChange={e => {
            formik.handleChange(e);
            updateDraft({ categoryId: e.target.value });
          }}
          onBlur={formik.handleBlur}
          required
          aria-invalid={formik.touched.categoryId && !!formik.errors.categoryId}
          aria-describedby={categoryErrorId}
        >
          <option value="" disabled>
            {isCategoriesLoading ? 'Завантаження...' : 'Категорія'}
          </option>
          {(categories ?? []).map(c => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {formik.touched.categoryId && formik.errors.categoryId && (
          <span id={categoryErrorId} className={css.error}>
            {formik.errors.categoryId}
          </span>
        )}
      </div>

      {/* Історія */}
      <div className={css.formGroup}>
        <label htmlFor="body" className={css.label}>
          Текст історії
        </label>
        <textarea
          ref={bodyRef}
          id="body"
          name="body"
          className={css.textarea}
          placeholder="Ваша історія тут"
          value={formik.values.body}
          rows={1}
          maxLength={2500}
          onChange={e => {
            formik.handleChange(e);
            updateDraft({ body: e.target.value });
            autoResizeTextarea(bodyRef.current);
          }}
          onBlur={formik.handleBlur}
          aria-invalid={formik.touched.body && !!formik.errors.body}
          aria-describedby={bodyErrorId}
        />
        {formik.touched.body && formik.errors.body && (
          <span id={bodyErrorId} className={css.error}>
            {formik.errors.body}
          </span>
        )}
      </div>

      {/* Дії */}
      <div className={css.actionsWrap}>
        <button
          type="submit"
          className={css.submitBtn}
          disabled={isSaveDisabled}
        >
          {mutation.isPending ? 'Збереження...' : 'Зберегти'}
        </button>

        <button type="button" className={css.cancelBtn} onClick={onCancel}>
          Відмінити
        </button>
      </div>

      <Modal
        open={errorOpen}
        title="Помилка збереження"
        description="Спробуйте ще раз пізніше."
        onClose={() => setErrorOpen(false)}
      />
    </form>
  );
}
