'use client';

import { useCallback, useEffect, useState } from 'react';

// ============================================================================
// Минимальные типы Telegram WebApp SDK (актуальны для Bot API 7.x+)
// ============================================================================

interface TelegramThemeParams {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
  header_bg_color?: string;
  accent_text_color?: string;
  section_bg_color?: string;
  section_header_text_color?: string;
  subtitle_text_color?: string;
  destructive_text_color?: string;
}

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

interface TelegramWebAppInitData {
  query_id?: string;
  user?: TelegramUser;
  auth_date: number;
  hash: string;
}

interface TelegramMainButton {
  text: string;
  color: string;
  textColor: string;
  isVisible: boolean;
  isActive: boolean;
  isProgressVisible: boolean;
  setText: (text: string) => void;
  onClick: (cb: () => void) => void;
  offClick: (cb: () => void) => void;
  show: () => void;
  hide: () => void;
  enable: () => void;
  disable: () => void;
  showProgress: (leaveActive?: boolean) => void;
  hideProgress: () => void;
}

interface TelegramBackButton {
  isVisible: boolean;
  onClick: (cb: () => void) => void;
  offClick: (cb: () => void) => void;
  show: () => void;
  hide: () => void;
}

interface TelegramHapticFeedback {
  impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
  notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
  selectionChanged: () => void;
}

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: TelegramWebAppInitData;
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: TelegramThemeParams;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  MainButton: TelegramMainButton;
  BackButton: TelegramBackButton;
  HapticFeedback: TelegramHapticFeedback;
  ready: () => void;
  expand: () => void;
  close: () => void;
  onEvent: (eventType: string, cb: () => void) => void;
  offEvent: (eventType: string, cb: () => void) => void;
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  enableClosingConfirmation: () => void;
  disableClosingConfirmation: () => void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

// ============================================================================
// useTelegram — безопасная (SSR-safe) интеграция с Telegram WebApp SDK
// ============================================================================

interface UseTelegramReturn {
  webApp: TelegramWebApp | null;
  user: TelegramUser | null;
  isReady: boolean;
  /** true, если приложение реально открыто внутри Telegram */
  isTelegramEnv: boolean;
  colorScheme: 'light' | 'dark';
  themeParams: TelegramThemeParams;
  showMainButton: (text: string, onClick: () => void) => void;
  hideMainButton: () => void;
  setMainButtonLoading: (loading: boolean) => void;
  showBackButton: (onClick: () => void) => void;
  hideBackButton: () => void;
  haptic: TelegramHapticFeedback | null;
  close: () => void;
}

export function useTelegram(): UseTelegramReturn {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('light');
  const [themeParams, setThemeParams] = useState<TelegramThemeParams>({});

  useEffect(() => {
    // Защита от SSR: Next.js App Router выполняет этот код и на сервере
    if (typeof window === 'undefined') return;

    const tg = window.Telegram?.WebApp;
    if (!tg) {
      // Приложение открыто вне Telegram (например, в браузере при разработке)
      setIsReady(true);
      return;
    }

    tg.ready();
    tg.expand();

    setWebApp(tg);
    setColorScheme(tg.colorScheme);
    setThemeParams(tg.themeParams);
    setIsReady(true);

    // Пробрасываем цвета темы Telegram в CSS-переменные приложения
    const applyTheme = () => {
      const root = document.documentElement;
      const params = tg.themeParams;
      if (params.bg_color) root.style.setProperty('--tg-bg-color', params.bg_color);
      if (params.text_color) root.style.setProperty('--tg-text-color', params.text_color);
      if (params.button_color) root.style.setProperty('--tg-button-color', params.button_color);
      if (params.secondary_bg_color) {
        root.style.setProperty('--tg-secondary-bg-color', params.secondary_bg_color);
      }
      setColorScheme(tg.colorScheme);
      setThemeParams({ ...params });
    };

    applyTheme();
    tg.onEvent('themeChanged', applyTheme);

    return () => {
      tg.offEvent('themeChanged', applyTheme);
    };
  }, []);

  const showMainButton = useCallback(
    (text: string, onClick: () => void) => {
      if (!webApp) return;
      webApp.MainButton.setText(text);
      webApp.MainButton.onClick(onClick);
      webApp.MainButton.show();
      webApp.MainButton.enable();
    },
    [webApp],
  );

  const hideMainButton = useCallback(() => {
    webApp?.MainButton.hide();
  }, [webApp]);

  const setMainButtonLoading = useCallback(
    (loading: boolean) => {
      if (!webApp) return;
      if (loading) {
        webApp.MainButton.showProgress(true);
        webApp.MainButton.disable();
      } else {
        webApp.MainButton.hideProgress();
        webApp.MainButton.enable();
      }
    },
    [webApp],
  );

  const showBackButton = useCallback(
    (onClick: () => void) => {
      if (!webApp) return;
      webApp.BackButton.onClick(onClick);
      webApp.BackButton.show();
    },
    [webApp],
  );

  const hideBackButton = useCallback(() => {
    webApp?.BackButton.hide();
  }, [webApp]);

  const close = useCallback(() => {
    webApp?.close();
  }, [webApp]);

  return {
    webApp,
    user: webApp?.initDataUnsafe.user ?? null,
    isReady,
    isTelegramEnv: Boolean(webApp),
    colorScheme,
    themeParams,
    showMainButton,
    hideMainButton,
    setMainButtonLoading,
    showBackButton,
    hideBackButton,
    haptic: webApp?.HapticFeedback ?? null,
    close,
  };
}
