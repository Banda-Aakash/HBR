/** Rupee amounts the way they're read in India: ₹45,000, ₹12.5 L, ₹3.2 Cr */
export function formatPrice(price: number, unit?: string): string {
  const suffix = unit === 'month' ? '/mo' : '';
  const short = (value: number) => Number(value.toFixed(1)).toString();

  if (price >= 1e7) {return `₹${short(price / 1e7)} Cr${suffix}`;}
  if (price >= 1e5) {return `₹${short(price / 1e5)} L${suffix}`;}
  return `₹${price.toLocaleString('en-IN')}${suffix}`;
}

/**
 * YYYY-MM-DD on the user's own calendar. toISOString uses UTC instead,
 * which is still yesterday in India until 5:30 am.
 */
export function toDateString(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Reads YYYY-MM-DD as local midnight. new Date() alone would read it as UTC. */
export function parseDate(dateString: string): Date {
  return new Date(`${dateString}T00:00:00`);
}
