import "server-only";
import { google } from "googleapis";

export type SetupType =
  | "income"
  | "tax"
  | "fixed"
  | "variable"
  | "savings_rate";

export type SetupRow = {
  type: SetupType;
  name: string;
  amount: number;
  notes: string;
};

export type OutflowRow = {
  date: string;
  category: string;
  amount: number;
  note: string;
};

export type InflowRow = {
  date: string;
  source: string;
  amount: number;
  note: string;
};

export type SavingsRow = {
  date: string;
  amount: number;
  note: string;
};

export type UserRow = {
  username: string;
  password: string;
  currency: string;
};

function getSheets() {
  const b64 = process.env.GOOGLE_CREDENTIALS_BASE64;
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!b64) throw new Error("GOOGLE_CREDENTIALS_BASE64 is not set");
  if (!sheetId) throw new Error("GOOGLE_SHEET_ID is not set");

  const credentials = JSON.parse(Buffer.from(b64, "base64").toString("utf-8"));
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return { sheets: google.sheets({ version: "v4", auth }), sheetId };
}

const VALID_TYPES: ReadonlySet<string> = new Set([
  "income",
  "tax",
  "fixed",
  "variable",
  "savings_rate",
]);

export async function getUsers(): Promise<UserRow[]> {
  const { sheets, sheetId } = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "Users!A2:C",
  });
  const rows = res.data.values ?? [];
  return rows
    .filter((r) => r[0] && r[1] !== undefined && r[1] !== "")
    .map((r) => ({
      username: String(r[0]).trim(),
      password: String(r[1]),
      currency: String(r[2] ?? "").trim() || "$",
    }));
}

export async function getSetup(user: string): Promise<SetupRow[]> {
  const { sheets, sheetId } = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "Setup!A2:E",
  });
  const rows = res.data.values ?? [];
  return rows
    .filter(
      (r) =>
        String(r[0] ?? "").trim() === user &&
        r[1] &&
        r[2] &&
        VALID_TYPES.has(String(r[1]).trim().toLowerCase()),
    )
    .map((r) => ({
      type: String(r[1]).trim().toLowerCase() as SetupType,
      name: String(r[2]).trim(),
      amount: Number(r[3] ?? 0) || 0,
      notes: String(r[4] ?? ""),
    }));
}

export async function getOutflows(user: string): Promise<OutflowRow[]> {
  const { sheets, sheetId } = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "Outflows!A2:E",
  });
  const rows = res.data.values ?? [];
  return rows
    .filter(
      (r) =>
        String(r[0] ?? "").trim() === user &&
        r[1] &&
        r[2] &&
        r[3] !== undefined &&
        r[3] !== "",
    )
    .map((r) => ({
      date: String(r[1]).trim(),
      category: String(r[2]).trim(),
      amount: Number(r[3]) || 0,
      note: String(r[4] ?? ""),
    }));
}

export async function appendOutflow(
  user: string,
  row: OutflowRow,
): Promise<void> {
  const { sheets, sheetId } = getSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: "Outflows!A:E",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[user, row.date, row.category, row.amount, row.note]],
    },
  });
}

export async function getInflows(user: string): Promise<InflowRow[]> {
  const { sheets, sheetId } = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "Inflows!A2:E",
  });
  const rows = res.data.values ?? [];
  return rows
    .filter(
      (r) =>
        String(r[0] ?? "").trim() === user &&
        r[1] &&
        r[3] !== undefined &&
        r[3] !== "",
    )
    .map((r) => ({
      date: String(r[1]).trim(),
      source: String(r[2] ?? "").trim(),
      amount: Number(r[3]) || 0,
      note: String(r[4] ?? ""),
    }));
}

export async function appendInflow(
  user: string,
  row: InflowRow,
): Promise<void> {
  const { sheets, sheetId } = getSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: "Inflows!A:E",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[user, row.date, row.source, row.amount, row.note]],
    },
  });
}

export async function getSavings(user: string): Promise<SavingsRow[]> {
  const { sheets, sheetId } = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "Savings!A2:D",
  });
  const rows = res.data.values ?? [];
  return rows
    .filter(
      (r) =>
        String(r[0] ?? "").trim() === user &&
        r[1] &&
        r[2] !== undefined &&
        r[2] !== "",
    )
    .map((r) => ({
      date: String(r[1]).trim(),
      amount: Number(r[2]) || 0,
      note: String(r[3] ?? ""),
    }));
}

export async function appendSavings(
  user: string,
  row: SavingsRow,
): Promise<void> {
  const { sheets, sheetId } = getSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: "Savings!A:D",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[user, row.date, row.amount, row.note]],
    },
  });
}
