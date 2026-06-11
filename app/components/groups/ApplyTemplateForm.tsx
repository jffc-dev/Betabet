"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { initialActionState, type ActionState } from "../../lib/actions/types";

export function ApplyTemplateForm({
  action,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction, pending] = useActionState(action, initialActionState);

  useEffect(() => {
    if (!state.message) return;
    (state.ok ? toast.success : toast.error)(state.message);
  }, [state]);

  return (
    <form action={formAction} className="mt-2 flex gap-2">
      <label className="sr-only" htmlFor="groupBy">
        Cómo dividir en rondas
      </label>
      <select
        id="groupBy"
        name="groupBy"
        defaultValue="GROUP"
        disabled={pending}
        className="h-9 flex-1 rounded-xl border border-neutral-700 bg-neutral-900 px-2 text-xs text-neutral-200 focus-visible:border-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30 disabled:opacity-50"
      >
        <option value="GROUP">Una ronda por grupo</option>
        <option value="MATCHDAY">Una ronda por jornada</option>
        <option value="NONE">Una sola ronda</option>
      </select>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Aplicando…" : "Aplicar"}
      </Button>
    </form>
  );
}
