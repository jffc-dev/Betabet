"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      theme="dark"
      toastOptions={{
        classNames: {
          toast:
            "rounded-2xl border border-neutral-800 bg-neutral-900 text-neutral-100 shadow-lg",
          description: "text-neutral-400",
        },
      }}
    />
  );
}
