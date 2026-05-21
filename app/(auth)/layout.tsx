type AuthLayoutProps = {
  children: React.ReactNode;
};

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-muted/30 px-6 py-12">
      <div className="absolute inset-x-0 top-0 h-64 bg-linear-to-b from-primary/10 to-transparent" />
      <div className="relative flex w-full max-w-md flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="rounded-full border bg-background px-3 py-1 text-sm font-medium text-muted-foreground shadow-sm">
            Gastly
          </div>
          <p className="max-w-sm text-sm text-muted-foreground">
            Tu espacio privado para cuidar la salud y rutina de tus gatos.
          </p>
        </div>
        {children}
      </div>
    </main>
  );
}
