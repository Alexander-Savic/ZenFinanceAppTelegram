import { type FC } from 'react';
import type { SharePayload } from '@/shared/utils/shareLink';

function formatAmount(amount: number, currency: string, type: SharePayload['type']): string {
  const sign = type === 'income' ? '+' : type === 'expense' ? '−' : '';
  const value = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(Math.abs(amount));
  const symbol = currency === 'RUB' ? '₽' : currency;
  return `${sign}${value} ${symbol}`;
}

export interface ReceiptCardProps {
  payload: SharePayload;
}

export const ReceiptCard: FC<ReceiptCardProps> = ({ payload }) => {
  const date = new Date(payload.date);
  const amountColor = payload.type === 'income' ? '#059669' : '#12131A';

  return (
    <div className="relative mx-auto w-full max-w-xs overflow-hidden rounded-t-2xl bg-white pb-8 pt-6 shadow-[0_18px_40px_-18px_rgba(0,0,0,0.25)]">
      <div className="flex flex-col items-center gap-3 px-6 text-center">
        <span
          className="flex h-14 w-14 items-center justify-center rounded-full text-2xl"
          style={{ backgroundColor: `${payload.categoryColor}1A` }}
        >
          {payload.categoryIcon}
        </span>
        <p className="text-3xl font-semibold tabular-nums" style={{ color: amountColor }}>
          {formatAmount(payload.amount, payload.currency, payload.type)}
        </p>
        <p className="text-sm text-black/50">{payload.categoryName}</p>
      </div>

      <div className="mx-6 mt-6 flex flex-col gap-2 border-t border-dashed border-black/10 pt-4 text-sm">
        <Row
          label="Дата"
          value={new Intl.DateTimeFormat('ru-RU', {
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit',
          }).format(date)}
        />
        <Row label="Счёт" value={payload.accountName} />
        {payload.comment && <Row label="Комментарий" value={payload.comment} />}
        {payload.tags.length > 0 && <Row label="Теги" value={payload.tags.join(', ')} />}
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 h-4"
        style={{
          backgroundImage: 'radial-gradient(circle at 8px 4px, transparent 7px, white 7px)',
          backgroundSize: '16px 16px',
          backgroundPosition: '-4px 0',
        }}
      />
    </div>
  );
};

const Row: FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-baseline justify-between gap-4">
    <span className="flex-shrink-0 text-black/40">{label}</span>
    <span className="text-right text-black/75">{value}</span>
  </div>
);
