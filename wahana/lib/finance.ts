/** Monthly instalment on a reducing-balance loan. */
export function monthlyPayment(principal: number, annualRate: number, months: number) {
  if (principal <= 0 || months <= 0) return 0;
  const r = annualRate / 100 / 12;
  if (r === 0) return principal / months;
  return (principal * r) / (1 - Math.pow(1 + r, -months));
}

/** The calculator's starting assumptions, shared with the ad page summary. */
export const LEASE_DEFAULTS = { downPct: 30, months: 60, rate: 14 };

export function leaseEstimate(price: number) {
  const loan = price * (1 - LEASE_DEFAULTS.downPct / 100);
  return monthlyPayment(loan, LEASE_DEFAULTS.rate, LEASE_DEFAULTS.months);
}
