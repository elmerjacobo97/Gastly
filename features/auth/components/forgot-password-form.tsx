'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2Icon, MailIcon } from 'lucide-react';
import Link from 'next/link';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { forgotPassword } from '@/features/auth/server/actions';
import { type ForgotPasswordValues, forgotPasswordSchema } from '@/features/auth/schemas/auth-schemas';

export function ForgotPasswordForm() {
  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  async function onSubmit(values: ForgotPasswordValues) {
    const result = await forgotPassword(values);
    if (result?.error) {
      toast.error('No se pudo enviar el correo', { description: result.error });
    }
  }

  return (
    <Card className="w-full max-w-md border-foreground/10 shadow-xl shadow-foreground/5">
      <CardHeader className="text-center">
        <CardTitle>Recuperar contraseña</CardTitle>
        <CardDescription>
          Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-5" id="forgot-password-form" noValidate onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              control={form.control}
              name="email"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="forgot-email">Correo electrónico</FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      {...field}
                      aria-invalid={fieldState.invalid}
                      autoComplete="email"
                      id="forgot-email"
                      placeholder="tu@correo.com"
                      type="email"
                    />
                    <InputGroupAddon align="inline-start">
                      <MailIcon />
                    </InputGroupAddon>
                  </InputGroup>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="flex-col gap-3">
        <Button className="w-full" disabled={form.formState.isSubmitting} form="forgot-password-form" type="submit">
          {form.formState.isSubmitting && <Loader2Icon className="size-4 animate-spin" />}
          Enviar enlace
        </Button>
        <p className="text-sm text-muted-foreground">
          ¿Recordaste tu contraseña?{' '}
          <Link className="font-medium text-foreground underline-offset-4 hover:underline" href="/login">
            Inicia sesión
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
