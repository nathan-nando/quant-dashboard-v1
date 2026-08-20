export const JAKARTA_OFFSET_SECONDS = 7 * 3600; // Asia/Jakarta (WIB = UTC+7)

export function parseToDate(input: string | number | Date): Date {
  if (input instanceof Date) return input;
  if (typeof input === 'number') {
    return input > 1e11 ? new Date(input) : new Date(input * 1000);
  }
  return new Date(input);
}

export function formatJakartaDateTime(input: string | number | Date | null | undefined): {
  date: string;
  time: string;
  full: string;
  short: string;
} {
  if (!input) {
    return { date: '-', time: '-', full: '-', short: '-' };
  }
  const d = parseToDate(input);
  if (isNaN(d.getTime())) {
    return { date: '-', time: '-', full: '-', short: '-' };
  }

  const datePart = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit',
    month: 'short',
    year: '2-digit',
  }).format(d); // e.g. "21 Aug 26"

  const timePart = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(d); // e.g. "00:22:41"

  const timeShort = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d); // e.g. "00:22"

  const fullDate = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d); // e.g. "21 Aug 2026"

  return {
    date: datePart,
    time: timePart,
    full: `${fullDate}, ${timePart} WIB`,
    short: `${datePart} ${timeShort}`,
  };
}
