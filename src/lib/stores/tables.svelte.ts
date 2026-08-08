import { listTables } from '$lib/api/tables';
import type { TableListItem } from '$lib/api/types';
import { isHttpError } from '$lib/api/errors';

type TablesStatus = 'idle' | 'loading' | 'loaded' | 'forbidden' | 'error';

const createTablesStore = () => {
  let tables = $state<TableListItem[]>([]);
  let status = $state<TablesStatus>('idle');
  let errorMessage = $state<string | null>(null);

  const load = async () => {
    status = 'loading';
    try {
      const res = await listTables();
      tables = res.data;
      status = 'loaded';
    } catch (err) {
      // Table list/create have no `:name` route param, so Soul's permission
      // check always denies non-superusers here -- see
      // soul/src/middlewares/auth.js. This is a documented backend
      // limitation, not something this store can work around.
      if (isHttpError(err) && err.status === 403) {
        status = 'forbidden';
      } else {
        errorMessage = isHttpError(err)
          ? err.message
          : 'Failed to load tables.';
        status = 'error';
      }
    }
  };

  const ensureLoaded = () => {
    if (status === 'idle') void load();
  };

  const reset = () => {
    tables = [];
    status = 'idle';
    errorMessage = null;
  };

  return {
    get tables() {
      return tables;
    },
    get status() {
      return status;
    },
    get errorMessage() {
      return errorMessage;
    },
    ensureLoaded,
    reload: load,
    reset,
  };
};

export const tablesStore = createTablesStore();
