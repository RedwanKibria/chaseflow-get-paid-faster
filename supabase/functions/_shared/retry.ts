// Decides whether a reminder that failed to send should be tried again on the next daily run.
// A job is retried until it is more than `maxAgeDays` past its scheduled time, then it is
// marked failed for good so a permanently bad address is not retried forever.

export const RETRY_MAX_AGE_DAYS = 3;

export function shouldRetryReminder(scheduledFor: string | Date, now: Date, maxAgeDays: number = RETRY_MAX_AGE_DAYS): boolean {
  const scheduled = scheduledFor instanceof Date ? scheduledFor : new Date(scheduledFor);
  if (Number.isNaN(scheduled.getTime())) return false;
  const ageMs = now.getTime() - scheduled.getTime();
  return ageMs < maxAgeDays * 24 * 60 * 60 * 1000;
}
