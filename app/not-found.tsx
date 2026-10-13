import { scaffoldCopy } from "./scaffold-copy";

export default function NotFound() {
  const copy = scaffoldCopy("en");

  return (
    <main className="bg-background text-foreground">
      <h1>{copy.notFound}</h1>
    </main>
  );
}
