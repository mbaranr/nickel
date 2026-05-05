import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUsers } from "./sheets";

const COOKIE_NAME = "nickel_session";

export type SessionUser = {
  username: string;
  currency: string;
};

function encode(username: string, password: string): string {
  return Buffer.from(`${username}:${password}`, "utf-8").toString("base64");
}

function decode(raw: string): { username: string; password: string } | null {
  try {
    const decoded = Buffer.from(raw, "base64").toString("utf-8");
    const sep = decoded.indexOf(":");
    if (sep === -1) return null;
    return {
      username: decoded.slice(0, sep),
      password: decoded.slice(sep + 1),
    };
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  const creds = decode(raw);
  if (!creds) return null;

  let users;
  try {
    users = await getUsers();
  } catch {
    return null;
  }
  const match = users.find(
    (u) => u.username === creds.username && u.password === creds.password,
  );
  return match
    ? { username: match.username, currency: match.currency }
    : null;
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function setSession(
  username: string,
  password: string,
): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, encode(username, password), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
