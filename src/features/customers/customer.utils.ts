export const peso = (value: number) => new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(value);
export const date = (value: string) => new Date(value).toLocaleDateString("en-PH", { dateStyle: "medium", timeZone: "Asia/Manila" });
export const spendingNote = "Order value including shipping, excluding cancelled orders. Includes unpaid COD orders.";
export const panelClass = "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm";
export const buttonClass = "rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40";
