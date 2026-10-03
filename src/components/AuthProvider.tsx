'use client';

import { useEffect, useState, createContext, useContext } from 'react';
import { useTelegram } from '@/lib/telegram-context';

interface AuthContextType {
  user: any;
  isLoading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isReady, initData } = useTelegram();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      if (!isReady) return;

      try {
        const meRes = await fetch('/api/auth/me');
        if (meRes.ok) {
          const userData = await meRes.json();
          setUser(userData);
          setIsLoading(false);
          return;
        }

        if (initData) {
          const tgRes = await fetch('/api/auth/telegram', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initData }),
          });

          if (tgRes.ok) {
            const data = await tgRes.json();
            setUser(data.user);
          } else {
            console.error('Telegram auth failed with status:', tgRes.status);
          }
        } else {
          console.warn('initData отсутствует. Приложение открыто вне Telegram.');
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, [isReady, initData]);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);