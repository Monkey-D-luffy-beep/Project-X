/**
 * Format INR amounts stored as paise (rupees × 100) for display.
 * Uses Indian numbering: Cr (crore = 10M), L (lakh = 100K).
 *
 * @param paise - Amount in paise as BigInt
 * @returns Formatted string like "₹ 1.2 Cr", "₹ 5.4 L", or "₹ 12,345"
 */
export function formatINR(paise: bigint | number): string {
  const rupees = Number(paise) / 100;

  if (rupees >= 1e7) {
    return `₹ ${(rupees / 1e7).toFixed(1)} Cr`;
  }
  if (rupees >= 1e5) {
    return `₹ ${(rupees / 1e5).toFixed(1)} L`;
  }
  return `₹ ${rupees.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

/**
 * Convert a rupee amount to paise for storage.
 * @param rupees - Amount in rupees
 * @returns BigInt in paise
 */
export function rupeesToPaise(rupees: number): bigint {
  return BigInt(Math.round(rupees * 100));
}

/**
 * Calculate growth percentage between two values.
 * Returns null if base is zero (to display "N/A").
 */
export function calcGrowthPct(
  current: number,
  previous: number
): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}
