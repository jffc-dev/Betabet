"use client";

import { useActionState, useEffect, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { initialActionState, type ActionState } from "../../lib/actions/types";

type ScoringMode = "FLAT" | "UNIQUE_BONUS";

type RoundFormAction = (state: ActionState, formData: FormData) => Promise<ActionState>;

interface RoundFormProps {
  action: RoundFormAction;
  submitLabel: string;
  defaultValues: {
    title: string;
    scoringMode: ScoringMode;
  };
}

export function RoundForm({ action, submitLabel, defaultValues }: RoundFormProps) {
  const [state, formAction, pending] = useActionState(action, initialActionState);

  useEffect(() => {
    if (state.message && !state.ok) toast.error(state.message);
  }, [state]);

  const fieldError = (name: string) => state.fieldErrors?.[name]?.[0];

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <Field label="Título" htmlFor="title" error={fieldError("title")}>
        <Input
          id="title"
          name="title"
          defaultValue={defaultValues.title}
          placeholder="Jornada 1"
          aria-invalid={Boolean(fieldError("title"))}
          autoComplete="off"
          maxLength={80}
          required
        />
      </Field>

      <Field
        label="Modo de puntuación"
        htmlFor="scoringMode"
        hint="Cambiarlo recalcula los puntos de los partidos ya finalizados."
        error={fieldError("scoringMode")}
      >
        <Select name="scoringMode" defaultValue={defaultValues.scoringMode}>
          <SelectTrigger id="scoringMode" aria-invalid={Boolean(fieldError("scoringMode"))}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="FLAT">Plano · todos los aciertos suman igual</SelectItem>
            <SelectItem value="UNIQUE_BONUS">Bonificación única · acierto en solitario</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <Button type="submit" disabled={pending} className="mt-1 w-full">
        {pending ? "Guardando…" : submitLabel}
      </Button>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p className="text-xs text-red-400" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-neutral-500">{hint}</p>
      ) : null}
    </div>
  );
}
