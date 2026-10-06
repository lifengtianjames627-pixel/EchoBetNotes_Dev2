// Persisted hash namespaces are fixed bytes, not display branding.
// Keep their historical values so a rename cannot reset network matches
// or count the same anonymous visitor twice in one day.
export function stableIdentityInput(suffix, value) {
  const namespace = new Uint8Array([99, 104, 111, 114, 100, 109, 97, 116, 101, 115]);
  const tail = new TextEncoder().encode(`-${suffix}|${value}`);
  const input = new Uint8Array(namespace.length + tail.length);
  input.set(namespace);
  input.set(tail, namespace.length);
  return input;
}