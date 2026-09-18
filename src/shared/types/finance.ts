// ============================================================================
// Финансовый трекер (Telegram Mini App) — Глобальные типы домена
// ============================================================================

/** Валюта счёта/транзакции. ISO 4217 + популярные крипто-тикеры */
export type CurrencyCode =
  | 'RUB' | 'USD' | 'EUR' | 'KZT' | 'BYN' | 'UAH'
  | 'BTC' | 'ETH' | 'USDT' | 'TON'
  | (string & {}); // допускаем произвольные коды, сохраняя автокомплит для известных

/** Тип финансовой операции */
export type TransactionType = 'income' | 'expense' | 'transfer';

/** Тип счёта */
export type AccountType = 'card' | 'wallet' | 'crypto';

/** Поддерживаемые платёжные системы для карт (используется в AccountCard) */
export type CardPaymentSystem = 'visa' | 'mastercard' | 'mir' | 'unionpay' | 'other';

/** Периодичность бюджета */
export type BudgetPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

/** Частота регулярного платежа */
export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

/** Настройки регулярного (повторяющегося) платежа */
export interface RecurringSettings {
  /** Включена ли регулярность */
  enabled: boolean;
  /** Базовая частота повторения */
  frequency: RecurrenceFrequency;
  /** Множитель интервала (напр. "каждые 2 недели" → frequency: 'weekly', interval: 2) */
  interval: number;
  /** Дата следующего платежа (ISO 8601) */
  nextDate: string;
  /** Дата окончания регулярности, если ограничена */
  endDate?: string | null;
  /** Кол-во оставшихся повторов, если задано числом, а не датой */
  remainingOccurrences?: number | null;
}

/** Категория операции (справочник) */
export interface Category {
  id: string;
  name: string;
  /** Имя иконки (lucide-react) или emoji */
  icon: string;
  /** HEX-цвет или CSS-переменная */
  color: string;
  type: TransactionType;
  /** Поддержка вложенных подкатегорий */
  parentId?: string | null;
}

/** Кастомный UI-дизайн счёта (используется в AccountCard, Шаг 2) */
export interface AccountDesign {
  /** CSS-градиент фона карты, напр. "linear-gradient(135deg, #6D28D9, #DB2777)" */
  gradient?: string;
  /** Сплошной акцентный цвет (для кошельков/крипты) */
  color?: string;
  /** Имя иконки или emoji */
  icon?: string;
  /** Платёжная система — актуально только для type: 'card' */
  paymentSystem?: CardPaymentSystem;
  /** Стиль поверхности карты */
  texture?: 'matte' | 'glossy' | 'glass';
}

/** Счёт пользователя */
export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: CurrencyCode;
  design: AccountDesign;
  /** Скрыт ли счёт из общего баланса (архивный/накопительный) */
  isArchived?: boolean;
  /** Порядок отображения в списке */
  order?: number;
  createdAt: string;
  updatedAt: string;
}

/** Финансовая операция */
export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  tags: string[];
  /** ISO 8601 дата операции */
  date: string;
  comment?: string;
  accountId: string;
  /** Для type: 'transfer' — счёт назначения */
  toAccountId?: string;
  /** Является ли операция шаблоном для быстрого добавления (QuickActions, Шаг 2) */
  isTemplate: boolean;
  /** Настройки регулярности, если операция повторяющаяся */
  recurring?: RecurringSettings | null;
  /** Вложения: чеки, фото (URL или base64) */
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

/** Бюджет — лимит по категории или по конкретному счёту */
export interface Budget {
  id: string;
  /** Бюджет относится либо к категории, либо к счёту (взаимоисключаемо) */
  categoryId?: string;
  accountId?: string;
  limit: number;
  currentAmount: number;
  period: BudgetPeriod;
  currency: CurrencyCode;
  /** Дата начала текущего периода (ISO 8601) */
  periodStart: string;
  createdAt: string;
  updatedAt: string;
}

/** Цель накопления (Шаг 5: GoalsAndPiggybank) */
export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  currency: CurrencyCode;
  deadline?: string | null;
  icon?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

/** Настройки "Копилки" — авто-округление транзакций в пользу цели */
export interface PiggybankSettings {
  enabled: boolean;
  /** До какой суммы округлять расход (напр. 10, 50, 100) */
  roundTo: number;
  /** ID цели (Goal), куда улетает разница округления */
  targetGoalId: string;
  /** Общая сумма, накопленная через округления */
  totalSaved: number;
}
