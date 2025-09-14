// Tour data constants and utilities
export const TOUR_CONSTANTS = {
  TOTAL_DAYS: 17,
  TOTAL_DISTANCE: 2130,
  TOTAL_COST: 8779,
  CURRENCY: "CAD",
  START_DATE: "20.09.2025",
  END_DATE: "06.10.2025",
} as const;

export const formatDate = (dateString: string) => {
  // Convert DD.MM.YYYY to a more readable format
  const [day, month, year] = dateString.split('.');
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return date.toLocaleDateString('de-DE', { 
    day: '2-digit', 
    month: 'short',
    year: 'numeric'
  });
};

export const calculateDaysBetween = (startDate: string, endDate: string) => {
  const [startDay, startMonth, startYear] = startDate.split('.').map(Number);
  const [endDay, endMonth, endYear] = endDate.split('.').map(Number);
  
  const start = new Date(startYear, startMonth - 1, startDay);
  const end = new Date(endYear, endMonth - 1, endDay);
  
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

export const formatCurrency = (amount: number, currency: string = "CAD") => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
  }).format(amount);
};
