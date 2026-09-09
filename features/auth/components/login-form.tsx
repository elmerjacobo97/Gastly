'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2Icon, MailIcon } from 'lucide-react';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { PasswordInput } from '@/components/password-input';
import { signIn } from '@/features/auth/server/actions';
import { type LoginValues, loginSchema } from '@/features/auth/schemas/auth-schemas';

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
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Inicia sesión</CardTitle>
        <CardDescription>Bienvenido de vuelta. Ingresa tus credenciales para continuar.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-5" noValidate onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              control={form.control}
              name="email"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel className="text-xs font-semibold uppercase tracking-wider" htmlFor="login-email">Correo electrónico</FieldLabel>
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
                  <FieldLabel className="text-xs font-semibold uppercase tracking-wider" htmlFor="login-password">Contraseña</FieldLabel>
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
          <Button className="w-full" disabled={form.formState.isSubmitting} type="submit">
            {form.formState.isSubmitting && <Loader2Icon className="size-4 animate-spin" />}
            Entrar
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
