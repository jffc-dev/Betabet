"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
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

type GroupFormAction = (state: ActionState, formData: FormData) => Promise<ActionState>;

interface GroupFormProps {
  action: GroupFormAction;
  submitLabel: string;
  defaultValues?: {
    name?: string;
    description?: string | null;
    defaultMatchPoints?: number;
    defaultScoringMode?: ScoringMode;
    defaultUniqueHitPoints?: number;
  };
}

export function GroupForm({ action, submitLabel, defaultValues }: GroupFormProps) {
  const [state, formAction, pending] = useActionState(action, initialActionState);
  const [scoringMode, setScoringMode] = useState<ScoringMode>(
    defaultValues?.defaultScoringMode ?? "FLAT",
  );

  useEffect(() => {
    if (state.message && !state.ok) toast.error(state.message);
  }, [state]);

  const fieldError = (name: string) => state.fieldErrors?.[name]?.[0];

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <Field label="Nombre" htmlFor="name" error={fieldError("name")}>
        <Input
          id="name"
          name="name"
          defaultValue={defaultValues?.name}
          placeholder="Liga de la oficina"
          aria-invalid={Boolean(fieldError("name"))}
          autoComplete="off"
          maxLength={60}
          autoFocus
          required
        />
      </Field>

      <Field label="Descripción" htmlFor="description" optional error={fieldError("description")}>
        <Textarea
          id="description"
          name="description"
          defaultValue={defaultValues?.description ?? ""}
          placeholder="¿De qué va este grupo?"
          aria-invalid={Boolean(fieldError("description"))}
          maxLength={280}
          rows={3}
        />
      </Field>

      <Field
        label="Puntos por partido"
        htmlFor="defaultMatchPoints"
        hint="Valor por defecto al crear rondas."
        error={fieldError("defaultMatchPoints")}
      >
        <Input
          id="defaultMatchPoints"
          name="defaultMatchPoints"
          type="number"
          inputMode="numeric"
          min={1}
          max={100}
          defaultValue={defaultValues?.defaultMatchPoints ?? 1}
          aria-invalid={Boolean(fieldError("defaultMatchPoints"))}
          required
        />
      </Field>

      <Field
        label="Modo de puntuación"
        htmlFor="defaultScoringMode"
        hint="Valor por defecto al crear rondas."
        error={fieldError("defaultScoringMode")}
      >
        <Select
          name="defaultScoringMode"
          value={scoringMode}
          onValueChange={(v) => setScoringMode(v as ScoringMode)}
        >
          <SelectTrigger id="defaultScoringMode" aria-invalid={Boolean(fieldError("defaultScoringMode"))}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="FLAT">Plano · todos los aciertos suman igual</SelectItem>
            <SelectItem value="UNIQUE_BONUS">Bonificación única · acierto en solitario</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      {scoringMode === "UNIQUE_BONUS" ? (
        <Field
          label="Puntos por acierto único"
          htmlFor="defaultUniqueHitPoints"
          hint="Se otorgan cuando solo un miembro acierta el partido."
          error={fieldError("defaultUniqueHitPoints")}
        >
          <Input
            id="defaultUniqueHitPoints"
            name="defaultUniqueHitPoints"
            type="number"
            inputMode="numeric"
            min={1}
            max={100}
            defaultValue={defaultValues?.defaultUniqueHitPoints ?? 2}
            aria-invalid={Boolean(fieldError("defaultUniqueHitPoints"))}
            required
          />
        </Field>
      ) : (
        // Keep the value in the payload so the schema always receives it.
        <input
          type="hidden"
          name="defaultUniqueHitPoints"
          value={defaultValues?.defaultUniqueHitPoints ?? 2}
        />
      )}

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
  optional,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  optional?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <Label htmlFor={htmlFor}>{label}</Label>
        {optional ? <span className="text-xs text-neutral-500">Opcional</span> : null}
      </div>
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
