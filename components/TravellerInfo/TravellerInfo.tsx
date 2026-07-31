'use client';

import { useRef, useState } from 'react';
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
  canEditAvatar: boolean;
  onAvatarUpdated: (updatedUser: User) => void;
}

type UpdateAvatarResponse = {
  status: number;
  message: string;
  data: User;
};

const ALLOWED_AVATAR_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_AVATAR_BYTES = 500 * 1024;

export default function TravellerInfo({
  traveller,
  canEditAvatar,
  onAvatarUpdated,
}: TravellerInfoProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadInProgressRef = useRef(false);

  const handleEditClick = () => {
    if (isUploading || uploadInProgressRef.current) {
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

    if (uploadInProgressRef.current) {
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

        {canEditAvatar && (
          <>
            <button
              type="button"
              className={css.editButton}
              onClick={handleEditClick}
              disabled={isUploading}
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
              disabled={isUploading}
            />
          </>
        )}
      </div>

      <div className={css.info}>
        <h3 className={css.title}>{traveller.name}</h3>
        <p className={css.text}>{traveller.info}</p>
      </div>
    </div>
  );
}
