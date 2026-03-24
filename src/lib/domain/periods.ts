export function getMonthBounds(year: number, month: number) {
  const monthStart = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const monthEnd = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  return { monthStart, monthEnd };
}

export function overlapsPeriod(
  effectiveFrom: Date,
  effectiveTo: Date | null,
  rangeStart: Date,
  rangeEnd: Date,
) {
  return effectiveFrom <= rangeEnd && (effectiveTo === null || effectiveTo >= rangeStart);
}

export function formatMonthYear(year: number, month: number) {
  return new Intl.DateTimeFormat("es-CL", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}
