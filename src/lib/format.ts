/**
 * Formatação de datas, moeda e números para o público angolano.
 *
 * Convenções:
 *  - Moeda: Kwanza (`Kz`) escrito à frente do valor, ex. `Kz 1.480,00`.
 *  - Datas em português de Angola (pt-PT), ex. `quarta-feira, 12 de novembro`.
 *  - Separador decimal vírgula e separador de milhares ponto.
 */

export const LOCALE = "pt-PT";

const numberFormatter = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFormatterNoDecimals = new Intl.NumberFormat(LOCALE, {
  maximumFractionDigits: 0,
});

/** `1480` -> `Kz 1.480,00` */
export function formatKz(value: number): string {
  return `Kz ${numberFormatter.format(value)}`;
}

/** `1480` -> `1.480` */
export function formatNumber(value: number): string {
  return numberFormatterNoDecimals.format(value);
}

/** `72.4` -> `72,4 %` */
export function formatPercent(value: number, decimals = 0): string {
  return `${new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)} %`;
}

/** `28.4` -> `28 °C` */
export function formatTemperature(value: number, decimals = 0): string {
  return `${new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)} °C`;
}

/** `12.4` -> `12,4 mm` */
export function formatMillimetres(value: number, decimals = 0): string {
  return `${new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)} mm`;
}

/** `quarta-feira, 12 de novembro` */
export function formatLongDate(date: Date): string {
  return new Intl.DateTimeFormat(LOCALE, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/** `12 de novembro` */
export function formatMediumDate(date: Date): string {
  return new Intl.DateTimeFormat(LOCALE, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/** `12 nov` */
export function formatShortDate(date: Date): string {
  return new Intl.DateTimeFormat(LOCALE, {
    day: "numeric",
    month: "short",
  }).format(date);
}

/** `quarta-feira` */
export function formatWeekday(date: Date): string {
  return new Intl.DateTimeFormat(LOCALE, { weekday: "short" })
    .format(date)
    .replace(".", "");
}

/** `12` — dia do mês */
export function formatDayOfMonth(date: Date): string {
  return new Intl.DateTimeFormat(LOCALE, { day: "numeric" }).format(date);
}

/** `Hoje`, `Ontem`, `12 de nov` — usado nos registos de colheita e de contas. */
export function formatRelativeDay(date: Date, today = new Date()): string {
  const startOf = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOf(today) - startOf(date)) / 86_400_000);

  if (diffDays === 0) return "Hoje";
  if (diffDays === 1) return "Ontem";
  if (diffDays === -1) return "Amanhã";
  return formatShortDate(date);
}

/** `09:30` */
export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat(LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
