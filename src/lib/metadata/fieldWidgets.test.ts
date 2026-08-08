import { describe, expect, it } from 'vitest';
import { resolveFieldRenderer, resolveWidgetKind } from './fieldWidgets';
import type { FieldDescriptor } from './schemaToForm';
import type { Component } from 'svelte';

const field = (overrides: Partial<FieldDescriptor> = {}): FieldDescriptor => ({
  name: 'x',
  sqlType: 'TEXT',
  required: false,
  isPrimaryKey: false,
  defaultValue: null,
  ...overrides,
});

describe('resolveWidgetKind', () => {
  it('maps each sqlType to its default widget', () => {
    expect(resolveWidgetKind(field({ sqlType: 'TEXT' }))).toBe('text');
    expect(resolveWidgetKind(field({ sqlType: 'INTEGER' }))).toBe('number');
    expect(resolveWidgetKind(field({ sqlType: 'REAL' }))).toBe('number');
    expect(resolveWidgetKind(field({ sqlType: 'NUMERIC' }))).toBe('number');
    expect(resolveWidgetKind(field({ sqlType: 'BOOLEAN' }))).toBe('checkbox');
    expect(resolveWidgetKind(field({ sqlType: 'DATE' }))).toBe('date');
    expect(resolveWidgetKind(field({ sqlType: 'DATETIME' }))).toBe('datetime');
    expect(resolveWidgetKind(field({ sqlType: 'BLOB' }))).toBe('blob-readonly');
  });

  it('returns relation for any foreign-key column regardless of sqlType', () => {
    const fkField = field({
      sqlType: 'INTEGER',
      foreignKey: { table: 'authors', column: 'id' },
    });
    expect(resolveWidgetKind(fkField)).toBe('relation');
  });
});

describe('resolveFieldRenderer', () => {
  const FakeComponent = (() => {}) as unknown as Component;

  it('falls back to the builtin widget when no plugin renderer is registered', () => {
    const registry = { fieldRenderers: new Map() };
    const result = resolveFieldRenderer(
      'orders',
      field({ sqlType: 'TEXT' }),
      registry,
    );
    expect(result).toEqual({ source: 'builtin', kind: 'text' });
  });

  it('prefers a plugin renderer over the FK relation picker', () => {
    const registry = {
      fieldRenderers: new Map([['orders.status', FakeComponent]]),
    };
    const fkField = field({
      name: 'status',
      sqlType: 'INTEGER',
      foreignKey: { table: 'statuses', column: 'id' },
    });
    const result = resolveFieldRenderer('orders', fkField, registry);
    expect(result).toEqual({ source: 'plugin', component: FakeComponent });
  });

  it('only matches the exact table.column key', () => {
    const registry = {
      fieldRenderers: new Map([['orders.status', FakeComponent]]),
    };
    const result = resolveFieldRenderer(
      'invoices',
      field({ name: 'status' }),
      registry,
    );
    expect(result.source).toBe('builtin');
  });
});
