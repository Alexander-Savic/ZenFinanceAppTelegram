'use client';

import { type FC } from 'react';
import { Home, Wallet, BarChart2, Target, Settings } from 'lucide-react';

export type TabType = 'home' | 'accounts' | 'analytics' | 'goals' | 'settings';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
}

export const BottomNav: FC<BottomNavProps> = ({ activeTab, onChangeTab }) => {
  const tabs = [
    { id: 'home' as TabType, label: 'Обзор', icon: Home },
    { id: 'accounts' as TabType, label: 'Счета', icon: Wallet },
    { id: 'analytics' as TabType, label: 'Аналитика', icon: BarChart2 },
    { id: 'goals' as TabType, label: 'Цели', icon: Target },
    { id: 'settings' as TabType, label: 'Ещё', icon: Settings },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 mx-auto max-w-md border-t border-black/5 bg-white/90 backdrop-blur-md pb-safe">
      <div className="flex items-center justify-around py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex flex-col items-center gap-1 px-3 py-1 text-xs font-medium transition-colors ${
                isActive ? 'text-[#059669]' : 'text-black/40 hover:text-black/60'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};