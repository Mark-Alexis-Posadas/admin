export const money = (value: number, currency = "PHP") =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency }).format(value);

export const shortMoney = (value: number, currency: string) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency, notation: "compact", maximumFractionDigits: 1 }).format(value);

export const reportDate = (value: string) =>
  new Date(value.length === 10 ? `${value}T00:00:00+08:00` : value)
    .toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Manila" });

export const manilaToday = () => new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);

export const statusColors: Record<string, string> = {
  pending: "bg-amber-400",
  confirmed: "bg-indigo-500",
  shipped: "bg-sky-500",
  delivered: "bg-emerald-500",
  cancelled: "bg-rose-400",
};
