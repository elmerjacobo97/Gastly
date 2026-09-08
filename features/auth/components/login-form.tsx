'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2Icon, MailIcon } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { PasswordInput } from '@/components/password-input';
import { signIn } from '@/lib/finance/auth/server/actions';
import { type LoginValues, loginSchema } from '@/lib/finance/auth/schemas/auth-schemas';

type LoginFormProps = {
  error?: string;
  next?: string;
};

export function LoginForm({ error, next }: LoginFormProps) {
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    if (!error) return;
    toast.error('No se pudo iniciar sesión', { description: error });
  }, [error]);

  async function onSubmit(values: LoginValues) {
    const result = await signIn(values, next);
    if (result?.error) {
      toast.error('No se pudo iniciar sesión', { description: result.error });
    }
  }

  return (
    <Card className="w-full max-w-md border-foreground/10 shadow-xl shadow-foreground/5">
      <CardHeader className="text-center">
        <CardTitle>Inicia sesión</CardTitle>
        <CardDescription>Bienvenido de vuelta. Ingresa tus credenciales para continuar.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-5" id="login-form" noValidate onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              control={form.control}
              name="email"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="login-email">Correo electrónico</FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      {...field}
                      aria-invalid={fieldState.invalid}
                      autoComplete="email"
                      id="login-email"
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
                  <div className="flex items-center justify-between">
                    <FieldLabel htmlFor="login-password">Contraseña</FieldLabel>
                    <Link
                      className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                      href="/forgot-password"
                      tabIndex={-1}
                    >
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
                  <PasswordInput
                    {...field}
                    aria-invalid={fieldState.invalid}
                    autoComplete="current-password"
                    id="login-password"
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
        <Button className="w-full" disabled={form.formState.isSubmitting} form="login-form" type="submit">
          {form.formState.isSubmitting && <Loader2Icon className="size-4 animate-spin" />}
          Entrar
        </Button>
        <p className="text-sm text-muted-foreground">
          ¿No tienes cuenta?{' '}
          <Link className="font-medium text-foreground underline-offset-4 hover:underline" href="/sign-up">
            Regístrate
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
