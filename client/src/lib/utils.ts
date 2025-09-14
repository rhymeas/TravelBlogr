import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calculate the number of nights between two German date strings (DD.MM.YYYY)
 * @param startDate - Start date in DD.MM.YYYY format
 * @param endDate - End date in DD.MM.YYYY format
 * @returns Number of nights between the dates
 */
export function calculateNights(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 0;
  
  // Convert DD.MM.YYYY to YYYY-MM-DD
  const parseGermanDate = (dateStr: string): Date => {
    const [day, month, year] = dateStr.split('.');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  };

  const start = parseGermanDate(startDate);
  const end = parseGermanDate(endDate);
  
  // Calculate difference in milliseconds and convert to days
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays); // Ensure non-negative result
}

/**
 * Format nights count with proper German singular/plural form
 * @param nights - Number of nights
 * @returns Formatted string (e.g., "1 Nacht", "2 Nächte")
 */
export function formatNights(nights: number): string {
  if (nights === 1) {
    return "1 Nacht";
  }
  return `${nights} Nächte`;
}
