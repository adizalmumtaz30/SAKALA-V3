"use client";

import { useActionState } from "react";
import type { FormState } from "@/lib/application/master-data.actions";

const initialState: FormState = {};

interface NameOnlyCreateFormProps {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  placeholder: string;
  submitLabel: string;
}

export function NameOnlyCreateForm({
  action,
  placeholder,
  submitLabel,
}: NameOnlyCreateFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex items-start gap-2">
      <div className="flex-1">
        <input
          name="name"
          required
          placeholder={placeholder}
          className="w-full rounded-lg border border-hairline-strong bg-surface px-3.5 py-2.5 text-[13.5px] text-ink outline-none placeholder:text-ink-faint focus:border-accent-teal"
        />
        {state.error && (
          <p className="mt-1.5 text-[12px] text-status-blocked">
            {state.error}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="shrink-0 rounded-lg bg-accent-teal px-4 py-2.5 text-[13px] font-medium text-accent-teal-ink transition-opacity disabled:opacity-60"
      >
        {pending ? "Menyimpan…" : submitLabel}
      </button>
    </form>
  );
}
