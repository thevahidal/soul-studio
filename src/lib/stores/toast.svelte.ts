import { toast as sonnerToast } from 'svelte-sonner';

export interface Toast {
  id: number;
  message: string;
  variant: 'info' | 'error' | 'success';
}

const createToastStore = () => {
  const push = (message: string, variant: Toast['variant'] = 'info') => {
    if (variant === 'success') {
      sonnerToast.success(message);
    } else if (variant === 'error') {
      sonnerToast.error(message);
    } else {
      sonnerToast.message(message);
    }
  };

  const dismiss = (id: number | string) => {
    sonnerToast.dismiss(id);
  };

  return { push, dismiss };
};

export const toast = createToastStore();
