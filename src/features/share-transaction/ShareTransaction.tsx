'use client';

import { useState, type FC } from 'react';
import { Share2, Copy, Check, X } from 'lucide-react';
import type { Account, Category, Transaction } from '@/shared/types/finance';
import { buildSharePayload, buildShareUrl } from '@/shared/utils/shareLink';
import { ReceiptCard } from '@/entities/transaction/ReceiptCard';
import { useTelegram } from '@/shared/hooks/useTelegram';

export interface ShareTransactionProps {
  transaction: Transaction;
  category?: Category;
  account?: Account;
}

export const ShareTransaction: FC<ShareTransactionProps> = ({ transaction, category, account }) => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { webApp } = useTelegram();

  const payload = buildSharePayload(transaction, category, account);
  const url = buildShareUrl(payload);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const handleShare = () => {
    const text = `${category?.name ?? 'Операция'} — чек из Finance Tracker`;
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;

    const tg = webApp as (typeof webApp & { openTelegramLink?: (url: string) => void; openLink?: (url: string) => void }) | null;

    if (tg?.openTelegramLink) {
      tg.openTelegramLink(shareUrl);
      return;
    }

    if (tg?.openLink) {
      tg.openLink(shareUrl);
      return;
    }

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      navigator.share({ url, text }).catch(() => {});
      return;
    }

    handleCopy();
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-full bg-black/[0.05] px-3 py-1.5 text-xs font-medium text-black/60"
      >
        <Share2 className="h-3.5 w-3.5" />
        Поделиться
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-t-3xl bg-[#F5F6F8] p-4 pb-6">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium text-black/70">Публичная ссылка на операцию</p>
              <button onClick={() => setOpen(false)} aria-label="Закрыть">
                <X className="h-4 w-4 text-black/40" />
              </button>
            </div>

            <ReceiptCard payload={payload} />

            <p className="mt-4 px-1 text-[11px] text-black/40">
              По ссылке откроется изолированная read-only страница — без доступа к остальным вашим данным.
            </p>

            <div className="mt-3 flex gap-2">
              <button
                onClick={handleCopy}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white px-3 py-2.5 text-sm font-medium text-black/70"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Скопировано' : 'Скопировать ссылку'}
              </button>
              <button
                onClick={handleShare}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-medium text-white"
                style={{ backgroundColor: 'var(--primary)' }}
              >
                <Share2 className="h-4 w-4" />
                Отправить
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};