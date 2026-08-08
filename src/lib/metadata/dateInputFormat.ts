// Soul stores DATE/DATETIME columns as SQLite TEXT in
// `YYYY-MM-DD`/`YYYY-MM-DD HH:MM:SS` form (e.g. via `DEFAULT
// CURRENT_TIMESTAMP`). Native `<input type="date">`/`<input
// type="datetime-local">` elements require `YYYY-MM-DD` /
// `YYYY-MM-DDTHH:MM[:SS]` respectively -- a mismatch silently blanks the
// input's displayed value, and submitting that blank value back sends a
// malformed/empty string to the backend instead of the original timestamp.
// These convert both directions so editing a date/datetime field round-
// trips correctly.

export const toDateInputValue = (value: unknown): string => {
  if (typeof value !== 'string') return '';
  return value.slice(0, 10);
};

export const toDatetimeLocalInputValue = (value: unknown): string => {
  if (typeof value !== 'string') return '';
  return value.replace(' ', 'T').slice(0, 16);
};

export const fromDatetimeLocalInputValue = (value: string): string => {
  if (!value) return value;
  const [datePart, timePart = ''] = value.split('T');
  const withSeconds = timePart.length === 5 ? `${timePart}:00` : timePart;
  return `${datePart} ${withSeconds}`;
};
