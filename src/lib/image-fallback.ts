export function firstAvailableImageSource(
  sources: readonly (string | null | undefined)[],
  failedSources: readonly string[] = [],
): string | null {
  const failed = new Set(failedSources);
  const seen = new Set<string>();

  for (const source of sources) {
    const candidate = source?.trim();
    if (!candidate || seen.has(candidate) || failed.has(candidate)) continue;
    seen.add(candidate);
    return candidate;
  }

  return null;
}
