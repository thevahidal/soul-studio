import { describe, expect, it } from 'vitest';
import { normalizeSqlType, schemaToForm } from './schemaToForm';
import type { ForeignKeyListEntry, TableSchemaColumn } from '$lib/api/types';

describe('normalizeSqlType', () => {
  it('passes through exact Soul-created types unchanged', () => {
    expect(normalizeSqlType('TEXT')).toBe('TEXT');
    expect(normalizeSqlType('INTEGER')).toBe('INTEGER');
    expect(normalizeSqlType('BOOLEAN')).toBe('BOOLEAN');
    expect(normalizeSqlType('DATETIME')).toBe('DATETIME');
  });

  it('is case-insensitive', () => {
    expect(normalizeSqlType('text')).toBe('TEXT');
    expect(normalizeSqlType('Integer')).toBe('INTEGER');
  });

  it('falls back to SQLite type-affinity rules for non-standard type strings', () => {
    expect(normalizeSqlType('VARCHAR(255)')).toBe('TEXT');
    expect(normalizeSqlType('BIGINT')).toBe('INTEGER');
    expect(normalizeSqlType('DOUBLE')).toBe('REAL');
    expect(normalizeSqlType('TIMESTAMP')).toBe('DATETIME');
    expect(normalizeSqlType('CLOB')).toBe('TEXT');
  });

  it('defaults unrecognized types to NUMERIC per SQLite affinity rules', () => {
    expect(normalizeSqlType('')).toBe('NUMERIC');
    expect(normalizeSqlType('SOMETHING_WEIRD')).toBe('NUMERIC');
  });
});

describe('schemaToForm', () => {
  const columns: TableSchemaColumn[] = [
    {
      cid: 0,
      name: 'id',
      type: 'INTEGER',
      notnull: 1,
      dflt_value: null,
      pk: 1,
    },
    {
      cid: 1,
      name: 'title',
      type: 'TEXT',
      notnull: 1,
      dflt_value: null,
      pk: 0,
    },
    {
      cid: 2,
      name: 'authorId',
      type: 'INTEGER',
      notnull: 0,
      dflt_value: null,
      pk: 0,
    },
    {
      cid: 3,
      name: 'createdAt',
      type: 'DATETIME',
      notnull: 0,
      dflt_value: 'CURRENT_TIMESTAMP',
      pk: 0,
    },
  ];

  const foreignKeys: ForeignKeyListEntry[] = [
    {
      id: 0,
      seq: 0,
      table: 'authors',
      from: 'authorId',
      to: 'id',
      on_update: 'RESTRICT',
      on_delete: 'CASCADE',
      match: 'NONE',
    },
  ];

  it('maps every column to a FieldDescriptor', () => {
    const fields = schemaToForm(columns, foreignKeys);
    expect(fields).toHaveLength(4);
  });

  it('marks the primary key column', () => {
    const fields = schemaToForm(columns, foreignKeys);
    expect(fields.find((f) => f.name === 'id')?.isPrimaryKey).toBe(true);
    expect(fields.find((f) => f.name === 'title')?.isPrimaryKey).toBe(false);
  });

  it('treats notnull-with-no-default as required, and notnull-with-default as not required', () => {
    const fields = schemaToForm(columns, foreignKeys);
    expect(fields.find((f) => f.name === 'title')?.required).toBe(true);
    // createdAt is nullable in this fixture; also verify a notnull+default
    // column is NOT required, since a default value means omission is fine.
    const withDefault = schemaToForm(
      [
        {
          cid: 0,
          name: 'status',
          type: 'TEXT',
          notnull: 1,
          dflt_value: 'pending',
          pk: 0,
        },
      ],
      [],
    );
    expect(withDefault[0].required).toBe(false);
  });

  it('attaches foreignKey info to the matching column only', () => {
    const fields = schemaToForm(columns, foreignKeys);
    expect(fields.find((f) => f.name === 'authorId')?.foreignKey).toEqual({
      table: 'authors',
      column: 'id',
    });
    expect(fields.find((f) => f.name === 'title')?.foreignKey).toBeUndefined();
  });

  it('defaults to an empty foreignKeys list', () => {
    const fields = schemaToForm(columns);
    expect(fields.every((f) => f.foreignKey === undefined)).toBe(true);
  });
});
