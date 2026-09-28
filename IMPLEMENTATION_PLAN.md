# ZenFinance — Implementation Plan

Files already scaffolded in this delivery are marked **[done]**. Everything else
is the recommended build order for a solo dev or small team.

## Phase 0 — Foundations **[done]**
- `prisma/schema.prisma` — full domain model (Users, Accounts, Transactions,
  Categories, Tags, Subscriptions, Budgets, Goals, Debts, Templates, Sessions).
- `package.json` with the full stack pinned.
- `.env.example`.
- `src/lib/prisma.ts` — singleton client (avoids connection exhaustion).
- `src/lib/telegram-auth.ts` — HMAC-SHA256 `initData` validation + unit tests.
- `src/lib/session.ts` — cookie-based session lookup.
- `src/app/api/auth/telegram/route.ts` — login endpoint.
- `src/app/api/transactions/route.ts` — atomic income/expense/transfer creation.
- `src/app/api/cron/run-recurring/route.ts` — recurring payment sweep.
- `src/store/useAccountStore.ts` — Zustand example.
- CI/CD: `.github/workflows/ci.yml`, `vercel.json`.
- Tests: `telegram-auth.test.ts` (unit), `transaction-flow.spec.ts` (e2e).

**Before moving on:** run `npx prisma migrate dev --name init` against a Neon
branch, confirm the schema applies cleanly, and get the auth unit tests green.

## Phase 1 — App Shell & Telegram Bootstrapping **[done]**
- `src/types/telegram.d.ts` — typed shape of `window.Telegram.WebApp`. Built on
  the raw script (`telegram-web-app.js`) rather than `@telegram-apps/sdk`, to
  match the mocking approach the E2E test already uses and keep the surface
  small and auditable; swapping in the SDK later is a contained change since
  everything routes through `useTelegram()`.
- `src/lib/telegram-context.tsx` — `TelegramProvider` + `useTelegram()`/
  `useMainButton()`. Calls `ready()`/`expand()` once on mount, listens for
  `themeChanged`, and exposes `haptic`, `mainButton`, `backButton` helpers.
  `initData` (signed) and `unsafeUser` (display-only) are kept as clearly
  distinct fields so nothing downstream is tempted to treat the client-visible
  user object as authenticated identity.
- `src/store/useUserStore.ts` — owns the `initData → /api/auth/telegram`
  handshake and the resulting session-scoped user + theme/accent prefs.
- `src/app/providers.tsx` — `AuthBootstrapper` fires the handshake exactly
  once `isReady && initData && status === 'idle'`.
- `src/components/AppGate.tsx` — loading / "open in Telegram" / auth-error
  states, so nothing renders real UI on top of an unauthenticated session.
- `src/components/ThemeSync.tsx` + `src/app/globals.css` — Tailwind v4 tokens
  driven entirely by CSS custom properties; `ThemeSync` only ever toggles a
  `.dark` class and a `data-accent` attribute on `<html>`. AUTO mode follows
  Telegram's `colorScheme`, not the browser's `prefers-color-scheme`.
- `src/components/BottomNav.tsx` — Главная / Аналитика / Подписки / Цели /
  Настройки, active-route highlighting, haptic on tap.
- `src/app/layout.tsx` — loads the Telegram script `beforeInteractive`, wraps
  everything in `Providers` → `AppGate`, reserves safe-area insets.

**Before moving on:** open the app inside an actual Telegram bot (via
BotFather's Mini App URL, or `ngrok`/Vercel preview + `web_app` button) — the
`AppGate`'s "open in Telegram" fallback exists specifically because
`window.Telegram` is undefined in a plain browser tab, so a normal `next dev`
tab will only show that screen, not a bug.

## Phase 2 — Accounts Module (partial) **[GET/POST done]**
- `src/app/api/accounts/route.ts` — `GET` (list, non-archived, sorted) and
  `POST` (create) scoped to `requireUserId()`.
- `src/store/useAccountStore.ts` **[from Phase 0]** wired to `AccountsRow`.
- `src/components/AccountCard.tsx` — gradient-per-type default (overridable
  per account), masked number, limit-usage bar that turns amber past 80%.
- `src/components/AccountsRow.tsx` — horizontal scroll, loading skeletons,
  error state, trailing "+" tile (creation sheet not wired yet).
- `src/app/page.tsx` — home screen: greeting, accounts row, recent-transactions
  placeholder, FAB (transaction sheet lands in Phase 3).

**Still open in this module:** `PATCH`/`DELETE /api/accounts/[id]` (soft-archive
if the account has transactions), and the create-account bottom sheet the "+"
tile should open — both slot into the still-untouched Phase 3 work below.

## Phase 3 — Transactions Module (partial) **[quick-add sheet done]**
- `src/app/api/transactions/route.ts` — added `GET` (cursor pagination via
  `?limit=&cursor=`, joined category/accounts/tags) alongside the Phase-0
  `POST`. `DELETE` (balance-reversing) is still open, see below.
- `src/app/api/categories/route.ts`, `src/app/api/tags/route.ts` — list +
  create, tags are get-or-create (idempotent on `(userId, name)`).
- `src/lib/seed-categories.ts` — seeds a starter category set on first login
  (wired into `api/auth/telegram`) so the picker and analytics aren't empty
  for a brand-new user.
- `src/app/api/rates/route.ts` — static USD-based rate table behind
  `requireUserId()`; `isLive: false` in the response is the marker Phase 6
  flips once a real provider is wired in, without changing the response shape.
- `src/store/useTransactionStore.ts`, `useCategoryStore.ts`, `useTagStore.ts`.
- `src/hooks/useExchangeRates.ts` — cross-rate lookup from the rates table.
- `src/components/BottomSheet.tsx` — shared slide-up sheet used everywhere
  below.
- `src/components/AddTransactionSheet.tsx` — the quick-add form: 3-way
  Расход/Доход/Перевод toggle, account + category pickers, tag multi-select
  with inline creation, and a currency-conversion preview for transfers
  between accounts of different currencies (rate is pre-filled from
  `/api/rates` but always user-editable, since bank rates legitimately
  differ). Submits via **both** an in-sheet button and Telegram's native
  MainButton — MainButton is the primary path on-device, the in-sheet button
  is the fallback for local/browser dev where MainButton doesn't render.
- `src/components/TransactionRow.tsx` + `src/app/page.tsx` — home screen now
  shows the real recent-transactions feed instead of a placeholder.
- **Bug fixed while wiring this up:** `telegram-context.tsx`'s
  `mainButton.show()`/`backButton.show()` were calling Telegram's `onClick`
  without ever unregistering the previous handler. Since `AddTransactionSheet`
  re-registers MainButton on every form-state change (so its label can show
  the live amount), that leak would have stacked stale closures and fired
  several of them per tap. Fixed by tracking the last-registered handler in a
  ref and calling `offClick` on it before registering the next one — worth
  knowing about if you build another screen that re-shows MainButton in a
  `useEffect` with changing deps.

**Still open in this module:** `DELETE /api/transactions/[id]` (must reverse
the account balance atomically, same pattern as creation), quick-template
chips from `Template`, and nested category management UI (create/recolor/
reparent categories — right now categories are seeded and pickable but not
editable from the client).

## Phase 4 — Recurring Payments (2 days)
1. CRUD for `Subscription`.
2. Payment calendar component: a month grid marking `nextRunAt` for
   subscriptions, `dueDate` for active debts, and a projected balance line
   (naive projection: current balance + sum of scheduled income − scheduled
   expenses up to each day).
3. Confirm `/api/cron/run-recurring` **[scaffolded]** is registered in
   `vercel.json` **[done]**, and add a Telegram Bot notification step (send a
   message via the Bot API to `reminderDaysBefore` upcoming charges) — this
   requires a small bot-side sender using `TELEGRAM_BOT_TOKEN` and the user's
   `telegramId`.

## Phase 5 — Analytics & Export (partial) **[charts done, export open]**
- `src/lib/date-ranges.ts` — week/month/year → date range + bucket
  granularity (day/day/month), so a year view never renders 365 chart points.
- `src/app/api/analytics/category-breakdown/route.ts` — SQL `groupBy` on
  `categoryId`, joined against category metadata for color/icon/name.
- `src/app/api/analytics/cashflow/route.ts` — bucketed in application code
  (documented in the route: fine at this data volume, revisit with
  `$queryRaw`/`date_trunc` if per-user history grows past a few hundred rows
  in a single period).
- `src/hooks/useAnalytics.ts`, `src/components/CategoryPieChart.tsx`,
  `CashflowAreaChart.tsx`, `PeriodTabs.tsx`, and the full `src/app/analytics/page.tsx`.

**Still open:**
- A simple "financial health score" (weighted combination of savings-rate,
  budget-adherence %, and debt-to-income ratio) — document it as a heuristic
  in the UI copy, not a financial claim.
- Export: `jspdf` + `html2canvas` to snapshot a report view to PDF; `xlsx`
  (SheetJS) to write structured workbook exports of the same data. Both
  should read from the same query layer as the on-screen charts (the
  `category-breakdown`/`cashflow` routes above) so a PDF and an Excel export
  of "this month" can never diverge from what the person is looking at.

## Phase 6 — Currency & Bank Rates (partial) **[static table done]**
- `src/app/api/rates/route.ts` **[done, see Phase 3]** — ships a static
  USD-based table today; `isLive: false` in its response is the flag to flip
  once this phase wires a real provider.
- `src/hooks/useExchangeRates.ts` **[done]** — already the client-side
  integration point; swapping the server behind it is the only change needed
  here, nothing downstream should need to move.

**Still open:** replace the static table with a real server-side fetch + short
TTL cache (Vercel KV or an in-memory `revalidate` tag) from CBR (RUB) and
Binance (crypto); never call third-party rate APIs directly from the client
(keys, rate limits, CORS). The response shape (`{ base, rates, asOf, isLive }`)
should stay stable so `useExchangeRates` doesn't need to change.

## Phase 7 — Budgets, Goals & Piggy Bank (partial) **[done except round-up]**
- `src/app/api/budgets/route.ts` + `[id]/route.ts`, `src/store/useBudgetStore.ts`,
  `src/components/BudgetCard.tsx`, `CreateBudgetSheet.tsx` — budgets with
  spend computed live from `Transaction` (never stored/stale), amber past 80%,
  red past 100%.
- `src/app/api/goals/route.ts` + `[id]/deposits/route.ts`,
  `src/store/useGoalStore.ts`, `src/components/GoalCard.tsx` (inline deposit
  control, auto-flips to `COMPLETED` at target), `CreateGoalSheet.tsx`.
- `src/app/budgets/page.tsx` — tabbed Бюджеты/Копилка screen tying it together.

**Still open:** the piggy-bank round-up itself. `Goal.roundUpEnabled` /
`roundUpAccountId` / `roundUpToNearest` are in the schema and the create-goal
API accepts them, but nothing triggers a deposit yet. As planned originally:
on every `EXPENSE` transaction creation, if the source account has an active
round-up goal, compute `ceil(amount / roundUpToNearest) * roundUpToNearest -
amount` and create a `GoalDeposit` as a side-effect inside the *same*
`$transaction` block in `api/transactions/route.ts` — atomic with the
originating expense, not a best-effort background job. The create-goal sheet
also doesn't yet expose the round-up toggle in its UI (API supports it, form
doesn't ask for it) — that's a small follow-up in `CreateGoalSheet.tsx`.

## Phase 8 — Debts & Debtors (2 days)
1. CRUD for `Contact` and `Debt`.
2. Repayment flow: creates a `Transaction` with `debtId` set and decrements
   `Debt.remaining`; auto-flip `status` to `SETTLED` at zero and to
   `OVERDUE` via the same cron sweep that runs subscriptions (or a second
   lightweight cron) when `dueDate` has passed and `remaining > 0`.

## Phase 9 — Sharing & Native Polish (1–2 days)
1. Shareable snippet generation: render a transaction/milestone as an image
   (`html2canvas` on a hidden template) and use `WebApp.shareToStory` /
   `switchInlineQuery` from `@telegram-apps/sdk` to hand off to Telegram's
   native share sheet — don't try to post to chats directly from the Mini App.
2. Haptics on key actions (save, delete, threshold-crossed warnings), and
   `MainButton`/`BackButton` wired per-screen instead of custom nav buttons,
   since that's what makes it feel native inside Telegram.

## Phase 10 — Hardening
1. Rate limiting on `/api/auth/telegram` and `/api/transactions` (e.g. Vercel
   Edge Middleware + a KV counter) to blunt replay/spam even though
   `initData` is signed.
2. Structured logging + error tracking (Sentry) wired into the API route
   catch blocks already scaffolded.
3. Load-test the `$transaction` balance-update paths specifically — these are
   the correctness-critical sections; everything else can tolerate eventual
   consistency, balances cannot.
4. Expand Playwright coverage: transfer between currencies, insufficient
   funds rejection, recurring-payment cron idempotency (run the cron handler
   twice in a test and assert no double-charge).

---

### Notes on choices worth flagging
- **Decimal everywhere, never `Float`**: all monetary fields are
  `Decimal(20,8)` in Postgres and handled via `decimal.js` in TypeScript. This
  is non-negotiable for a finance app — floating point will eventually produce
  a balance that's off by a cent (or a satoshi).
- **Balance is a stored, derived field**: it's recomputed transactionally on
  every write rather than summed on read, trading a small amount of
  eventual-consistency risk (mitigated by `$transaction`) for fast reads on
  the account list, which is the highest-traffic query in the app.
- **Session model is custom, not NextAuth**: Telegram's `initData` handshake
  doesn't map cleanly onto NextAuth's OAuth-shaped providers, and a bespoke
  ~100-line session module is easier to reason about and audit here than
  bending a general-purpose auth library to fit.
