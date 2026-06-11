import PredictionDeck from "./components/PredictionDeck";
import { matches } from "./lib/matches";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-emerald-400">
          BetaBet
        </h1>
        <p className="mt-1 text-sm text-neutral-400">
          Elige el resultado de cada partido.
        </p>
      </header>

      <PredictionDeck matches={matches} />
    </main>
  );
}
