# nickel

A minimal Next.js budget tracker backed by a Google Sheet.

## Stack

- Next.js 16 (App Router), TypeScript, Tailwind 4.
- Google Sheets via `googleapis` with a service account.
- Deployed on Vercel.

## Data model (the Google Sheet)

Five tabs:

- `Users`: one row per person (`username`, `password`, `currency`). Plaintext by design (minimal system). `currency` is the symbol shown next to amounts (e.g. `$`, `€`, `£`); blank defaults to `$`.
- `Setup`: declared income, taxes, fixed expenses (recurring bills and subscriptions), variable budget caps, plus one `savings_rate` row (percent of net income). First column is `user`.
- `Outflows`: one row per expense. Columns: `user`, `date`, `category`, `amount`, `note`.
- `Inflows`: one row per unexpected income event. Columns: `user`, `date`, `source`, `amount`, `note`.
- `Savings`: one row per savings transfer. Columns: `user`, `date`, `amount`, `note`. Positive amount = contribution, negative = withdrawal.

Every row in `Setup`, `Outflows`, `Inflows`, `Savings` is scoped by `user`: reads filter on it, writes prepend the current user.

CSV templates with the exact column layout live in `sheet-template/`.

## Auth

Cookie-based session. `/login` posts username + password; `loginAction` validates against the `Users` tab and sets an httpOnly cookie holding `base64(username:password)`. `getCurrentUser()` in `lib/auth.ts` decodes the cookie and re-validates against `Users` on every request, so revoking access is just deleting a row in the sheet. `requireUser()` is the page-level / action-level guard that redirects to `/login` when the cookie is missing or stale.

## Code layout

- `lib/sheets.ts`: thin wrapper over the Sheets API. Returns typed rows.
- `lib/budget.ts`: pure functions that summarize a month given fetched data.
- `lib/auth.ts`: session cookie helpers (`getCurrentUser`, `requireUser`, `setSession`, `clearSession`).
- `app/page.tsx`: current-month dashboard with the track form.
- `app/m/[month]/page.tsx`: read-only past-month view.
- `app/login/page.tsx` + `login-form.tsx`: login screen.
- `app/dashboard-view.tsx`: shared rendering used by both pages.
- `app/track-panel.tsx`: client component with three tabs (Outflow, Inflow, Savings).
- `app/actions.ts`: server actions for login/logout and appending rows.

## Disposable formula

```
disposable = income + this_month_inflows
           - tax - fixed
           - max(variable_budget, variable_spent)
           - max(savings_target, savings_actual_this_month)
```

The `max()` terms make overspending and over-saving show up in the headline number; under-spending or under-saving leaves the headline at the planned figure.

## Common commands

```
npm run dev          # start dev server (http://localhost:3000)
npx tsc --noEmit     # type check
npm run build        # production build
```

## Env vars

Local dev reads from `.env.local`. See `.env.example` for the keys:

- `GOOGLE_SHEET_ID`: the ID from the Sheet URL.
- `GOOGLE_CREDENTIALS_BASE64`: the service account JSON, base64-encoded.

## Conventions

- **NEVER** commit `.env.local` or the service account JSON. The key lives outside the repo (e.g. `~/.config/nickel/`).
- **DO NOT** use em dashes (`—`) in any prose, comments, or commit messages. Use commas, parentheses, semicolons, colons, or periods.
- **YOU MUST** keep the UI minimal. The user's explicit goal is minimalism; resist scope creep and don't introduce features that weren't asked for.
- A savings withdrawal is logged as a negative `Savings` row only; it is not also an outflow. Logging it twice would double-count.
- `lib/budget.ts` is pure (no I/O, no `server-only`); all sheet access goes through `lib/sheets.ts`. Server components fetch the data and pass it down. The only client component is `app/track-panel.tsx`.
- After non-trivial changes, run `npx tsc --noEmit` before declaring work done.
