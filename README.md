# nickel

A minimal web app for tracking monthly budgets.

## What it does

- Declares income, taxes, fixed expenses, subscriptions, and per-category variable budgets in one Setup tab on your Google Sheet.
- Tracks outflows (expenses) per category, inflows (gifts, bonuses), and savings transfers (contributions and withdrawals) as you go.
- Computes a single "disposable" headline number for the month, plus per-category remaining and cumulative savings.
- Lets you scroll back to read-only past months.

## Stack

Next.js 16 (App Router), TypeScript, Tailwind 4, Google Sheets API, Vercel.

## Setup

### 1. Google Sheet

Create a Sheet with four tabs: `Setup`, `Outflows`, `Inflows`, `Savings`. The CSV templates in `sheet-template/` show the schema for each tab; you can import them or build the tabs by hand.

In `Setup`, declare:

- `income` rows (e.g. salary).
- `tax` rows.
- `fixed` rows (insurance, phone, etc.).
- `subscription` rows.
- `variable` rows (one per spending category, with monthly cap).
- One `savings_rate` row: amount is the percent of net income you want to save each month.

### 2. Google Cloud

Create a project, enable the Sheets API, create a service account, download its JSON key, and share the Sheet with the service account email (Editor access).

### 3. Environment

Copy `.env.example` to `.env.local` and fill in:

- `GOOGLE_SHEET_ID`: the ID from the Sheet URL.
- `GOOGLE_CREDENTIALS_BASE64`: the service account JSON, base64-encoded.

To encode the JSON key:

```
base64 -w 0 < /path/to/service-account.json
```

### 4. Run

```
npm install
npm run dev
```

Open http://localhost:3000.

## Deploy

Push to GitHub, import the repo into Vercel, and set the same two env vars in the project settings. Next.js is auto-detected; no additional configuration is needed.
