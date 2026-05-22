'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2Icon } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { PasswordInput } from '@/features/auth/components/password-input';
import { resetPassword } from '@/features/auth/server/actions';
import { type ResetPasswordValues, resetPasswordSchema } from '@/features/auth/schemas/auth-schemas';

export function ResetPasswordForm() {
  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  async function onSubmit(values: ResetPasswordValues) {
    const result = await resetPassword(values);
    if (result?.error) {
      toast.error('No se pudo restablecer la contraseña', { description: result.error });
    }
  }

  return (
    <Card className="w-full max-w-md border-foreground/10 shadow-xl shadow-foreground/5">
      <CardHeader className="text-center">
        <CardTitle>Nueva contraseña</CardTitle>
        <CardDescription>Ingresa y confirma tu nueva contraseña.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-5" id="reset-password-form" noValidate onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              control={form.control}
              name="password"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="reset-password">Nueva contraseña</FieldLabel>
                  <PasswordInput
                    {...field}
                    aria-invalid={fieldState.invalid}
                    autoComplete="new-password"
                    id="reset-password"
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
                  <FieldLabel htmlFor="reset-confirm-password">Confirmar contraseña</FieldLabel>
                  <PasswordInput
                    {...field}
                    aria-invalid={fieldState.invalid}
                    autoComplete="new-password"
                    id="reset-confirm-password"
                    placeholder="********"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <Button className="w-full" disabled={form.formState.isSubmitting} form="reset-password-form" type="submit">
          {form.formState.isSubmitting && <Loader2Icon className="size-4 animate-spin" />}
          Restablecer contraseña
        </Button>
      </CardFooter>
    </Card>
  );
}
