import { notFound, redirect } from "next/navigation";
import {
  getInflows,
  getOutflows,
  getSavings,
  getSetup,
} from "@/lib/sheets";
import { currentMonthKey, summarize } from "@/lib/budget";
import { DashboardView } from "../../dashboard-view";

export const dynamic = "force-dynamic";

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

export default async function MonthPage({
  params,
}: {
  params: Promise<{ month: string }>;
}) {
  const { month } = await params;
  if (!MONTH_RE.test(month)) notFound();

  const todayKey = currentMonthKey();
  if (month === todayKey) redirect("/");

  let setup, outflows, inflows, savings;
  try {
    [setup, outflows, inflows, savings] = await Promise.all([
      getSetup(),
      getOutflows(),
      getInflows(),
      getSavings(),
    ]);
  } catch (e) {
    return (
      <main className="max-w-xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-semibold mb-4">nickel</h1>
        <p className="text-sm text-red-600 dark:text-red-400">
          {e instanceof Error ? e.message : "Failed to load sheet."}
        </p>
      </main>
    );
  }

  const summary = summarize(setup, outflows, inflows, savings, month);

  return (
    <main className="max-w-xl mx-auto px-6 py-10">
      <DashboardView
        summary={summary}
        monthKey={month}
        isCurrent={month === todayKey}
        todayMonthKey={todayKey}
      />
      {month !== todayKey && (
        <p className="text-xs text-zinc-500 italic mt-4">
          Read-only view. Budget caps and savings rate reflect current Setup.
        </p>
      )}
    </main>
  );
}
