export function formatLength(value: number) {
  return `${Math.round(value).toLocaleString("ko-KR")} mm`;
}

export function formatAreaMm2(areaMm2: number) {
  return `${(areaMm2 / 1_000_000).toFixed(2)} m²`;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
