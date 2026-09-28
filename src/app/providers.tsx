"use client";

import { useEffect, type ReactNode } from "react";
import { TelegramProvider, useTelegram } from "@/lib/telegram-context";
import { useUserStore } from "@/store/useUserStore";
import { ThemeSync } from "@/components/ThemeSync";

function AuthBootstrapper({ children }: { children: ReactNode }) {
  const { isReady, initData } = useTelegram();
  const status = useUserStore((s) => s.status);
  const authenticate = useUserStore((s) => s.authenticate);

  useEffect(() => {
    if (isReady && initData && status === "idle") {
      authenticate(initData);
    }
  }, [isReady, initData, status, authenticate]);

  return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <TelegramProvider>
      <AuthBootstrapper>
        <ThemeSync />
        {children}
      </AuthBootstrapper>
    </TelegramProvider>
  );
}
