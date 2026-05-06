export function normalizeAuthors(value: any): string[] {
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }
  return [];
}

export function formatAuthors(value: any, fallback: string = 'Unknown'): string {
  const list = normalizeAuthors(value);
  if (list.length === 0) return fallback;
  return list.join(' · ');
}

export function authorsMatch(value: any, candidates: string[]): boolean {
  if (candidates.length === 0) return true;
  const list = normalizeAuthors(value);
  const trimmedCandidates = candidates.map((c) => c.trim());
  return list.some((a) => trimmedCandidates.includes(a));
}
