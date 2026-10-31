export const PRIVATE_ROUTES = [
  "/",
  "/custody",
  "/installments",
  "/loans",
  "/recurring-payments",
  "/reports",
  "/savings",
  "/settings",
  "/transactions",
  "/wishlist",
] as const;

export function isPrivatePath(pathname: string): boolean {
  // "//host" and "/\\host" are read by browsers as another origin, not as a path.
  if (!pathname.startsWith("/") || /^\/[/\\]/.test(pathname)) return false;

  return PRIVATE_ROUTES.some(
    (route) =>
      pathname === route || (route !== "/" && pathname.startsWith(`${route}/`)),
  );
}

// The destination for a post-login redirect: only a private path of this app, else home.
export function resolveSafePath(next: string | undefined): string {
  return next && isPrivatePath(next) ? next : "/";
}
