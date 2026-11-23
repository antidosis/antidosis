export const COMMUNITY_ACTIVITY_DAYS = 30;
export const NOTIFICATION_INBOX_DAYS = 30;

export function daysAgo(days: number, from = new Date()): Date {
  return new Date(from.getTime() - days * 24 * 60 * 60 * 1000);
}
