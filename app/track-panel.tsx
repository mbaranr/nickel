"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  addInflowAction,
  addOutflowAction,
  addSavingsAction,
  type ActionState,
} from "./actions";

const initial: ActionState = { ok: false };

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const inputCls =
  "px-3 py-2 rounded-md border border-black/10 dark:border-white/15 bg-background text-foreground text-sm";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-4 py-2 rounded-md bg-foreground text-background text-sm font-medium disabled:opacity-50"
    >
      {pending ? "Saving…" : label}
    </button>
  );
}

function OutflowForm({ categories }: { categories: string[] }) {
  const [state, action] = useActionState(addOutflowAction, initial);
  const formRef = useRef<HTMLFormElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      amountRef.current?.focus();
    }
  }, [state]);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <select
          name="category"
          required
          defaultValue=""
          className={`col-span-2 ${inputCls}`}
        >
          <option value="" disabled>
            Category…
          </option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          ref={amountRef}
          name="amount"
          type="number"
          step="0.01"
          inputMode="decimal"
          required
          placeholder="Amount"
          className={inputCls}
        />
        <input
          name="date"
          type="date"
          required
          defaultValue={todayIso()}
          className={inputCls}
        />
        <input
          name="note"
          type="text"
          placeholder="Note (optional)"
          className={`col-span-2 ${inputCls}`}
        />
      </div>
      <div className="flex items-center gap-3">
        <SubmitButton label="Add outflow" />
        {state.error && (
          <span className="text-sm text-red-600 dark:text-red-400">
            {state.error}
          </span>
        )}
      </div>
    </form>
  );
}

function InflowForm() {
  const [state, action] = useActionState(addInflowAction, initial);
  const formRef = useRef<HTMLFormElement>(null);
  const sourceRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      sourceRef.current?.focus();
    }
  }, [state]);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <input
          ref={sourceRef}
          name="source"
          type="text"
          required
          placeholder="Source (e.g. gift)"
          className={`col-span-2 ${inputCls}`}
        />
        <input
          name="amount"
          type="number"
          step="0.01"
          inputMode="decimal"
          required
          placeholder="Amount"
          className={inputCls}
        />
        <input
          name="date"
          type="date"
          required
          defaultValue={todayIso()}
          className={inputCls}
        />
        <input
          name="note"
          type="text"
          placeholder="Note (optional)"
          className={`col-span-2 ${inputCls}`}
        />
      </div>
      <div className="flex items-center gap-3">
        <SubmitButton label="Add inflow" />
        {state.error && (
          <span className="text-sm text-red-600 dark:text-red-400">
            {state.error}
          </span>
        )}
      </div>
    </form>
  );
}

function SavingsForm() {
  const [state, action] = useActionState(addSavingsAction, initial);
  const [direction, setDirection] = useState<"in" | "out">("in");
  const formRef = useRef<HTMLFormElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      amountRef.current?.focus();
    }
  }, [state]);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-3">
      <div
        role="radiogroup"
        className="flex gap-1 p-1 rounded-md bg-black/5 dark:bg-white/5 w-fit text-sm"
      >
        {(
          [
            { id: "in", label: "Transfer in" },
            { id: "out", label: "Withdraw" },
          ] as const
        ).map((d) => (
          <button
            key={d.id}
            type="button"
            role="radio"
            aria-checked={direction === d.id}
            onClick={() => setDirection(d.id)}
            className={`px-3 py-1 rounded transition ${
              direction === d.id
                ? "bg-background shadow-sm"
                : "text-zinc-500 hover:text-foreground"
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>
      <input type="hidden" name="direction" value={direction} />
      <div className="grid grid-cols-2 gap-3">
        <input
          ref={amountRef}
          name="amount"
          type="number"
          step="0.01"
          inputMode="decimal"
          required
          placeholder="Amount"
          className={inputCls}
        />
        <input
          name="date"
          type="date"
          required
          defaultValue={todayIso()}
          className={inputCls}
        />
        <input
          name="note"
          type="text"
          placeholder="Note (optional)"
          className={`col-span-2 ${inputCls}`}
        />
      </div>
      <div className="flex items-center gap-3">
        <SubmitButton
          label={direction === "in" ? "Log transfer" : "Log withdrawal"}
        />
        {state.error && (
          <span className="text-sm text-red-600 dark:text-red-400">
            {state.error}
          </span>
        )}
      </div>
    </form>
  );
}

type Tab = "outflow" | "inflow" | "savings";

const TABS: { id: Tab; label: string }[] = [
  { id: "outflow", label: "Outflow" },
  { id: "inflow", label: "Inflow" },
  { id: "savings", label: "Savings" },
];

export function TrackPanel({ categories }: { categories: string[] }) {
  const [tab, setTab] = useState<Tab>("outflow");

  return (
    <div className="mt-4">
      <div
        role="tablist"
        className="flex gap-1 p-1 rounded-md bg-black/5 dark:bg-white/5 mb-4 w-fit"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-1 rounded text-sm transition ${
              tab === t.id
                ? "bg-background shadow-sm"
                : "text-zinc-500 hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "outflow" && <OutflowForm categories={categories} />}
      {tab === "inflow" && <InflowForm />}
      {tab === "savings" && <SavingsForm />}
    </div>
  );
}
