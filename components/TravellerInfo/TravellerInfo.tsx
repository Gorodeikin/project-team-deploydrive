'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/api/apiClient';
import type { User } from '@/types/user';
import css from './TravellerInfo.module.css';

interface TravellerInfoProps {
  traveller: {
    name: string;
    photo: string;
    info: string;
  };
  travellerId: string;
  canEditProfile: boolean;
  onAvatarUpdated: (updatedUser: User) => void;
  onProfileUpdated: (updatedUser: User) => void;
}

type UpdateAvatarResponse = {
  status: number;
  message: string;
  data: User;
};

type UpdateProfileResponse = {
  status: number;
  message: string;
  data: User;
};

const ALLOWED_AVATAR_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_AVATAR_BYTES = 500 * 1024;

const NAME_MAX = 32;
const DESCRIPTION_MAX = 150;

export default function TravellerInfo({
  traveller,
  travellerId,
  canEditProfile,
  onAvatarUpdated,
  onProfileUpdated,
}: TravellerInfoProps) {
  // Shared upload/save state and refs -- declared before any handler that
  // reads them, since avatar and profile-details saving must mutually
  // exclude each other (only one of the two PATCH requests may be in
  // flight at a time).
  const [isUploading, setIsUploading] = useState(false);
  const uploadInProgressRef = useRef(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const profileSaveInProgressRef = useRef(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleEditClick = () => {
    if (
      isUploading ||
      uploadInProgressRef.current ||
      isSavingProfile ||
      profileSaveInProgressRef.current
    ) {
      return;
    }
    fileInputRef.current?.click();
  };

  const resetInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (uploadInProgressRef.current || profileSaveInProgressRef.current) {
      resetInput();
      return;
    }

    if (!ALLOWED_AVATAR_MIME_TYPES.includes(file.type)) {
      toast.error('Оберіть зображення JPG, PNG або WEBP.');
      resetInput();
      return;
    }

    if (file.size === 0) {
      toast.error('Файл зображення порожній.');
      resetInput();
      return;
    }

    if (file.size > MAX_AVATAR_BYTES) {
      toast.error('Розмір зображення має бути не більше 500 КБ.');
      resetInput();
      return;
    }

    uploadInProgressRef.current = true;
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await apiClient.patch<UpdateAvatarResponse>(
        '/users/me/avatar',
        formData
      );

      const updatedUser = response.data?.data;
      const avatarUrl = updatedUser?.avatarUrl;

      if (typeof avatarUrl !== 'string' || avatarUrl.trim().length === 0) {
        throw new Error('Invalid avatar response');
      }

      onAvatarUpdated({ ...updatedUser, avatarUrl: avatarUrl.trim() });
      toast.success('Аватар оновлено.');
    } catch {
      toast.error('Не вдалося оновити аватар. Спробуйте ще раз.');
    } finally {
      uploadInProgressRef.current = false;
      setIsUploading(false);
      resetInput();
    }
  };

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [nameValue, setNameValue] = useState(traveller.name);
  const [descriptionValue, setDescriptionValue] = useState(traveller.info);
  const [nameError, setNameError] = useState<string | null>(null);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const [focusReturnToken, setFocusReturnToken] = useState(0);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const editProfileButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isEditingProfile) {
      nameInputRef.current?.focus();
    }
  }, [isEditingProfile]);

  useEffect(() => {
    if (focusReturnToken > 0) {
      editProfileButtonRef.current?.focus();
    }
  }, [focusReturnToken]);

  const handleEditProfileClick = () => {
    if (
      isSavingProfile ||
      profileSaveInProgressRef.current ||
      isUploading ||
      uploadInProgressRef.current
    ) {
      return;
    }
    setNameValue(traveller.name);
    setDescriptionValue(traveller.info);
    setNameError(null);
    setDescriptionError(null);
    setIsEditingProfile(true);
  };

  const handleCancelProfileEdit = () => {
    if (isSavingProfile) {
      return;
    }
    setNameValue(traveller.name);
    setDescriptionValue(traveller.info);
    setNameError(null);
    setDescriptionError(null);
    setIsEditingProfile(false);
    setFocusReturnToken(token => token + 1);
  };

  const handleProfileSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (profileSaveInProgressRef.current || uploadInProgressRef.current) {
      return;
    }

    const trimmedName = nameValue.trim();
    const trimmedDescription = descriptionValue.trim();
    const currentNameTrimmed = traveller.name.trim();
    const currentDescriptionTrimmed = traveller.info.trim();

    let nextNameError: string | null = null;
    let nextDescriptionError: string | null = null;

    if (trimmedName.length === 0) {
      nextNameError = 'Ім’я не може бути порожнім.';
    } else if (trimmedName.length > NAME_MAX) {
      nextNameError = 'Ім’я має містити не більше 32 символів.';
    }

    if (trimmedDescription.length > DESCRIPTION_MAX) {
      nextDescriptionError = 'Опис не може перевищувати 150 символів.';
    } else if (
      currentDescriptionTrimmed.length > 0 &&
      trimmedDescription.length === 0
    ) {
      nextDescriptionError = 'Опис не може бути порожнім.';
    }

    setNameError(nextNameError);
    setDescriptionError(nextDescriptionError);

    if (nextNameError || nextDescriptionError) {
      return;
    }

    const payload: { name?: string; description?: string } = {};

    if (trimmedName !== currentNameTrimmed) {
      payload.name = trimmedName;
    }

    if (
      trimmedDescription.length > 0 &&
      trimmedDescription !== currentDescriptionTrimmed
    ) {
      payload.description = trimmedDescription;
    }

    if (Object.keys(payload).length === 0) {
      toast('Змін немає.');
      return;
    }

    profileSaveInProgressRef.current = true;
    setIsSavingProfile(true);

    try {
      const response = await apiClient.patch<UpdateProfileResponse>(
        '/users/me',
        payload
      );

      const data = response.data?.data;

      const isValidResponse =
        !!data &&
        typeof data._id === 'string' &&
        data._id.length > 0 &&
        data._id === travellerId &&
        typeof data.name === 'string' &&
        data.name.trim().length > 0 &&
        data.name.trim().length <= NAME_MAX &&
        (data.description === undefined ||
          (typeof data.description === 'string' &&
            data.description.trim().length <= DESCRIPTION_MAX));

      if (!isValidResponse || !data) {
        throw new Error('Invalid profile response');
      }

      const normalizedUser: User = {
        ...data,
        name: data.name.trim(),
        description:
          typeof data.description === 'string'
            ? data.description.trim()
            : data.description,
      };

      onProfileUpdated(normalizedUser);
      setNameValue(normalizedUser.name);
      setDescriptionValue(normalizedUser.description ?? '');
      setNameError(null);
      setDescriptionError(null);
      setIsEditingProfile(false);
      setFocusReturnToken(token => token + 1);
      toast.success('Профіль оновлено.');
    } catch {
      toast.error('Не вдалося оновити профіль. Спробуйте ще раз.');
    } finally {
      profileSaveInProgressRef.current = false;
      setIsSavingProfile(false);
    }
  };

  const nameDescribedBy = nameError
    ? 'traveller-name-error traveller-name-counter'
    : 'traveller-name-counter';
  const descriptionDescribedBy = descriptionError
    ? 'traveller-description-error traveller-description-counter'
    : 'traveller-description-counter';

  return (
    <div className={css.wrap}>
      <div className={css.photoWrapper}>
        <Image
          src={traveller.photo}
          alt={`Фото ${traveller.name}`}
          width={199}
          height={199}
          sizes="199px"
          className={css.photo}
        />

        {canEditProfile && (
          <>
            <button
              type="button"
              className={css.editButton}
              onClick={handleEditClick}
              disabled={isUploading || isSavingProfile}
              aria-busy={isUploading}
              aria-label={
                isUploading ? 'Завантаження аватара' : 'Змінити аватар'
              }
            >
              {isUploading ? (
                <span className={css.spinner} aria-hidden="true" />
              ) : (
                <svg
                  width="20"
                  height="20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#icon-edit" />
                </svg>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className={css.visuallyHidden}
              onChange={handleFileChange}
              disabled={isUploading || isSavingProfile}
            />
          </>
        )}
      </div>

      <div className={css.info}>
        {isEditingProfile ? (
          <form
            className={css.editForm}
            onSubmit={handleProfileSubmit}
            aria-busy={isSavingProfile}
          >
            <div className={css.field}>
              <label htmlFor="traveller-name-input" className={css.label}>
                Ім’я
              </label>
              <input
                ref={nameInputRef}
                id="traveller-name-input"
                type="text"
                className={css.input}
                value={nameValue}
                onChange={e => setNameValue(e.target.value)}
                maxLength={NAME_MAX}
                autoComplete="name"
                aria-invalid={!!nameError}
                aria-describedby={nameDescribedBy}
                disabled={isSavingProfile}
              />
              <div className={css.counter} id="traveller-name-counter">
                {nameValue.length}/{NAME_MAX}
              </div>
              {nameError && (
                <span
                  id="traveller-name-error"
                  className={css.fieldError}
                  role="alert"
                >
                  {nameError}
                </span>
              )}
            </div>

            <div className={css.field}>
              <label
                htmlFor="traveller-description-textarea"
                className={css.label}
              >
                Опис
              </label>
              <textarea
                id="traveller-description-textarea"
                className={css.textarea}
                value={descriptionValue}
                onChange={e => setDescriptionValue(e.target.value)}
                maxLength={DESCRIPTION_MAX}
                aria-invalid={!!descriptionError}
                aria-describedby={descriptionDescribedBy}
                disabled={isSavingProfile}
              />
              <div className={css.counter} id="traveller-description-counter">
                {descriptionValue.length}/{DESCRIPTION_MAX}
              </div>
              {descriptionError && (
                <span
                  id="traveller-description-error"
                  className={css.fieldError}
                  role="alert"
                >
                  {descriptionError}
                </span>
              )}
            </div>

            <div className={css.actions}>
              <button
                type="submit"
                className={css.saveButton}
                disabled={isSavingProfile || isUploading}
              >
                {isSavingProfile ? 'Збереження...' : 'Зберегти'}
              </button>
              <button
                type="button"
                className={css.cancelButton}
                onClick={handleCancelProfileEdit}
                disabled={isSavingProfile}
              >
                Скасувати
              </button>
            </div>
          </form>
        ) : (
          <>
            <h3 className={css.title}>{traveller.name}</h3>
            <p className={css.text}>{traveller.info}</p>
            {canEditProfile && (
              <button
                ref={editProfileButtonRef}
                type="button"
                className={css.editProfileTrigger}
                onClick={handleEditProfileClick}
                disabled={isUploading}
              >
                Редагувати профіль
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
