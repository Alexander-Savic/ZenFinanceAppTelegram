import type { Account, Category, Transaction } from '@/shared/types/finance';

// ============================================================================
// Публичная ссылка на "чек" операции.
//
// Осознанное архитектурное решение: вместо серверного хранилища с опаковым
// токеном полезная нагрузка кодируется прямо в URL (base64url JSON). Это не
// требует бэкенда и БД для MVP. В продакшене для отзываемых ссылок и более
// компактных URL стоит заменить на серверный токен, резолвящийся через API —
// сигнатуры buildShareUrl/parseSharePayload при этом не изменятся.
// ============================================================================

export interface SharePayload {
  transactionId: string;
  amount: number;
  type: Transaction['type'];
  currency: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  accountName: string;
  date: string;
  comment?: string;
  tags: string[];
}

function toBase64Url(json: string): string {
  const base64 =
    typeof window === 'undefined'
      ? Buffer.from(json, 'utf-8').toString('base64')
      : btoa(unescape(encodeURIComponent(json)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(token: string): string {
  const padded = token.padEnd(token.length + ((4 - (token.length % 4)) % 4), '=');
  const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
  return typeof window === 'undefined'
    ? Buffer.from(base64, 'base64').toString('utf-8')
    : decodeURIComponent(escape(atob(base64)));
}

export function encodeSharePayload(payload: SharePayload): string {
  return toBase64Url(JSON.stringify(payload));
}

/** Возвращает null для повреждённого, неполного или неверно сформированного токена */
export function parseSharePayload(token: string): SharePayload | null {
  try {
    const parsed = JSON.parse(fromBase64Url(token)) as Partial<SharePayload>;
    if (!parsed.transactionId || typeof parsed.amount !== 'number' || !parsed.type) return null;
    return parsed as SharePayload;
  } catch {
    return null;
  }
}

export function buildSharePayload(
  transaction: Transaction,
  category: Category | undefined,
  account: Account | undefined,
): SharePayload {
  return {
    transactionId: transaction.id,
    amount: transaction.amount,
    type: transaction.type,
    currency: account?.currency ?? 'RUB',
    categoryName: category?.name ?? 'Операция',
    categoryIcon: category?.icon ?? '💳',
    categoryColor: category?.color ?? '#9CA3AF',
    accountName: account?.name ?? 'Счёт',
    date: transaction.date,
    comment: transaction.comment,
    tags: transaction.tags,
  };
}

export function buildShareUrl(payload: SharePayload, origin?: string): string {
  const base = origin ?? (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}/share/${encodeSharePayload(payload)}`;
}
