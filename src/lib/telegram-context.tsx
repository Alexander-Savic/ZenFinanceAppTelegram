"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  TelegramThemeParams,
  TelegramUnsafeUser,
  TelegramWebApp,
} from "@/types/telegram";

interface TelegramContextValue {
  /** True once window.Telegram.WebApp exists and ready()/expand() have run. */
  isReady: boolean;
  /** Raw signed string — the ONLY thing ever sent to the server for auth. */
  initData: string | null;
  /**
   * Client-visible user snapshot from initDataUnsafe. Use ONLY for optimistic
   * UI (e.g. showing a name before the auth round-trip resolves). Never treat
   * this as authenticated identity — the server re-derives identity from the
   * validated initData, not from this object.
   */
  unsafeUser: TelegramUnsafeUser | null;
  colorScheme: "light" | "dark";
  themeParams: TelegramThemeParams;
  platform: string | null;
  haptic: {
    impact: (style?: "light" | "medium" | "heavy" | "rigid" | "soft") => void;
    notify: (type: "error" | "success" | "warning") => void;
    selection: () => void;
  };
  mainButton: {
    show: (text: string, onClick: () => void) => void;
    hide: () => void;
    setLoading: (loading: boolean) => void;
  };
  backButton: {
    show: (onClick: () => void) => void;
    hide: () => void;
  };
}

const TelegramContext = createContext<TelegramContextValue | null>(null);

function getWebApp(): TelegramWebApp | null {
  if (typeof window === "undefined") return null;
  return window.Telegram?.WebApp ?? null;
}

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [initData, setInitData] = useState<string | null>(null);
  const [unsafeUser, setUnsafeUser] = useState<TelegramUnsafeUser | null>(null);
  const [colorScheme, setColorScheme] = useState<"light" | "dark">("light");
  const [themeParams, setThemeParams] = useState<TelegramThemeParams>({});
  const [platform, setPlatform] = useState<string | null>(null);

  useEffect(() => {
    const webApp = getWebApp();
    if (!webApp) {
      // Not running inside Telegram (e.g. local dev in a plain browser).
      // Leave isReady=false so callers can render a "open in Telegram" state.
      return;
    }

    webApp.ready();
    webApp.expand();

    setInitData(webApp.initData || null);
    setUnsafeUser(webApp.initDataUnsafe?.user ?? null);
    setColorScheme(webApp.colorScheme);
    setThemeParams(webApp.themeParams ?? {});
    setPlatform(webApp.platform ?? null);
    setIsReady(true);

    const handleThemeChange = () => {
      setColorScheme(webApp.colorScheme);
      setThemeParams(webApp.themeParams ?? {});
    };
    webApp.onEvent("themeChanged", handleThemeChange);

    return () => {
      webApp.offEvent("themeChanged", handleThemeChange);
    };
  }, []);

  const haptic = useMemo(
    () => ({
      impact: (style: "light" | "medium" | "heavy" | "rigid" | "soft" = "light") =>
        getWebApp()?.HapticFeedback.impactOccurred(style),
      notify: (type: "error" | "success" | "warning") =>
        getWebApp()?.HapticFeedback.notificationOccurred(type),
      selection: () => getWebApp()?.HapticFeedback.selectionChanged(),
    }),
    []
  );

  const lastMainButtonHandler = useRef<(() => void) | null>(null);

  const mainButton = useMemo(
    () => ({
      show: (text: string, onClick: () => void) => {
        const webApp = getWebApp();
        if (!webApp) return;
        // Telegram's onClick is additive (no implicit replace), so every call
        // here must explicitly unregister the previous handler first or the
        // WebApp keeps invoking stale closures alongside the new one.
        if (lastMainButtonHandler.current) {
          webApp.MainButton.offClick(lastMainButtonHandler.current);
        }
        webApp.MainButton.setText(text);
        webApp.MainButton.onClick(onClick);
        lastMainButtonHandler.current = onClick;
        webApp.MainButton.show();
      },
      hide: () => {
        const webApp = getWebApp();
        if (webApp && lastMainButtonHandler.current) {
          webApp.MainButton.offClick(lastMainButtonHandler.current);
          lastMainButtonHandler.current = null;
        }
        webApp?.MainButton.hide();
      },
      setLoading: (loading: boolean) => {
        const webApp = getWebApp();
        if (!webApp) return;
        if (loading) webApp.MainButton.disable();
        else webApp.MainButton.enable();
      },
    }),
    []
  );

  const lastBackButtonHandler = useRef<(() => void) | null>(null);

  const backButton = useMemo(
    () => ({
      show: (onClick: () => void) => {
        const webApp = getWebApp();
        if (!webApp) return;
        if (lastBackButtonHandler.current) {
          webApp.BackButton.offClick(lastBackButtonHandler.current);
        }
        webApp.BackButton.onClick(onClick);
        lastBackButtonHandler.current = onClick;
        webApp.BackButton.show();
      },
      hide: () => {
        const webApp = getWebApp();
        if (webApp && lastBackButtonHandler.current) {
          webApp.BackButton.offClick(lastBackButtonHandler.current);
          lastBackButtonHandler.current = null;
        }
        webApp?.BackButton.hide();
      },
    }),
    []
  );

  const value = useMemo(
    () => ({
      isReady,
      initData,
      unsafeUser,
      colorScheme,
      themeParams,
      platform,
      haptic,
      mainButton,
      backButton,
    }),
    [isReady, initData, unsafeUser, colorScheme, themeParams, platform, haptic, mainButton, backButton]
  );

  return <TelegramContext.Provider value={value}>{children}</TelegramContext.Provider>;
}

export function useTelegram(): TelegramContextValue {
  const ctx = useContext(TelegramContext);
  
  // Возвращаем фоллбек-объект, если компонент рендерится вне провайдера на сервере/при сборке
  if (!ctx) {
    return {
      isReady: false,
      initData: null,
      unsafeUser: null,
      colorScheme: "light",
      themeParams: {},
      platform: null,
      haptic: {
        impact: () => {},
        notify: () => {},
        selection: () => {},
      },
      mainButton: {
        show: () => {},
        hide: () => {},
        setLoading: () => {},
      },
      backButton: {
        show: () => {},
        hide: () => {},
      },
    };
  }
  
  return ctx;
}

/** Convenience hook for a single MainButton binding scoped to a screen. */
export function useMainButton(text: string, onClick: () => void, deps: unknown[] = []) {
  const { mainButton } = useTelegram();
  const stableOnClick = useCallback(onClick, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    mainButton.show(text, stableOnClick);
    return () => mainButton.hide();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, stableOnClick]);
}
