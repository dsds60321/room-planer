export function formatLength(value: number) {
  return `${Math.round(value).toLocaleString("ko-KR")} mm`;
}

export function formatAreaMm2(areaMm2: number) {
  return `${(areaMm2 / 1_000_000).toFixed(2)} m²`;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
