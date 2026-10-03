"use client";

import { useEffect, useState, type ReactNode } from "react";
import { RefreshCw, TriangleAlert, Smartphone } from "lucide-react";
import { useTelegram } from "@/lib/telegram-context";
import { useUserStore } from "@/store/useUserStore";

const NOT_IN_TELEGRAM_GRACE_MS = 1500;

export function AppGate({ children }: { children: ReactNode }) {
  const { isReady, initData } = useTelegram();
  const status = useUserStore((s) => s.status);
  const error = useUserStore((s) => s.error);
  const authenticate = useUserStore((s) => s.authenticate);

  const [grace, setGrace] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setGrace(false), NOT_IN_TELEGRAM_GRACE_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    if (initData) {
      authenticate(initData);
    } else if (process.env.NODE_ENV === "development") {
      console.warn("⚠️ Запуск вне Telegram: вход в тестовом режиме");
      authenticate("dev_mock_init_data");
    }
  }, [isReady, initData, authenticate]);

  if (!isReady && !grace) {
    return (
      <CenteredState
        icon={<Smartphone className="h-8 w-8" />}
        title="Откройте в Telegram"
        description="ZenFinance работает как Mini App внутри Telegram. Откройте бота и запустите приложение оттуда."
      />
    );
  }

  if (status === "error") {
    return (
      <CenteredState
        icon={<TriangleAlert className="h-8 w-8 text-danger" />}
        title="Не удалось войти"
        description={error ?? "Проверьте соединение и попробуйте снова."}
        action={
          <button
            onClick={() => authenticate(initData || "dev_mock_init_data")}
            className="mt-4 flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
          >
            <RefreshCw className="h-4 w-4" /> Повторить
          </button>
        }
      />
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="flex h-dvh items-center justify-center bg-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}

function CenteredState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-3 bg-bg px-8 text-center">
      <div className="text-secondary">{icon}</div>
      <h1 className="text-lg font-semibold text-primary">{title}</h1>
      <p className="max-w-xs text-sm text-secondary">{description}</p>
      {action}
    </div>
  );
}