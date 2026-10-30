export const MIN_DESCRIPTION_LENGTH = 3;

// The model output is untrusted: only a name that exists in the user's list is accepted.
export function pickCategory(
  raw: unknown,
  names: readonly string[],
): string | null {
  if (typeof raw !== "object" || raw === null || !("category" in raw)) {
    return null;
  }
  if (typeof raw.category !== "string") return null;

  const lower = raw.category.trim().toLowerCase();
  return names.find((name) => name.toLowerCase() === lower) ?? null;
}
