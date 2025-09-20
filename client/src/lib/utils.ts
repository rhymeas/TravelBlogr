import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calculate the number of nights between two date strings
 * Supports both DD.MM.YYYY format and ISO datetime strings
 * @param startDate - Start date in DD.MM.YYYY or ISO format
 * @param endDate - End date in DD.MM.YYYY or ISO format
 * @returns Number of nights between the dates
 */
export function calculateNights(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 0;
  
  // Parse date string - handles both DD.MM.YYYY and ISO datetime formats
  const parseDate = (dateStr: string): Date => {
    // Check if it's ISO datetime format (contains T or looks like YYYY-MM-DD)
    if (dateStr.includes('T') || dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
      return new Date(dateStr);
    }
    
    // Otherwise, assume DD.MM.YYYY format
    const [day, month, year] = dateStr.split('.');
    if (!day || !month || !year) {
      console.warn(`Invalid date format: ${dateStr}. Expected DD.MM.YYYY or ISO format.`);
      return new Date(dateStr); // Fallback to native Date parsing
    }
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  };

  const start = parseDate(startDate);
  const end = parseDate(endDate);
  
  // Validate parsed dates
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    console.warn(`Invalid dates: start=${startDate}, end=${endDate}`);
    return 0;
  }
  
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
