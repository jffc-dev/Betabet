export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-6">
      <div className="mb-5 flex items-center justify-between">
        <div className="h-8 w-28 animate-pulse rounded-lg bg-neutral-900" />
        <div className="h-9 w-20 animate-pulse rounded-2xl bg-neutral-900" />
      </div>
      <ul className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <li key={i} className="h-24 animate-pulse rounded-3xl bg-neutral-900" />
        ))}
      </ul>
    </main>
  );
}
