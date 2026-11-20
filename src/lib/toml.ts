import { parse } from 'smol-toml';

/**
 * Parse TOML into plain objects.
 *
 * smol-toml builds its tables with a null prototype, and React refuses to pass
 * null-prototype objects from Server Components to Client Components. Rebuilding
 * the tree with ordinary object literals keeps the loaders independent of the
 * parser's internals. Dates become ISO strings for the same reason.
 */
function toPlain(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(toPlain);
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'bigint') {
    return Number(value);
  }
  if (value !== null && typeof value === 'object') {
    const plain: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) {
      plain[key] = toPlain(entry);
    }
    return plain;
  }
  return value;
}

export function parseToml<T>(source: string): T {
  return toPlain(parse(source)) as T;
}
