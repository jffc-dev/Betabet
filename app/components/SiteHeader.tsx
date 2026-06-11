import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-md items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold tracking-tight text-emerald-400">
          BetaBet
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/groups"
            className="rounded-lg px-3 py-1.5 text-neutral-300 transition-colors hover:bg-neutral-800"
          >
            Grupos
          </Link>
        </nav>
      </div>
    </header>
  );
}
