import type {
  ForeignKeyInfo,
  ForeignKeyListEntry,
  SqliteColumnType,
  TableSchemaColumn,
} from '$lib/api/types';

export interface FieldDescriptor {
  name: string;
  sqlType: SqliteColumnType;
  required: boolean;
  isPrimaryKey: boolean;
  defaultValue: unknown;
  foreignKey?: ForeignKeyInfo;
}

const EXACT_TYPES: readonly SqliteColumnType[] = [
  'TEXT',
  'NUMERIC',
  'INTEGER',
  'REAL',
  'BLOB',
  'BOOLEAN',
  'DATE',
  'DATETIME',
];

// SQLite type-affinity rules as a fallback for non-standard type strings --
// e.g. tables that predate Soul or were altered outside it. Columns
// created through Soul's own `POST /api/tables` always use one of the
// EXACT_TYPES verbatim; this only matters for schemas Soul didn't create.
// See https://www.sqlite.org/datatype3.html#determination_of_column_affinity
export const normalizeSqlType = (rawType: string): SqliteColumnType => {
  const upper = (rawType || '').toUpperCase();

  if (EXACT_TYPES.includes(upper as SqliteColumnType)) {
    return upper as SqliteColumnType;
  }
  if (upper.includes('DATETIME') || upper.includes('TIMESTAMP')) {
    return 'DATETIME';
  }
  if (upper.includes('DATE')) return 'DATE';
  if (upper.includes('BOOL')) return 'BOOLEAN';
  if (upper.includes('INT')) return 'INTEGER';
  if (
    upper.includes('CHAR') ||
    upper.includes('CLOB') ||
    upper.includes('TEXT')
  ) {
    return 'TEXT';
  }
  if (
    upper.includes('REAL') ||
    upper.includes('FLOA') ||
    upper.includes('DOUB')
  ) {
    return 'REAL';
  }
  if (upper.includes('BLOB')) return 'BLOB';
  return 'NUMERIC';
};

export const foreignKeysByColumn = (
  entries: ForeignKeyListEntry[],
): Map<string, ForeignKeyInfo> => {
  const map = new Map<string, ForeignKeyInfo>();
  entries.forEach((entry) => {
    map.set(entry.from, { table: entry.table, column: entry.to });
  });
  return map;
};

export const schemaToForm = (
  columns: TableSchemaColumn[],
  foreignKeys: ForeignKeyListEntry[] = [],
): FieldDescriptor[] => {
  const fkByColumn = foreignKeysByColumn(foreignKeys);

  return columns.map((column) => ({
    name: column.name,
    sqlType: normalizeSqlType(column.type),
    required: column.notnull === 1 && column.dflt_value === null,
    isPrimaryKey: column.pk > 0,
    defaultValue: column.dflt_value,
    foreignKey: fkByColumn.get(column.name),
  }));
};
