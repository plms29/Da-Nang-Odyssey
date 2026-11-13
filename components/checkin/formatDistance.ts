/**
 * Format distance in metres for Vietnamese check-in feedback:
 * - < 1000 m: rounded to nearest 10 m (e.g. 87 -> "90 m")
 * - >= 1000 m: km with 1 decimal and Vietnamese comma (e.g. 2345 -> "2,3 km")
 */
export function formatDistance(m: number): string {
  const safe = Number.isFinite(m) ? Math.max(0, m) : 0;
  const roundedMetres = Math.round(safe / 10) * 10;
  if (roundedMetres < 1000) {
    return `${roundedMetres} m`;
  }
  const km = (safe / 1000).toFixed(1).replace(".", ",");
  return `${km} km`;
}
