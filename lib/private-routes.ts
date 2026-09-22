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
] as const;

export function isPrivatePath(pathname: string): boolean {
  return PRIVATE_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}
