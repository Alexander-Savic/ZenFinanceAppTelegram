'use client';

import { useEffect, useState, createContext, useContext } from 'react';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

interface TelegramContextType {
  user: TelegramUser | null;
  webApp: any;
}

const TelegramContext = createContext<TelegramContextType>({
  user: null,
  webApp: null,
});

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [webApp, setWebApp] = useState<any>(null);
  const [user, setUser] = useState<TelegramUser | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      
      // Сигнализируем Telegram, что приложение готово
      tg.ready();
      // Раскрываем шторку на весь экран
      tg.expand();

      setWebApp(tg);
      setUser(tg.initDataUnsafe?.user || null);
    }
  }, []);

  return (
    <TelegramContext.Provider value={{ user, webApp }}>
      {children}
    </TelegramContext.Provider>
  );
}

export const useTelegram = () => useContext(TelegramContext);