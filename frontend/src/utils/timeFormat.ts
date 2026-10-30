/**
 * Utility functions for 12-Hour format conversion and cleaning buffer calculations
 */

/**
 * Converts a 24-hour time string ("14:30") or existing time string to 12-hour format ("02:30 PM")
 */
export function formatTo12Hour(timeStr?: string): string {
  if (!timeStr) return '';
  const trimmed = timeStr.trim();

  // If already a clean 12-hour format with AM/PM for both start & end
  if (trimmed.toUpperCase().includes('AM') || trimmed.toUpperCase().includes('PM')) {
    const amPmCount = (trimmed.toUpperCase().match(/(AM|PM)/g) || []).length;
    if (amPmCount >= 2 || (!trimmed.includes('-') && !trimmed.includes('–'))) {
      return trimmed.replace('-', '–');
    }
  }

  // Handle ranges like "12:00 - 16:00" or "20:00 – 00:00" or "18:00 to 22:30"
  const normalized = trimmed.replace('–', '-').replace('—', '-').replace(/\s+to\s+/i, ' - ');
  if (normalized.includes('-')) {
    const parts = normalized.split('-');
    if (parts.length >= 2) {
      const start = parts[0].trim();
      const end = parts[1].trim();
      return `${formatTo12Hour(start)} – ${formatTo12Hour(end)}`;
    }
  }

  const parts = trimmed.split(':');
  if (parts.length >= 2) {
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1].slice(0, 2);
    if (isNaN(hours)) return trimmed;

    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 hour is 12 AM
    const formattedHours = hours < 10 ? `0${hours}` : `${hours}`;
    return `${formattedHours}:${minutes} ${ampm}`;
  }

  // Handle slot words like "morning" or "evening"
  const lower = trimmed.toLowerCase();
  if (lower.includes('morning') || lower.includes('lunch')) {
    return '12:00 PM – 04:00 PM';
  }
  if (lower.includes('evening') || lower.includes('dinner') || lower.includes('night')) {
    return '07:00 PM – 11:30 PM';
  }

  return trimmed;
}

/**
 * Calculates time minutes from midnight for "hh:mm AM/PM" or "HH:MM"
 */
export function timeToMinutes(tStr: string): number | null {
  if (!tStr) return null;
  const upper = tStr.trim().toUpperCase();

  if (upper.includes('AM') || upper.includes('PM')) {
    const isPM = upper.includes('PM');
    const clean = upper.replace('AM', '').replace('PM', '').trim();
    const [hStr, mStr] = clean.split(':');
    let h = parseInt(hStr, 10);
    const m = parseInt(mStr || '0', 10);
    if (isNaN(h)) return null;
    if (isPM && h < 12) h += 12;
    if (!isPM && h === 12) h = 0;
    return h * 60 + (isNaN(m) ? 0 : m);
  }

  const [hStr, mStr] = upper.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr || '0', 10);
  if (isNaN(h)) return null;
  return h * 60 + (isNaN(m) ? 0 : m);
}

/**
 * Formats minutes from midnight back to 12-hour format string ("03:00 PM")
 */
export function minutesTo12Hour(mins: number): string {
  mins = Math.max(0, Math.min(24 * 60 - 1, mins));
  let hours = Math.floor(mins / 60);
  const minutes = mins % 60;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const formattedHours = hours < 10 ? `0${hours}` : `${hours}`;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${formattedHours}:${formattedMinutes} ${ampm}`;
}

/**
 * Given a booking start and end minutes, returns the 1-hour pre and post cleaning buffers
 */
export function getCleaningWindows(startMin: number, endMin: number): {
  eventWindow: { start: string; end: string };
  preCleaning: { start: string; end: string };
  postCleaning: { start: string; end: string };
  blockedWindow: { start: string; end: string };
} {
  const preStart = Math.max(0, startMin - 60);
  const postEnd = Math.min(24 * 60 - 1, endMin + 60);

  return {
    eventWindow: { start: minutesTo12Hour(startMin), end: minutesTo12Hour(endMin) },
    preCleaning: { start: minutesTo12Hour(preStart), end: minutesTo12Hour(startMin) },
    postCleaning: { start: minutesTo12Hour(endMin), end: minutesTo12Hour(postEnd) },
    blockedWindow: { start: minutesTo12Hour(preStart), end: minutesTo12Hour(postEnd) },
  };
}

