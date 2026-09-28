'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Zap } from 'lucide-react';
import { useTransactionStore } from '@/store/useTransactionStore';

interface Template {
  id: string;
  title: string;
  amount: number;
  currency: string;
  type: 'EXPENSE' | 'INCOME';
  categoryId?: string;
  accountId?: string;
}

export const QuickTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const { addTransaction } = useTransactionStore();

  useEffect(() => {
    fetch('/api/templates')
      .then((res) => res.json())
      .then((data) => setTemplates(data))
      .catch((err) => console.error('Failed to load templates', err));
  }, []);

  const handleApplyTemplate = async (template: Template) => {
    // Вызов виброотклика Telegram WebApp
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }

    await addTransaction({
      amount: template.amount,
      type: template.type,
      currency: template.currency,
      description: template.title,
      categoryId: template.categoryId,
      accountId: template.accountId,
    });
  };

  if (templates.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-1.5 mb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        <Zap className="w-3.5 h-3.5 text-amber-500" />
        <span>Быстрые операции</span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {templates.map((tpl) => (
          <button
            key={tpl.id}
            onClick={() => handleApplyTemplate(tpl)}
            className="flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-700/60 hover:border-violet-500 transition-all text-left whitespace-nowrap active:scale-95"
          >
            <div className="flex flex-col">
              <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
                {tpl.title}
              </span>
              <span className="text-[11px] font-bold text-violet-600 dark:text-violet-400">
                {tpl.type === 'EXPENSE' ? '-' : '+'}{tpl.amount} {tpl.currency}
              </span>
            </div>
            <Plus className="w-3.5 h-3.5 text-gray-400 ml-1" />
          </button>
        ))}
      </div>
    </div>
  );
};