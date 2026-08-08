import type { Component } from 'svelte';

// Deliberately small and fixed -- plugins customize how the built-in,
// metadata-driven screens render (nav, field widgets, row actions), they
// don't define new screens or business logic. See docs/extensions/.
export interface StudioNavItem {
  label: string;
  href: string;
  icon?: string;
}

export interface StudioFieldRenderer {
  table: string;
  column: string;
  component: Component;
}

export interface StudioRowAction {
  table: string;
  label: string;
  onClick: (row: Record<string, unknown>) => void;
}

export interface StudioPlugin {
  navItems?: StudioNavItem[];
  fieldRenderers?: StudioFieldRenderer[];
  rowActions?: StudioRowAction[];
  widgets?: Record<string, Component>;
}
