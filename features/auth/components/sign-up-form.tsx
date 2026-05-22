'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2Icon, MailIcon, UserIcon } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { PasswordInput } from '@/features/auth/components/password-input';
import { signUp } from '@/features/auth/server/actions';
import { type SignUpValues, signUpSchema } from '@/features/auth/schemas/auth-schemas';

type SignUpFormProps = {
  error?: string;
};

export function SignUpForm({ error }: SignUpFormProps) {
  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (!error) return;
    toast.error('No se pudo crear la cuenta', { description: error });
  }, [error]);

  async function onSubmit(values: SignUpValues) {
    const result = await signUp(values);
    if (result?.error) {
      toast.error('No se pudo crear la cuenta', { description: result.error });
    }
  }

  return (
    <Card className="w-full max-w-md border-foreground/10 shadow-xl shadow-foreground/5">
      <CardHeader className="text-center">
        <CardTitle>Crea tu cuenta</CardTitle>
        <CardDescription>Configura tu espacio personal para organizar tus finanzas.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-5" id="sign-up-form" noValidate onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              control={form.control}
              name="fullName"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="sign-up-full-name">Nombre completo</FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      {...field}
                      aria-invalid={fieldState.invalid}
                      autoComplete="name"
                      id="sign-up-full-name"
                      placeholder="Tu nombre"
                      type="text"
                    />
                    <InputGroupAddon align="inline-start">
                      <UserIcon />
                    </InputGroupAddon>
                  </InputGroup>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="email"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="sign-up-email">Correo electrónico</FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      {...field}
                      aria-invalid={fieldState.invalid}
                      autoComplete="email"
                      id="sign-up-email"
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
            <Controller
              control={form.control}
              name="password"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="sign-up-password">Contraseña</FieldLabel>
                  <PasswordInput
                    {...field}
                    aria-invalid={fieldState.invalid}
                    autoComplete="new-password"
                    id="sign-up-password"
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
                  <FieldLabel htmlFor="sign-up-confirm-password">Confirmar contraseña</FieldLabel>
                  <PasswordInput
                    {...field}
                    aria-invalid={fieldState.invalid}
                    autoComplete="new-password"
                    id="sign-up-confirm-password"
                    placeholder="********"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="flex-col gap-3">
        <Button className="w-full" disabled={form.formState.isSubmitting} form="sign-up-form" type="submit">
          {form.formState.isSubmitting && <Loader2Icon className="size-4 animate-spin" />}
          Crear cuenta
        </Button>
        <p className="text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{' '}
          <Link className="font-medium text-foreground underline-offset-4 hover:underline" href="/login">
            Inicia sesión
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
