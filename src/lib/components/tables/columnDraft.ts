import type { SqliteColumnType } from '$lib/api/types';

export type FkAction = 'CASCADE' | 'SET NULL' | 'SET DEFAULT' | 'RESTRICT';

export interface ColumnDraft {
  name: string;
  type: SqliteColumnType;
  default: string;
  notNull: boolean;
  unique: boolean;
  primaryKey: boolean;
  index: boolean;
  foreignKey: {
    enabled: boolean;
    table: string;
    column: string;
    onDelete: FkAction;
    onUpdate: FkAction;
  };
}

export const createEmptyColumn = (): ColumnDraft => ({
  name: '',
  type: 'TEXT',
  default: '',
  notNull: false,
  unique: false,
  primaryKey: false,
  index: false,
  foreignKey: {
    enabled: false,
    table: '',
    column: 'id',
    onDelete: 'CASCADE',
    onUpdate: 'RESTRICT',
  },
});
