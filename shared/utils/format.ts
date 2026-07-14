export const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
  }).format(n);

export const formatDate = (d: string | Date) =>
  new Intl.DateTimeFormat('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(d));

export const formatTime = (d: string | Date) =>
  new Intl.DateTimeFormat('en-KE', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(d));

export const daysUntil = (date: string) =>
  Math.ceil(
    (new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

export const formatDateTime = (d: string | Date) =>
  `${formatDate(d)} ${formatTime(d)}`;
