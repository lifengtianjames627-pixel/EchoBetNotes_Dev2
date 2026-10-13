"use client";

import { scaffoldCopy } from "./scaffold-copy";

export default function ScaffoldError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const copy = scaffoldCopy("en");

  return (
    <main className="bg-background text-foreground">
      <h1>{copy.error}</h1>
      <button type="button" onClick={() => reset()}>
        {copy.retry}
      </button>
    </main>
  );
}
