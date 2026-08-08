// Shapes mirror Soul core's actual REST/WS responses (see
// soul/src/controllers/{tables,rows}.js and soul/src/websocket.js) rather
// than the swagger.json definitions, which are known to drift -- see
// docs/extensions-examples.md-adjacent research notes in the project plan.

export interface ApiError {
  status: number;
  message: string;
  error?: unknown;
}

export interface ObtainTokenResponse {
  message: string;
  data: { userId: number };
}

export type SqliteColumnType =
  | 'TEXT'
  | 'NUMERIC'
  | 'INTEGER'
  | 'REAL'
  | 'BLOB'
  | 'BOOLEAN'
  | 'DATE'
  | 'DATETIME';

export interface TableListItem {
  name: string;
}

// Raw shape of `pragma_table_info`, as returned by GET /api/tables/:name.
export interface TableSchemaColumn {
  cid: number;
  name: string;
  type: string;
  notnull: 0 | 1;
  dflt_value: unknown;
  pk: number;
}

// Normalized shape used once a raw pragma_foreign_key_list entry has been
// resolved for a specific local column -- see lib/metadata/schemaToForm.ts.
export interface ForeignKeyInfo {
  table: string;
  column: string;
}

// Raw shape of `pragma_foreign_key_list`, as returned in the `foreignKeys`
// array alongside GET /api/tables/:name's `data`. `from` is the local
// column name; `table`/`to` identify the referenced table/column.
export interface ForeignKeyListEntry {
  id: number;
  seq: number;
  table: string;
  from: string;
  to: string;
  on_update: string;
  on_delete: string;
  match: string;
}

export interface GetTableSchemaResponse {
  data: TableSchemaColumn[];
  foreignKeys: ForeignKeyListEntry[];
}

export interface CreateTableFieldForeignKey {
  table: string;
  column: string;
  onDelete?: 'CASCADE' | 'SET NULL' | 'SET DEFAULT' | 'RESTRICT';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'SET DEFAULT' | 'RESTRICT';
}

export interface CreateTableField {
  name: string;
  type: SqliteColumnType;
  default?: unknown;
  notNull?: boolean;
  unique?: boolean;
  primaryKey?: boolean;
  foreignKey?: CreateTableFieldForeignKey;
  index?: boolean;
}

export interface CreateTablePayload {
  name: string;
  autoAddCreatedAt?: boolean;
  autoAddUpdatedAt?: boolean;
  schema: CreateTableField[];
}

export type FilterOperator =
  'eq' | 'lt' | 'gt' | 'lte' | 'gte' | 'neq' | 'null' | 'notnull';

export interface RowFilter {
  field: string;
  operator?: FilterOperator;
  value: unknown;
}

export interface ListRowsParams {
  page?: number;
  limit?: number;
  search?: string;
  filters?: RowFilter[];
  ordering?: string; // e.g. "name" or "-name" or "relation.field"
  schema?: string[];
  extend?: string[];
}

export type Row = Record<string, unknown>;

export interface ListRowsResponse {
  data: Row[];
  total: number;
  // Deliberately not used for navigation -- Soul core's `next`/`previous`
  // are missing the `/api` prefix (a known backend quirk). Pagination is
  // reconstructed client-side instead, see lib/api/rows.ts.
  next: string | null;
  previous: string | null;
}

export interface InsertRowResponse {
  message: string;
  data: { changes: number; lastInsertRowid: number };
}

export interface MutateRowResponse {
  message: string;
  data: { changes: number };
}

export interface RolePermission {
  id: number;
  role_id: number;
  table_name: string;
  create: 0 | 1;
  read: 0 | 1;
  update: 0 | 1;
  delete: 0 | 1;
}

export interface Role {
  id: number;
  name: string;
}

export interface UserRole {
  id: number;
  user_id: number;
  role_id: number;
}

export type WsBroadcast =
  | { type: 'INSERT'; data: Row }
  | { type: 'UPDATE'; _lookup_field?: string; data: { pks: string[] } & Row }
  | { type: 'DELETE'; _lookup_field?: string; data: { pks: string[] } };
