const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function hasAsciiControl(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code <= 0x1f || code === 0x7f) {
      return true;
    }
  }
  return false;
}

function isUuid(value: string): boolean {
  return value.length === 36 && !hasAsciiControl(value) && UUID_PATTERN.test(value);
}

function readRequestIdHeader(headers: Headers): string | null {
  try {
    const value = headers.get("x-request-id");
    if (typeof value !== "string" || value.length === 0) {
      return null;
    }
    return value;
  } catch {
    return null;
  }
}

export function readOrCreateRequestId(headers: Headers): string {
  const incoming = readRequestIdHeader(headers);
  if (incoming !== null && isUuid(incoming)) {
    return incoming.toLowerCase();
  }
  return crypto.randomUUID();
}
