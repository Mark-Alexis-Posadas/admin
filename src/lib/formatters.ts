export const formatCurrency = (value: number, currency = "PHP") =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency }).format(value);

export const formatCompactCurrency = (value: number, currency = "PHP") =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

export const formatDate = (
  value: string,
  options: Intl.DateTimeFormatOptions = {
    dateStyle: "medium",
    timeZone: "Asia/Manila",
  },
) => new Date(value).toLocaleDateString("en-PH", options);

export const formatDateTime = (
  value: string,
  options: Intl.DateTimeFormatOptions = {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  },
) => new Date(value).toLocaleString("en-PH", options);

export const formatReportDate = (value: string) =>
  formatDate(value.length === 10 ? `${value}T00:00:00+08:00` : value, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Manila",
  });

export const manilaToday = () =>
  new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
