"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "../ui/button";

function ConfirmButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="destructive" disabled={pending} className="w-full">
      {pending ? "Eliminando…" : "Sí, eliminar"}
    </Button>
  );
}

export function DeleteGroupButton({ action }: { action: () => Promise<void> }) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <Button
        type="button"
        variant="destructive"
        className="w-full"
        onClick={() => setConfirming(true)}
      >
        Eliminar grupo
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-red-900/50 bg-red-950/20 p-3">
      <p className="text-sm text-neutral-300">
        ¿Eliminar este grupo y todo su contenido? Esta acción no se puede deshacer.
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => setConfirming(false)}
        >
          Cancelar
        </Button>
        <form action={action} className="flex-1">
          <ConfirmButton />
        </form>
      </div>
    </div>
  );
}
