"use server";

import { revalidatePath } from "next/cache";
import { appendInflow, appendOutflow, appendSavings } from "@/lib/sheets";

export type ActionState = {
  ok: boolean;
  error?: string;
};

function parseAmount(raw: string): number | null {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

export async function addOutflowAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const category = String(formData.get("category") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  const amount = parseAmount(String(formData.get("amount") ?? "").trim());

  if (!category) return { ok: false, error: "Pick a category." };
  if (!date) return { ok: false, error: "Date is required." };
  if (amount === null) return { ok: false, error: "Amount must be positive." };

  try {
    await appendOutflow({ date, category, amount, note });
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to save.",
    };
  }
  revalidatePath("/");
  return { ok: true };
}

export async function addInflowAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const source = String(formData.get("source") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  const amount = parseAmount(String(formData.get("amount") ?? "").trim());

  if (!source) return { ok: false, error: "Source is required." };
  if (!date) return { ok: false, error: "Date is required." };
  if (amount === null) return { ok: false, error: "Amount must be positive." };

  try {
    await appendInflow({ date, source, amount, note });
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to save.",
    };
  }
  revalidatePath("/");
  return { ok: true };
}

export async function addSavingsAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const date = String(formData.get("date") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  const direction = String(formData.get("direction") ?? "in");
  const amount = parseAmount(String(formData.get("amount") ?? "").trim());

  if (!date) return { ok: false, error: "Date is required." };
  if (amount === null) return { ok: false, error: "Amount must be positive." };

  const signed = direction === "out" ? -amount : amount;

  try {
    await appendSavings({ date, amount: signed, note });
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to save.",
    };
  }
  revalidatePath("/");
  return { ok: true };
}
