interface DisplayNameInput {
  firstName?: string | null;
  lastName?: string | null;
  company?: string | null;
}

export function buildDisplayName({ firstName, lastName, company }: DisplayNameInput): string {
  const first = firstName?.trim() ?? "";
  const last = lastName?.trim() ?? "";
  const personName = [first, last].filter(Boolean).join(" ");
  if (personName) return personName;
  const co = company?.trim() ?? "";
  return co;
}
