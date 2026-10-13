import { scaffoldCopy } from "./scaffold-copy";

export default function Loading() {
  const copy = scaffoldCopy("en");

  return (
    <main className="bg-background text-foreground">
      <p>{copy.loading}</p>
    </main>
  );
}
