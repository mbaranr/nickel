"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  appendInflow,
  appendOutflow,
  appendSavings,
  getUsers,
} from "@/lib/sheets";
import { clearSession, requireUser, setSession } from "@/lib/auth";

export type ActionState = {
  ok: boolean;
  error?: string;
};

function parseAmount(raw: string): number | null {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

export async function loginAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return { ok: false, error: "Username and password required." };
  }

  let users;
  try {
    users = await getUsers();
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to verify.",
    };
  }

  const match = users.find(
    (u) => u.username === username && u.password === password,
  );
  if (!match) return { ok: false, error: "Invalid credentials." };

  await setSession(username, password);
  redirect("/");
}

export async function logoutAction(): Promise<void> {
  await clearSession();
  redirect("/login");
}

export async function addOutflowAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { username } = await requireUser();
  const category = String(formData.get("category") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  const amount = parseAmount(String(formData.get("amount") ?? "").trim());

  if (!category) return { ok: false, error: "Pick a category." };
  if (!date) return { ok: false, error: "Date is required." };
  if (amount === null) return { ok: false, error: "Amount must be positive." };

  try {
    await appendOutflow(username, { date, category, amount, note });
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
  const { username } = await requireUser();
  const source = String(formData.get("source") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  const amount = parseAmount(String(formData.get("amount") ?? "").trim());

  if (!source) return { ok: false, error: "Source is required." };
  if (!date) return { ok: false, error: "Date is required." };
  if (amount === null) return { ok: false, error: "Amount must be positive." };

  try {
    await appendInflow(username, { date, source, amount, note });
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
  const { username } = await requireUser();
  const date = String(formData.get("date") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  const direction = String(formData.get("direction") ?? "in");
  const amount = parseAmount(String(formData.get("amount") ?? "").trim());

  if (!date) return { ok: false, error: "Date is required." };
  if (amount === null) return { ok: false, error: "Amount must be positive." };

  const signed = direction === "out" ? -amount : amount;

  try {
    await appendSavings(username, { date, amount: signed, note });
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to save.",
    };
  }
  revalidatePath("/");
  return { ok: true };
}
