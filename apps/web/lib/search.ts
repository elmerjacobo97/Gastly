function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

export function matchesQuery(
  query: string,
  ...fields: (string | null | undefined)[]
) {
  const needle = normalize(query);
  if (!needle) return true;
  return fields.some((field) => normalize(field ?? "").includes(needle));
}
