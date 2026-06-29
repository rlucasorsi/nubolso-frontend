# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server on port 3001
npm run build      # Production build
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit (no test suite exists)
npm run commit     # Commitizen interactive commit (conventional commits)
```

There are no automated tests. Type-checking (`typecheck`) is the primary correctness gate before committing.

## Architecture

**NuBolso** is a personal finance frontend built with Next.js (App Router), React Query, and Tailwind + shadcn/ui.

### Route groups

- `src/app/(public)/` — unauthenticated pages (login, register, forgot-password, etc.)
- `src/app/(private)/` — authenticated pages; layout handles auth guard, top nav, and mobile nav

### Module structure

All domain logic lives under `src/modules/{domain}/` with a consistent 4-layer pattern:

```
service/     — HttpClient calls (raw API, types in UPPERCASE from backend)
actions/     — Next.js Server Actions ('use server') that wrap the service
hooks/       — React Query useQuery/useMutation wrappers that call actions
model/api/   — TypeScript request/response interfaces
```

Modules: `entries`, `categories`, `users`, `recurring-templates`, `credit-cards`, `goals`, `imports`.

The `src/services/auth.ts` file is the one exception — it lives outside `modules/` because it's used by the logout hook and doesn't follow the standard module pattern.

### Data flow

```
HttpClient → service → Server Action → React Query hook → component
```

Components never call services or HttpClient directly.

### HttpClient (`src/network/http-client.ts`)

Custom `fetch` wrapper. Key behaviours:

- Reads `accessToken` cookie and attaches it as `Authorization: Bearer ...`
- GET requests retry up to 2× on HTTP 500 (mutations never retry)
- HTTP 401 on non-auth endpoints clears the token cookie and redirects to `/login`
- `isMultipart: true` option strips `Content-Type` so `fetch` can set the multipart boundary (used for OFX file uploads)
- API base URL: `NEXT_PUBLIC_API_URL` (client) / `API_URL` (server) — both must be set

### Cashflow engine (`src/lib/cashflow.ts`)

The core financial projection logic, fully decoupled from React. It:

- Defines `FlowType` (`'income' | 'expense' | 'spending'`) — **always lowercase** in the frontend; backend uses uppercase and conversion happens in the service layer
- Synthesizes **virtual entries** for unrealized recurring template occurrences and unpaid credit card invoices, so future cashflow is visible even without real transactions
- Computes `Period[]` with day-by-day running balance from a user-configurable `startDay` (stored in `localStorage` as `cashflow_start_day`)

### `useCashFlow` hook (`src/hooks/useCashFlow.ts`)

Central orchestration hook for the dashboard. Fetches entries, user profile, recurring templates, and all invoices in parallel; maps them to frontend types; generates virtual entries; and computes `Period[]`. Most dashboard components read from this hook rather than fetching independently.

### i18n

Custom implementation — not next-intl at runtime despite the package being present. Uses:

- `src/i18n/LanguageContext.tsx` — `LanguageProvider` + `useLanguage()`, persists locale to `localStorage` under key `nubolso-locale`
- `src/i18n/useTranslations.ts` — `useTranslations(namespace)` returns a `t(key, params?)` function
- `messages/en.json`, `messages/pt-BR.json`, `messages/es.json` — source of truth for all UI strings

To add a new translated string: add the key to all three JSON files, then use `useTranslations('namespace')` in the component.

### Form inputs (`src/components/ui/form-field.tsx`)

Always use the standardized field components — `TextInputField`, `AmountInputField`, `NumberInputField`, `DateInputField` — for any text, currency, number, or date input. Never reach for a raw `<input>` element.

`AmountInputField` in particular handles cents-based currency masking (digits typed are treated as cents, e.g. `150075` → `1.500,75`) and the `R$` prefix consistently across the app. A raw `<input type="number">` does not replicate this behavior, which has caused bugs where amount fields silently dropped cents handling.

### Type convention

The backend sends transaction/template types as `INCOME` / `EXPENSE` / `SPENDING` (uppercase). The service layer normalises them to lowercase (`FlowType`) on read and converts back to uppercase on write. Do not pass uppercase values into components or the cashflow engine.

### Environment variables

```
NEXT_PUBLIC_API_URL   # Backend base URL (client-side fetch)
API_URL               # Backend base URL (server-side fetch / Server Actions)
NEXT_PUBLIC_GOOGLE_CLIENT_ID
NEXT_PUBLIC_SENTRY_DSN
SENTRY_DSN
SENTRY_AUTH_TOKEN
```

Copy `.env.example` to `.env.local` to get started.

### Path alias

`@/` maps to `src/`. Use it for all internal imports.
