import Link from "next/link";
import { Trophy } from "lucide-react";
import type { Metadata } from "next";
import { getSessionMember } from "./lib/session";
import { getPlayBoard } from "./lib/data/play";
import { savePredictionsAction } from "./lib/actions/predictions";
import { PredictionBoard } from "./components/play/PredictionBoard";
import { Button } from "./components/ui/button";

export const metadata: Metadata = { title: "Predicciones · BetaBet" };

export default async function Home() {
  const member = await getSessionMember();

  if (!member) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-100">Sin sesión</h1>
        <p className="text-sm text-neutral-400">
          Abre tu enlace de invitación para empezar a predecir. Es tu acceso personal.
        </p>
        <Button asChild variant="outline" className="mt-2">
          <Link href="/">Volver al inicio</Link>
        </Button>
      </main>
    );
  }

  const items = await getPlayBoard(member.id, member.groupId);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-6 pb-28">
      <header className="mb-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-neutral-400">{member.group.name}</p>
            <h1 className="truncate text-2xl font-bold tracking-tight text-neutral-100">
              Hola, {member.name}
            </h1>
          </div>
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link href={`/groups/${member.group.slug}/leaderboard`}>
              <Trophy className="size-4" />
              Clasificación
            </Link>
          </Button>
        </div>
        <p className="mt-1 text-sm text-neutral-400">Elige el resultado de cada partido.</p>
      </header>

      {items.length === 0 ? (
        <p className="mt-10 text-center text-sm text-neutral-500">
          Todavía no hay partidos en este grupo.
        </p>
      ) : (
        <PredictionBoard items={items} action={savePredictionsAction} />
      )}
    </main>
  );
}
