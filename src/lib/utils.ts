import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { differenceInDays, format, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  value: number,
  currency = "NOK",
  compact = false
) {
  if (compact && value >= 1_000_000)
    return `${currency} ${(value / 1_000_000).toFixed(1)}M`;
  if (compact && value >= 1_000)
    return `${currency} ${(value / 1_000).toFixed(0)}k`;
  return new Intl.NumberFormat("nb-NO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number, compact = false) {
  if (compact && value >= 1_000_000)
    return `${(value / 1_000_000).toFixed(1)}M`;
  if (compact && value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return new Intl.NumberFormat("nb-NO").format(value);
}

export function formatPercent(value: number, decimals = 1) {
  return `${value.toFixed(decimals)}%`;
}

export function daysAgo(isoDate: string) {
  return differenceInDays(new Date(), parseISO(isoDate));
}

export function daysBetween(from: string, to: string) {
  return differenceInDays(parseISO(to), parseISO(from));
}

export function formatDate(isoDate: string, fmt = "dd MMM yyyy") {
  return format(parseISO(isoDate), fmt);
}

export function formatDateShort(isoDate: string) {
  return format(parseISO(isoDate), "dd MMM");
}

export function getStuckColor(days: number) {
  if (days > 14) return "text-danger";
  if (days > 7) return "text-warning";
  return "text-text-secondary";
}

export function getBadgeColor(days: number) {
  if (days > 14) return "bg-danger/20 text-danger border-danger/30";
  if (days > 7) return "bg-warning/20 text-warning border-warning/30";
  return "bg-success/20 text-success border-success/30";
}

export const BOARD_COLORS: Record<string, string> = {
  evaluation: "#6366f1",
  sales: "#f59e0b",
  aftercare: "#10b981",
};

export const PLATFORM_COLORS: Record<string, string> = {
  meta: "#1877F2",
  google: "#EA4335",
  organic: "#10b981",
  other: "#6b7280",
};

export const PLATFORM_LABELS: Record<string, string> = {
  meta: "Meta",
  google: "Google Ads",
  organic: "Organic",
  other: "Other",
};
