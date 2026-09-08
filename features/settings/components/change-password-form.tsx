'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2Icon } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { PasswordInput } from '@/components/password-input';
import { changePassword } from '@/lib/finance/auth/server/actions';
import { type ChangePasswordValues, changePasswordSchema } from '@/lib/finance/auth/schemas/auth-schemas';

export function ChangePasswordForm() {
  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  async function onSubmit(values: ChangePasswordValues) {
    const result = await changePassword(values);
    if (result?.error) {
      toast.error('No se pudo cambiar la contraseña', { description: result.error });
    } else {
      toast.success('Contraseña actualizada');
      form.reset();
    }
  }

  return (
    <form className="flex flex-col gap-5" noValidate onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup>
        <Controller
          control={form.control}
          name="currentPassword"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="current-password">Contraseña actual</FieldLabel>
              <PasswordInput
                {...field}
                aria-invalid={fieldState.invalid}
                autoComplete="current-password"
                id="current-password"
                placeholder="********"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="newPassword"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="new-password">Nueva contraseña</FieldLabel>
              <PasswordInput
                {...field}
                aria-invalid={fieldState.invalid}
                autoComplete="new-password"
                id="new-password"
                placeholder="********"
              />
              <FieldDescription>Mínimo 6 caracteres.</FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="confirmPassword"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="confirm-new-password">Confirmar nueva contraseña</FieldLabel>
              <PasswordInput
                {...field}
                aria-invalid={fieldState.invalid}
                autoComplete="new-password"
                id="confirm-new-password"
                placeholder="********"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>
      <div className="flex justify-end">
        <Button disabled={form.formState.isSubmitting} type="submit">
          {form.formState.isSubmitting && <Loader2Icon className="size-4 animate-spin" />}
          Guardar contraseña
        </Button>
      </div>
    </form>
  );
}
