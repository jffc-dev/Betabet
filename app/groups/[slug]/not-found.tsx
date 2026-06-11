import Link from "next/link";
import { Button } from "../../components/ui/button";

export default function GroupNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h1 className="text-2xl font-bold tracking-tight text-neutral-100">Grupo no encontrado</h1>
      <p className="text-sm text-neutral-400">
        Este grupo no existe o fue eliminado.
      </p>
      <Button asChild className="mt-2">
        <Link href="/groups">Ver mis grupos</Link>
      </Button>
    </main>
  );
}
