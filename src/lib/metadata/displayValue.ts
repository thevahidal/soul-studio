import type { Row } from '$lib/api/types';

// Heuristic label for a row with no declared "display field" concept in
// Soul's schema API: prefer the first string-valued column not in
// `excludeKeys` (e.g. the FK's own id column), falling back to an `id`
// column, then the row's first key at all. Used for relation pickers and
// for rendering `${column}_data` in the row list.
export const pickDisplayField = (
  row: Row,
  excludeKeys: string[] = [],
): string | undefined => {
  const entry = Object.entries(row).find(
    ([key, value]) => !excludeKeys.includes(key) && typeof value === 'string',
  );
  return entry?.[0];
};

export const displayLabel = (
  row: Row | undefined | null,
  excludeKeys: string[] = [],
): string => {
  if (!row) return '';

  const field = pickDisplayField(row, excludeKeys);
  if (field) return String(row[field]);

  const idKey = 'id' in row ? 'id' : Object.keys(row)[0];
  return idKey ? String(row[idKey]) : '';
};
