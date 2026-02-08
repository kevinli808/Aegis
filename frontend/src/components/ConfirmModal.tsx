import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ConfirmModalContextValue {
  confirm: (message: string, options?: { confirmLabel?: string; cancelLabel?: string; variant?: 'danger' | 'default' }) => Promise<boolean>;
}

const ConfirmModalContext = createContext<ConfirmModalContextValue | null>(null);

export function useConfirm() {
  const ctx = useContext(ConfirmModalContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmModalProvider');
  return ctx;
}

interface ConfirmState {
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  variant: 'danger' | 'default';
  resolve: (value: boolean) => void;
}

export function ConfirmModalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfirmState | null>(null);

  const confirm = useCallback(
    (
      message: string,
      options?: { confirmLabel?: string; cancelLabel?: string; variant?: 'danger' | 'default' },
    ): Promise<boolean> => {
      return new Promise((resolve) => {
        setState({
          message,
          confirmLabel: options?.confirmLabel ?? 'Yes',
          cancelLabel: options?.cancelLabel ?? 'Cancel',
          variant: options?.variant ?? 'default',
          resolve,
        });
      });
    },
    [],
  );

  const handleConfirm = useCallback(() => {
    state?.resolve(true);
    setState(null);
  }, [state]);

  const handleCancel = useCallback(() => {
    state?.resolve(false);
    setState(null);
  }, [state]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) handleCancel();
    },
    [handleCancel],
  );

  const modalEl =
    state &&
    createPortal(
      <div
        className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4"
        onClick={handleBackdropClick}
      >
        <div
          className="w-full max-w-md rounded-xl bg-white p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-gray-800 whitespace-pre-wrap">{state.message}</p>
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={handleCancel}
              className="rounded-lg border-2 border-gray-100 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {state.cancelLabel}
            </button>
            <button
              onClick={handleConfirm}
              className={
                state.variant === 'danger'
                  ? 'rounded-lg border-2 border-red-100 bg-red-600 px-4 py-2 text-white hover:bg-red-700 transition-colors'
                  : 'rounded-lg border-2 border-blue-100 bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors'
              }
            >
              {state.confirmLabel}
            </button>
          </div>
        </div>
      </div>,
      document.body,
    );

  return (
    <ConfirmModalContext.Provider value={{ confirm }}>
      {children}
      {modalEl}
    </ConfirmModalContext.Provider>
  );
}
