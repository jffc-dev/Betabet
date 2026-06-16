export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-6">
      <div className="mb-4 h-5 w-24 animate-pulse rounded bg-neutral-900" />
      <div className="h-8 w-48 animate-pulse rounded-lg bg-neutral-900" />
      <div className="mt-5 flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-neutral-900" />
        ))}
      </div>
    </main>
  );
}
