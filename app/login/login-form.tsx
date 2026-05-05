"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction, type ActionState } from "../actions";

const initial: ActionState = { ok: false };

const inputCls =
  "px-3 py-2 rounded-md border border-black/10 dark:border-white/15 bg-background text-foreground text-sm";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-4 py-2 rounded-md bg-foreground text-background text-sm font-medium disabled:opacity-50"
    >
      {pending ? "Signing in…" : "Sign in"}
    </button>
  );
}

export function LoginForm() {
  const [state, action] = useActionState(loginAction, initial);

  return (
    <form action={action} className="flex flex-col gap-3">
      <input
        name="username"
        type="text"
        autoComplete="username"
        required
        placeholder="Username"
        className={inputCls}
      />
      <input
        name="password"
        type="password"
        autoComplete="current-password"
        required
        placeholder="Password"
        className={inputCls}
      />
      <div className="flex items-center gap-3 mt-1">
        <SubmitButton />
        {state.error && (
          <span className="text-sm text-red-600 dark:text-red-400">
            {state.error}
          </span>
        )}
      </div>
    </form>
  );
}
