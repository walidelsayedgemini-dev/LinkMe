export function paidTotalsByCurrency(
  orders: ReadonlyArray<{
    status: string;
    currency: string;
    amountCents: number;
  }>
): Array<{ currency: string; amountCents: number }> {
  const totals = new Map<string, number>();
  for (const order of orders) {
    if (order.status !== "paid") continue;
    totals.set(
      order.currency,
      (totals.get(order.currency) ?? 0) + order.amountCents
    );
  }
  return [...totals]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([currency, amountCents]) => ({ currency, amountCents }));
}
