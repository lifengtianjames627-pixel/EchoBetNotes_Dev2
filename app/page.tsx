import { scaffoldCopy } from "./scaffold-copy";

export default function HomePage() {
  const copy = scaffoldCopy("en");

  return (
    <main className="bg-background text-foreground">
      <h1>{copy.title}</h1>
      <p>{copy.status}</p>
    </main>
  );
}
