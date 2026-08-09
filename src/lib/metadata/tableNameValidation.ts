// Mirrors soul's Joi identifier constraint for table/column names -- the
// same `^[\w-]+$`, 2-30 char pattern is reused for table names, column
// names, and foreign-key table/column references (see
// soul/src/schemas/tables.js). Client-side only, for fast feedback -- the
// backend remains the source of truth.
const IDENTIFIER_PATTERN = /^[\w-]+$/;

export const isValidIdentifier = (value: string): boolean =>
  value.length >= 2 && value.length <= 30 && IDENTIFIER_PATTERN.test(value);
