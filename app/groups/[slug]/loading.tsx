export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-6">
      <div className="mb-4 h-5 w-20 animate-pulse rounded bg-neutral-900" />
      <div className="h-8 w-48 animate-pulse rounded-lg bg-neutral-900" />
      <div className="mt-5 grid grid-cols-3 gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-2xl bg-neutral-900" />
        ))}
      </div>
      <div className="mt-7 h-20 animate-pulse rounded-2xl bg-neutral-900" />
    </main>
  );
}
