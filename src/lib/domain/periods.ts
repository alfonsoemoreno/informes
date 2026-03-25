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

export function getTheocraticYearForPeriod(year: number, month: number) {
  return month >= 9 ? year + 1 : year;
}

export function getCurrentTheocraticYear() {
  const now = new Date();
  return getTheocraticYearForPeriod(now.getUTCFullYear(), now.getUTCMonth() + 1);
}

export function getTheocraticYearRange(theocraticYear: number) {
  return {
    theocraticYear,
    startYear: theocraticYear - 1,
    startMonth: 9,
    endYear: theocraticYear,
    endMonth: 8,
  };
}

export function formatTheocraticYearLabel(theocraticYear: number) {
  const range = getTheocraticYearRange(theocraticYear);
  return `Año teocrático ${theocraticYear} (${formatMonthYear(
    range.startYear,
    range.startMonth,
  )} a ${formatMonthYear(range.endYear, range.endMonth)})`;
}

export function startOfUtcMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
}

export function addUtcMonths(date: Date, months: number) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1, 0, 0, 0, 0),
  );
}

export function getRollingMonthPeriods(year: number, month: number, length: number) {
  const end = startOfUtcMonth(year, month);

  return Array.from({ length }, (_, index) => {
    const date = addUtcMonths(end, -(length - 1 - index));
    return {
      year: date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
      key: `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`,
    };
  });
}
