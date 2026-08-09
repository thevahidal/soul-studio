import type { ExtensionRegistry } from '$lib/extensions/registry';
import type { FieldRendererProps } from '$lib/extensions/types';
import type { Component } from 'svelte';
import type { FieldDescriptor } from './schemaToForm';

export type WidgetKind =
  | 'text'
  | 'number'
  | 'checkbox'
  | 'date'
  | 'datetime'
  | 'blob-readonly'
  | 'relation';

export const resolveWidgetKind = (field: FieldDescriptor): WidgetKind => {
  if (field.foreignKey) return 'relation';

  switch (field.sqlType) {
    case 'INTEGER':
    case 'REAL':
    case 'NUMERIC':
      return 'number';
    case 'BOOLEAN':
      return 'checkbox';
    case 'DATE':
      return 'date';
    case 'DATETIME':
      return 'datetime';
    case 'BLOB':
      return 'blob-readonly';
    case 'TEXT':
    default:
      return 'text';
  }
};

export type FieldRenderer =
  | { source: 'plugin'; component: Component<FieldRendererProps> }
  | { source: 'builtin'; kind: WidgetKind };

// Resolution order: a plugin-registered renderer for this exact
// table.column always wins, then a relation picker if the column is a
// known foreign key, then the type-based default.
export const resolveFieldRenderer = (
  tableName: string,
  field: FieldDescriptor,
  registry: Pick<ExtensionRegistry, 'fieldRenderers'>,
): FieldRenderer => {
  const pluginComponent = registry.fieldRenderers.get(
    `${tableName}.${field.name}`,
  );
  if (pluginComponent) {
    return { source: 'plugin', component: pluginComponent };
  }
  return { source: 'builtin', kind: resolveWidgetKind(field) };
};
