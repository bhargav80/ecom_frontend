export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const compactNumberFormatter = new Intl.NumberFormat("en-IN", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export const formatCurrency = (value) => currencyFormatter.format(Number(value || 0));
export const formatCompactNumber = (value) => compactNumberFormatter.format(Number(value || 0));

export const formatDate = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const formatMonth = (value) => {
  if (!value) return "N/A";
  const date = new Date(`${value}-01`);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });
};

export const toSentenceCase = (value = "") =>
  value
    .toString()
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

export const getStatusClasses = (status) => {
  const normalized = status?.toString().toLowerCase();

  switch (normalized) {
    case "paid":
    case "approved":
    case "settled":
    case "active":
    case "delivered":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case "pending":
    case "processing":
      return "bg-amber-50 text-amber-700 border-amber-100";
    case "blocked":
    case "cancelled":
    case "inactive":
      return "bg-rose-50 text-rose-700 border-rose-100";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

export const getPaginationLabel = (page, limit, total) => {
  if (!total) return "0-0 of 0";
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  return `${start}-${end} of ${total}`;
};
