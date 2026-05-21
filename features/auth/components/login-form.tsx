'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { MailIcon } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { PasswordInput } from '@/features/auth/components/password-input';
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
    if (!error) {
      return;
    }

    toast.error('No se pudo iniciar sesion', {
      description: error,
    });
  }, [error]);

  async function onSubmit(values: LoginValues) {
    const result = await signIn(values, next);

    if (result?.error) {
      toast.error('No se pudo iniciar sesion', {
        description: result.error,
      });
    }
  }

  return (
    <Card className="w-full max-w-md border-foreground/10 shadow-xl shadow-foreground/5">
      <CardHeader className="text-center">
        <CardTitle>Entra a tu cuenta</CardTitle>
        <CardDescription>
          Continua revisando tus movimientos y presupuesto personal.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-5" id="login-form" noValidate onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              control={form.control}
              name="email"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="login-email">Email</FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      {...field}
                      aria-invalid={fieldState.invalid}
                      autoComplete="email"
                      id="login-email"
                      placeholder="tu@email.com"
                      type="email"
                    />
                    <InputGroupAddon align="inline-start">
                      <MailIcon />
                    </InputGroupAddon>
                  </InputGroup>
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="password"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="login-password">Password</FieldLabel>
                  <PasswordInput
                    {...field}
                    aria-invalid={fieldState.invalid}
                    autoComplete="current-password"
                    id="login-password"
                  />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="flex-col gap-3">
        <Button className="w-full" disabled={form.formState.isSubmitting} form="login-form" type="submit">
          Entrar
        </Button>
        <p className="text-sm text-muted-foreground">
          No tienes cuenta?{' '}
          <Link className="font-medium text-foreground underline-offset-4 hover:underline" href="/sign-up">
            Registrate
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
