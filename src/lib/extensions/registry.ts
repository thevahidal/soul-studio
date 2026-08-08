import { plugins } from './registry.generated';
import type {
  StudioFieldRenderer,
  StudioNavItem,
  StudioPlugin,
  StudioRowAction,
} from './types';

export interface ExtensionRegistry {
  navItems: StudioNavItem[];
  fieldRenderers: Map<string, StudioFieldRenderer['component']>;
  rowActions: Map<string, StudioRowAction[]>;
}

const fieldRendererKey = (table: string, column: string) =>
  `${table}.${column}`;

// Pure so it's unit-testable against fake StudioPlugin fixtures without
// ever touching the filesystem or running the codegen script.
export const buildRegistry = (
  pluginList: StudioPlugin[],
  { warn = console.warn }: { warn?: (msg: string) => void } = {},
): ExtensionRegistry => {
  const navItems: StudioNavItem[] = [];
  const fieldRenderers = new Map<string, StudioFieldRenderer['component']>();
  const fieldRendererSource = new Map<string, number>();
  const rowActions = new Map<string, StudioRowAction[]>();

  pluginList.forEach((plugin, index) => {
    navItems.push(...(plugin.navItems ?? []));

    (plugin.fieldRenderers ?? []).forEach((renderer) => {
      const key = fieldRendererKey(renderer.table, renderer.column);
      const previousSource = fieldRendererSource.get(key);
      if (previousSource !== undefined) {
        warn(
          `[soul-studio extensions] fieldRenderer collision for "${key}": ` +
            `plugin #${index} overrides plugin #${previousSource}`,
        );
      }
      fieldRenderers.set(key, renderer.component);
      fieldRendererSource.set(key, index);
    });

    (plugin.rowActions ?? []).forEach((action) => {
      const existing = rowActions.get(action.table) ?? [];
      rowActions.set(action.table, [...existing, action]);
    });
  });

  return { navItems, fieldRenderers, rowActions };
};

export const registry = buildRegistry(plugins);
