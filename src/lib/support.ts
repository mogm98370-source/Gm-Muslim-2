import { SupportMessage } from '../types/store';

/**
 * Safely parses any Firestore timestamp representation into epoch milliseconds.
 * Guaranteed to be deterministic: returns the exact same timestamp value for identical inputs,
 * ensuring sorting consistency across page refreshes, app restarts, and component re-renders.
 */
export const parseMessageTimestamp = (val: any): number => {
  if (!val) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (typeof val.toMillis === 'function') {
    try {
      const ms = val.toMillis();
      if (typeof ms === 'number' && !isNaN(ms)) return ms;
    } catch { /* ignore */ }
  }
  if (typeof val.toDate === 'function') {
    try {
      const ms = val.toDate().getTime();
      if (typeof ms === 'number' && !isNaN(ms)) return ms;
    } catch { /* ignore */ }
  }
  if (typeof val.seconds === 'number') {
    return val.seconds * 1000 + Math.floor((val.nanoseconds || 0) / 1000000);
  }
  if (val instanceof Date) {
    const ms = val.getTime();
    return isNaN(ms) ? 0 : ms;
  }
  if (typeof val === 'string') {
    const parsed = Date.parse(val);
    if (!isNaN(parsed)) return parsed;
    const num = Number(val);
    if (!isNaN(num) && num > 0) return num;
  }
  return 0;
};

/**
 * Extracts milliseconds timestamp from any message object regardless of field naming convention
 * (createdAt, timestamp, created_at, date).
 */
export const getMessageTimestamp = (msg: any): number => {
  if (!msg) return 0;
  return (
    parseMessageTimestamp(msg.createdAt) ||
    parseMessageTimestamp(msg.timestamp) ||
    parseMessageTimestamp(msg.created_at) ||
    parseMessageTimestamp(msg.date) ||
    0
  );
};

/**
 * Sorts an array of support messages strictly chronologically:
 * - Oldest message at index 0 (Top ⬆️)
 * - Chronological sequence in middle (⬇️)
 * - Newest message at index length - 1 (Bottom ⬇️)
 * Both user messages and admin messages are sorted by the exact same timestamp logic.
 * Guaranteed deterministic: produces the exact same ordering after page refresh or reopening the app.
 */
export const sortMessagesChronologically = (msgs: SupportMessage[]): SupportMessage[] => {
  if (!Array.isArray(msgs)) return [];
  return [...msgs].sort((a, b) => {
    const timeA = getMessageTimestamp(a);
    const timeB = getMessageTimestamp(b);
    if (timeA !== timeB) {
      return timeA - timeB; // Ascending order: oldest at index 0, newest at index length-1
    }
    // Tiebreaker by document ID for stable deterministic ordering across reloads
    return (a.id || '').localeCompare(b.id || '');
  });
};

/**
 * Formats a message timestamp into a clean Arabic localized 12-hour time string (e.g., "04:21 م").
 */
export const formatSupportTime = (createdAt: any): string => {
  try {
    const ts = parseMessageTimestamp(createdAt);
    if (!ts || ts === 0) return '';
    const date = new Date(ts);
    return date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch {
    return '';
  }
};
