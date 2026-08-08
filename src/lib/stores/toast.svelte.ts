export interface Toast {
  id: number;
  message: string;
  variant: 'info' | 'error' | 'success';
}

const createToastStore = () => {
  let toasts = $state<Toast[]>([]);
  let nextId = 0;

  const dismiss = (id: number) => {
    toasts = toasts.filter((toast) => toast.id !== id);
  };

  const push = (message: string, variant: Toast['variant'] = 'info') => {
    const id = nextId++;
    toasts = [...toasts, { id, message, variant }];
    setTimeout(() => dismiss(id), 5000);
  };

  return {
    get toasts() {
      return toasts;
    },
    push,
    dismiss,
  };
};

export const toast = createToastStore();
