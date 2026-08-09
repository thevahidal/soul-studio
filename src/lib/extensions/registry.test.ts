import { describe, expect, it, vi } from 'vitest';
import { buildRegistry } from './registry';
import type { Component } from 'svelte';

const FakeComponent = (() => {}) as unknown as Component;

describe('buildRegistry', () => {
  it('flattens nav items from every plugin, in order', () => {
    const registry = buildRegistry([
      { navItems: [{ label: 'Reports', href: '/reports' }] },
      { navItems: [{ label: 'Billing', href: '/billing' }] },
    ]);

    expect(registry.navItems.map((item) => item.label)).toEqual([
      'Reports',
      'Billing',
    ]);
  });

  it('resolves a fieldRenderer for the exact table.column key', () => {
    const registry = buildRegistry([
      {
        fieldRenderers: [
          { table: 'orders', column: 'status', component: FakeComponent },
        ],
      },
    ]);

    expect(registry.fieldRenderers.get('orders.status')).toBe(FakeComponent);
    expect(registry.fieldRenderers.get('orders.other')).toBeUndefined();
  });

  it('resolves a fieldRenderer collision as last-file-wins and warns', () => {
    const first = FakeComponent;
    const second = (() => {}) as unknown as typeof FakeComponent;
    const warn = vi.fn();

    const registry = buildRegistry(
      [
        {
          fieldRenderers: [
            { table: 'orders', column: 'status', component: first },
          ],
        },
        {
          fieldRenderers: [
            { table: 'orders', column: 'status', component: second },
          ],
        },
      ],
      { warn },
    );

    expect(registry.fieldRenderers.get('orders.status')).toBe(second);
    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0][0]).toContain('orders.status');
  });

  it('groups row actions by table', () => {
    const onClick = () => {};
    const registry = buildRegistry([
      { rowActions: [{ table: 'orders', label: 'Refund', onClick }] },
      { rowActions: [{ table: 'orders', label: 'Flag', onClick }] },
      { rowActions: [{ table: 'users', label: 'Ban', onClick }] },
    ]);

    expect(registry.rowActions.get('orders')?.map((a) => a.label)).toEqual([
      'Refund',
      'Flag',
    ]);
    expect(registry.rowActions.get('users')?.map((a) => a.label)).toEqual([
      'Ban',
    ]);
  });

  it('handles an empty plugin list', () => {
    const registry = buildRegistry([]);

    expect(registry.navItems).toEqual([]);
    expect(registry.fieldRenderers.size).toBe(0);
    expect(registry.rowActions.size).toBe(0);
  });
});
