import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";

type NotificationType = "success" | "error" | "info";

type NotificationItem = {
  id: number;
  type: NotificationType;
  message: string;
};

type NotifyOptions = {
  type: NotificationType;
  message: string;
  durationMs?: number;
};

type NotificationContextValue = {
  notify: (options: NotifyOptions) => number;
  notifySuccess: (message: string, durationMs?: number) => number;
  notifyError: (message: string, durationMs?: number) => number;
  notifyInfo: (message: string, durationMs?: number) => number;
  dismiss: (id: number) => void;
};

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

const DEFAULT_DURATION_MS = 3500;

function toastClass(type: NotificationType): string {
  if (type === "success") {
    return "border-emerald-300 bg-emerald-50 text-emerald-800";
  }
  if (type === "error") {
    return "border-red-300 bg-red-50 text-red-800";
  }
  return "border-sky-300 bg-sky-50 text-sky-800";
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<NotificationItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const notify = useCallback(
    ({ type, message, durationMs = DEFAULT_DURATION_MS }: NotifyOptions): number => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      setItems((prev) => [...prev, { id, type, message }]);

      if (durationMs > 0) {
        window.setTimeout(() => dismiss(id), durationMs);
      }

      return id;
    },
    [dismiss]
  );

  const value = useMemo<NotificationContextValue>(
    () => ({
      notify,
      notifySuccess: (message: string, durationMs?: number) => notify({ type: "success", message, durationMs }),
      notifyError: (message: string, durationMs?: number) => notify({ type: "error", message, durationMs }),
      notifyInfo: (message: string, durationMs?: number) => notify({ type: "info", message, durationMs }),
      dismiss,
    }),
    [notify, dismiss]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(92vw,360px)] flex-col gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={`pointer-events-auto rounded-xl border px-4 py-3 text-sm shadow-lg ${toastClass(item.type)}`}
          >
            <div className="flex items-start gap-3">
              <p className="flex-1">{item.message}</p>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                className="rounded-md px-1 text-xs font-semibold hover:bg-black/5"
                aria-label="Close notification"
              >
                x
              </button>
            </div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within NotificationProvider");
  }
  return context;
}
