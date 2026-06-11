import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "../../components/ui/button";

export const metadata: Metadata = { title: "Invitación no válida · BetaBet" };

export default function InvalidInvitationPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h1 className="text-2xl font-bold tracking-tight text-neutral-100">
        Invitación no válida
      </h1>
      <p className="text-sm text-neutral-400">
        Este enlace no existe o ya no está disponible. Pide a quien administra el grupo que
        te comparta una invitación nueva.
      </p>
      <Button asChild variant="outline" className="mt-2">
        <Link href="/">Volver al inicio</Link>
      </Button>
    </main>
  );
}
