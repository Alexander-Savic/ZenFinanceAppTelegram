"use client";

import { useEffect, type ReactNode } from "react";
import { TelegramProvider, useTelegram } from "@/lib/telegram-context";
import { useUserStore } from "@/store/useUserStore";
import { AuthProvider } from "@/components/AuthProvider";

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

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TelegramProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </TelegramProvider>
  );
}
