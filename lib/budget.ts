import type {
  InflowRow,
  OutflowRow,
  SavingsRow,
  SetupRow,
} from "./sheets";

export type CategorySummary = {
  name: string;
  budget: number;
  spent: number;
  remaining: number;
  knownCategory: boolean;
};

export type BudgetSummary = {
  income: number;
  inflowsThisMonth: number;
  taxes: number;
  fixed: number;
  variableBudgetTotal: number;
  variableSpentTotal: number;
  variableOverage: number;
  savingsRatePct: number;
  savingsTargetThisMonth: number;
  savingsActualThisMonth: number;
  savingsOverage: number;
  savingsCumulative: number;
  disposable: number;
  categories: CategorySummary[];
  monthInflows: InflowRow[];
  monthSavings: SavingsRow[];
};

export function currentMonthKey(now: Date = new Date()): string {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function previousMonthKey(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 2, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function nextMonthKey(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(Date.UTC(y, m, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function summarize(
  setup: SetupRow[],
  outflows: OutflowRow[],
  inflows: InflowRow[],
  savings: SavingsRow[],
  monthKey: string,
): BudgetSummary {
  const sumByType = (t: SetupRow["type"]) =>
    setup.filter((r) => r.type === t).reduce((s, r) => s + r.amount, 0);

  const income = sumByType("income");
  const taxes = sumByType("tax");
  const fixed = sumByType("fixed");

  const savingsRatePct =
    setup.find((r) => r.type === "savings_rate")?.amount ?? 0;
  const savingsTargetThisMonth = ((income - taxes) * savingsRatePct) / 100;

  const variables = setup.filter((r) => r.type === "variable");
  const variableBudgetTotal = variables.reduce((s, r) => s + r.amount, 0);

  const monthOutflows = outflows.filter((e) => e.date.startsWith(monthKey));
  const monthInflows = inflows.filter((i) => i.date.startsWith(monthKey));
  const monthSavings = savings.filter((s) => s.date.startsWith(monthKey));

  const inflowsThisMonth = monthInflows.reduce((s, i) => s + i.amount, 0);
  const savingsActualThisMonth = monthSavings.reduce((s, x) => s + x.amount, 0);
  const savingsCumulative = savings
    .filter((s) => s.date.slice(0, 7) <= monthKey)
    .reduce((sum, s) => sum + s.amount, 0);

  const spentByCategory = new Map<string, number>();
  for (const e of monthOutflows) {
    spentByCategory.set(
      e.category,
      (spentByCategory.get(e.category) ?? 0) + e.amount,
    );
  }

  const categories: CategorySummary[] = variables.map((v) => {
    const spent = spentByCategory.get(v.name) ?? 0;
    return {
      name: v.name,
      budget: v.amount,
      spent,
      remaining: v.amount - spent,
      knownCategory: true,
    };
  });

  const knownNames = new Set(variables.map((v) => v.name));
  for (const [name, spent] of spentByCategory) {
    if (!knownNames.has(name)) {
      categories.push({
        name,
        budget: 0,
        spent,
        remaining: -spent,
        knownCategory: false,
      });
    }
  }

  const variableSpentTotal = categories.reduce((s, c) => s + c.spent, 0);
  const variableOverage = Math.max(0, variableSpentTotal - variableBudgetTotal);
  const savingsOverage = Math.max(
    0,
    savingsActualThisMonth - savingsTargetThisMonth,
  );

  const disposable =
    income +
    inflowsThisMonth -
    taxes -
    fixed -
    Math.max(variableBudgetTotal, variableSpentTotal) -
    Math.max(savingsTargetThisMonth, savingsActualThisMonth);

  return {
    income,
    inflowsThisMonth,
    taxes,
    fixed,
    variableBudgetTotal,
    variableSpentTotal,
    variableOverage,
    savingsRatePct,
    savingsTargetThisMonth,
    savingsActualThisMonth,
    savingsOverage,
    savingsCumulative,
    disposable,
    categories,
    monthInflows,
    monthSavings,
  };
}

export function formatMoney(n: number): string {
  return Math.round(n).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  });
}

export function formatMonth(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleString(undefined, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
