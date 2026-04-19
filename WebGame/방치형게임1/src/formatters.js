export function formatNumber(value) {
  if (value < 1000) {
    return value.toFixed(value >= 10 || Number.isInteger(value) ? 0 : 1);
  }

  const units = ["K", "M", "B", "T", "Qa", "Qi"];
  let unitIndex = -1;
  let scaled = value;

  while (scaled >= 1000 && unitIndex < units.length - 1) {
    scaled /= 1000;
    unitIndex += 1;
  }

  const digits = scaled >= 100 ? 0 : scaled >= 10 ? 1 : 2;
  return `${scaled.toFixed(digits)}${units[unitIndex]}`;
}

export function formatRelativeTime(timestamp) {
  const diffSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));

  if (diffSeconds < 5) {
    return "방금 전";
  }

  if (diffSeconds < 60) {
    return `${diffSeconds}초 전`;
  }

  if (diffSeconds < 3600) {
    return `${Math.floor(diffSeconds / 60)}분 전`;
  }

  return `${Math.floor(diffSeconds / 3600)}시간 전`;
}
