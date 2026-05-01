import {
  getInflows,
  getOutflows,
  getSavings,
  getSetup,
} from "@/lib/sheets";
import { currentMonthKey, summarize } from "@/lib/budget";
import { DashboardView } from "./dashboard-view";
import { TrackPanel } from "./track-panel";

export const dynamic = "force-dynamic";

export default async function Home() {
  const monthKey = currentMonthKey();

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
        <p className="text-sm text-zinc-500 mt-2">
          Check your <code>.env.local</code> values, that the tabs{" "}
          <code>Setup</code>, <code>Outflows</code>, <code>Inflows</code>, and{" "}
          <code>Savings</code> exist, and that the sheet is shared with the
          service account.
        </p>
      </main>
    );
  }

  const summary = summarize(setup, outflows, inflows, savings, monthKey);
  const variableNames = setup
    .filter((r) => r.type === "variable")
    .map((r) => r.name);

  return (
    <main className="max-w-xl mx-auto px-6 py-10">
      <DashboardView
        summary={summary}
        monthKey={monthKey}
        isCurrent={true}
        todayMonthKey={monthKey}
      />
      <section className="pt-6 border-t border-black/10 dark:border-white/10">
        <h2 className="text-sm uppercase tracking-wide text-zinc-500">
          Track
        </h2>
        <TrackPanel categories={variableNames} />
      </section>
    </main>
  );
}
