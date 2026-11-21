// End of Black Friday, 27 November 2026, in Brasília (UTC−03:00).
export const BLACK_FRIDAY_END = "2026-11-28T00:00:00-03:00";
export const BLACK_FRIDAY_END_MS = Date.parse(BLACK_FRIDAY_END);

export function blackFridayTimeLeft(now: number) {
  const seconds = Math.max(0, Math.ceil((BLACK_FRIDAY_END_MS - now) / 1000));
  return {
    expired: seconds === 0,
    days: Math.floor(seconds / 86400),
    hours: Math.floor((seconds % 86400) / 3600),
    minutes: Math.floor((seconds % 3600) / 60),
    seconds: seconds % 60,
  };
}
