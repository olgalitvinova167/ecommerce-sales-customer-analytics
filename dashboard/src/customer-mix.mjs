// These groups partition the existing selected-period purchasing customers.
// Derive from the validated customer counts, without changing the KPI calculation.
export function customerMix(kpis) {
  const total = kpis.customers_with_completed_orders;
  const repeat = kpis.repeat_customers ?? 0;
  const oneTime = total - repeat;
  const percentage = count => total ? Math.round(count * 10000 / total) / 100 : null;
  return {
    total,
    groups: [
      { label: 'Repeat Customers', count: repeat, percentage: percentage(repeat) },
      { label: 'One-time Customers', count: oneTime, percentage: percentage(oneTime) },
    ],
  };
}
