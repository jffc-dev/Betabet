export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-6">
      <div className="mb-4 h-5 w-24 animate-pulse rounded bg-neutral-900" />
      <div className="h-8 w-40 animate-pulse rounded-lg bg-neutral-900" />
      <div className="mt-4 h-10 w-full animate-pulse rounded-xl bg-neutral-900" />
      <div className="mt-4 h-64 w-full animate-pulse rounded-2xl bg-neutral-900" />
    </main>
  );
}
