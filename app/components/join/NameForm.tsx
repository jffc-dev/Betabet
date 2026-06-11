"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { initialActionState, type ActionState } from "../../lib/actions/types";

export function NameForm({
  action,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction, pending] = useActionState(action, initialActionState);

  useEffect(() => {
    if (state.message && !state.ok) toast.error(state.message);
  }, [state]);

  const error = state.fieldErrors?.name?.[0];

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Tu nombre</Label>
        <Input
          id="name"
          name="name"
          placeholder="¿Cómo te llamas?"
          autoComplete="name"
          maxLength={40}
          aria-invalid={Boolean(error)}
          autoFocus
          required
        />
        {error ? (
          <p className="text-xs text-red-400" role="alert">
            {error}
          </p>
        ) : null}
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Entrando…" : "Empezar a predecir"}
      </Button>
    </form>
  );
}
