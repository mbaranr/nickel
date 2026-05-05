import Link from "next/link";
import {
  formatMoney,
  formatMonth,
  nextMonthKey,
  previousMonthKey,
  type BudgetSummary,
} from "@/lib/budget";
import { logoutAction } from "./actions";

export function DashboardView({
  summary,
  monthKey,
  isCurrent,
  todayMonthKey,
  user,
  currency,
}: {
  summary: BudgetSummary;
  monthKey: string;
  isCurrent: boolean;
  todayMonthKey: string;
  user: string;
  currency: string;
}) {
  const prev = previousMonthKey(monthKey);
  const next = nextMonthKey(monthKey);
  const canGoNext = next <= todayMonthKey;

  const sep = currency.length > 1 ? " " : "";
  const fmt = (n: number) => `${currency}${sep}${formatMoney(n)}`;
  const Money = ({ n }: { n: number }) => (
    <span className="tabular-nums">
      {n < 0 ? "−" : ""}
      {fmt(Math.abs(n))}
    </span>
  );

  return (
    <>
      <header className="flex items-start justify-between mb-2">
        <h1 className="text-2xl font-semibold tracking-tight">nickel</h1>
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-sm text-zinc-500">{formatMonth(monthKey)}</span>
          <div className="flex items-baseline gap-2 text-xs text-zinc-500">
            <span>{user}</span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="hover:text-foreground transition"
              >
                log out
              </button>
            </form>
          </div>
        </div>
      </header>
      <nav className="flex items-center justify-between text-xs text-zinc-500 mb-8">
        <Link
          href={`/m/${prev}`}
          className="hover:text-foreground transition"
          aria-label="Previous month"
        >
          ← {formatMonth(prev)}
        </Link>
        {!isCurrent ? (
          <Link href="/" className="hover:text-foreground transition">
            today
          </Link>
        ) : (
          <span />
        )}
        {canGoNext ? (
          <Link
            href={next === todayMonthKey ? "/" : `/m/${next}`}
            className="hover:text-foreground transition"
            aria-label="Next month"
          >
            {formatMonth(next)} →
          </Link>
        ) : (
          <span />
        )}
      </nav>

      <section className="mb-8">
        <div className="flex items-baseline justify-between">
          <span className="text-sm uppercase tracking-wide text-zinc-500">
            Disposable
          </span>
          <span className="text-3xl font-semibold">
            <Money n={summary.disposable} />
          </span>
        </div>
        <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
          Income {fmt(summary.income)}
          {summary.inflowsThisMonth > 0 && (
            <> + Inflows {fmt(summary.inflowsThisMonth)}</>
          )}{" "}
          − Tax {fmt(summary.taxes)} − Fixed {fmt(summary.fixed)} − Variable{" "}
          {fmt(
            Math.max(summary.variableBudgetTotal, summary.variableSpentTotal),
          )}
          {(summary.savingsTargetThisMonth > 0 ||
            summary.savingsActualThisMonth > 0) && (
            <>
              {" "}
              − Savings{" "}
              {fmt(
                Math.max(
                  summary.savingsTargetThisMonth,
                  summary.savingsActualThisMonth,
                ),
              )}
            </>
          )}
        </p>
      </section>

      <section className="mb-8">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-sm uppercase tracking-wide text-zinc-500">
            Outflows
          </h2>
          <span className="text-xs text-zinc-500">
            <Money n={summary.variableSpentTotal} /> /{" "}
            <Money n={summary.variableBudgetTotal} /> spent
          </span>
        </div>
        <ul className="flex flex-col gap-3">
          {summary.categories.map((c) => {
            const pct =
              c.budget > 0
                ? Math.min(100, (c.spent / c.budget) * 100)
                : c.spent > 0
                  ? 100
                  : 0;
            const over = c.remaining < 0;
            return (
              <li key={c.name} className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between text-sm">
                  <span className={over ? "text-red-600 dark:text-red-400" : ""}>
                    {c.name}
                    {!c.knownCategory && (
                      <span className="ml-2 text-xs text-amber-600">
                        (not in Setup)
                      </span>
                    )}
                  </span>
                  <span className="text-zinc-600 dark:text-zinc-400">
                    <Money n={c.spent} /> / <Money n={c.budget} />
                    <span
                      className={`ml-3 ${
                        over
                          ? "text-red-600 dark:text-red-400"
                          : "text-zinc-500"
                      }`}
                    >
                      <Money n={Math.abs(c.remaining)} />{" "}
                      {over ? "over" : "left"}
                    </span>
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                  <div
                    className="h-full transition-[background-color]"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: over
                        ? "hsl(0 80% 50%)"
                        : `hsl(${120 - 1.2 * pct} 70% 45%)`,
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mb-8">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-sm uppercase tracking-wide text-zinc-500">
            Savings
          </h2>
          {summary.savingsRatePct > 0 && (
            <span className="text-xs text-zinc-500">
              {summary.savingsRatePct}% of net
            </span>
          )}
        </div>
        <div className="flex items-baseline justify-between text-sm mb-1">
          <span>This month</span>
          <span className="text-zinc-600 dark:text-zinc-400">
            <Money n={summary.savingsActualThisMonth} />
            {summary.savingsTargetThisMonth > 0 && (
              <>
                {" / "}
                <Money n={summary.savingsTargetThisMonth} />
              </>
            )}
          </span>
        </div>
        <div className="flex items-baseline justify-between text-sm">
          <span>Cumulative</span>
          <span className="font-medium">
            <Money n={summary.savingsCumulative} />
          </span>
        </div>
      </section>

      {summary.monthInflows.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm uppercase tracking-wide text-zinc-500 mb-3">
            Inflows
          </h2>
          <ul className="flex flex-col gap-1 text-sm">
            {summary.monthInflows.map((i, idx) => (
              <li key={idx} className="flex items-baseline justify-between">
                <span>
                  {i.source}
                  {i.note && (
                    <span className="text-zinc-500"> · {i.note}</span>
                  )}
                </span>
                <span className="text-zinc-600 dark:text-zinc-400">
                  <Money n={i.amount} />
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
