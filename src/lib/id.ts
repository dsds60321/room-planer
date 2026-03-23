function fallbackIdSegment() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`.slice(0, 8);
}

function getIdSegment() {
  const uuid = globalThis.crypto?.randomUUID?.();

  if (typeof uuid === "string" && uuid.length > 0) {
    return uuid.replace(/-/g, "").slice(0, 8);
  }

  return fallbackIdSegment();
}

export function createShortId(prefix: string) {
  return `${prefix}-${getIdSegment()}`;
}
