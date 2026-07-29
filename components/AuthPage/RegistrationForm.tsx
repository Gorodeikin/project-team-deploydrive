'use client';

import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useMutation } from '@tanstack/react-query';
import { register } from '@/lib/api/auth';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import toast from 'react-hot-toast';
import type { AxiosError } from 'axios';
import type { User } from '@/types/user';
import styles from './AuthPage.module.css';

const schema = Yup.object({
  name: Yup.string().max(32, 'Максимум 32 символи').required('Введіть ім’я'),
  email: Yup.string()
    .email('Некоректна пошта')
    .max(64, 'Максимум 64 символи')
    .required('Введіть пошту'),
  password: Yup.string()
    .min(8, 'Мінімум 8 символів')
    .max(128, 'Максимум 128 символів')
    .required('Введіть пароль'),
});

export default function RegistrationForm({
  returnPath,
}: {
  returnPath: string;
}) {
  const router = useRouter();
  const setUser = useAuthStore(s => s.setUser);

  const mutation = useMutation<
    User,
    AxiosError<{ message: string }>,
    { name: string; email: string; password: string }
  >({
    mutationFn: register,
    onSuccess: user => {
      setUser(user);
      toast.success(`Вітаємо, ${user.name}! 🎉`);
      router.replace(returnPath);
    },
    onError: error => {
      const msg = error.response?.data?.message || 'Помилка реєстрації';
      toast.error(msg);
    },
  });

  return (
    <Formik
      initialValues={{
        name: '',
        email: '',
        password: '',
      }}
      validationSchema={schema}
      onSubmit={(values, { setSubmitting }) => {
        mutation.mutate(values, {
          onSettled: () => setSubmitting(false),
        });
      }}
    >
      {({ isSubmitting, touched, errors, values }) => (
        <Form className={styles.form}>
          <div className={styles.formInfoInput}>
            <label className={styles.label}>Ім’я та Прізвище*</label>
            <Field
              name="name"
              className={`${styles.input}
                ${touched.name && errors.name ? styles.inputError : ''}
                ${values.name && !errors.name ? styles.inputFilled : ''}`}
            />
            <ErrorMessage
              name="name"
              component="div"
              className={styles.error}
            />
          </div>

          <div className={styles.formInfoInput}>
            <label className={styles.label}>Пошта*</label>
            <Field
              name="email"
              type="email"
              className={`${styles.input}
                ${touched.email && errors.email ? styles.inputError : ''}
                ${values.email && !errors.email ? styles.inputFilled : ''}`}
            />
            <ErrorMessage
              name="email"
              component="div"
              className={styles.error}
            />
          </div>

          <div className={styles.formInfoInput}>
            <label className={styles.label}>Пароль*</label>
            <Field
              name="password"
              type="password"
              className={`${styles.input}
                ${touched.password && errors.password ? styles.inputError : ''}
                ${values.password && !errors.password ? styles.inputFilled : ''}`}
            />
            <ErrorMessage
              name="password"
              component="div"
              className={styles.error}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || mutation.isPending}
            className={styles.submitBtn}
          >
            {mutation.isPending ? 'Реєстрація...' : 'Зареєструватись'}
          </button>
        </Form>
      )}
    </Formik>
  );
}
