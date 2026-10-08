import { addDays, format, isBefore, isValid, parseISO, startOfDay } from "date-fns";

/** Consultations need preparation time, so the earliest slot is this many days out. */
export const LEAD_DAYS = 2;

/** Days the astrologer does not sit for consultations. 0 = Sunday. */
export const CLOSED_WEEKDAYS = [3, 6];
export const CLOSED_WEEKDAYS_LABEL = "Wednesdays and Saturdays";

/** First date a client may book, counted from `now`. */
export const earliestBookingDate = (now: Date = new Date()) =>
  addDays(startOfDay(now), LEAD_DAYS);

export const isClosedDay = (date: Date) => CLOSED_WEEKDAYS.includes(date.getDay());

export const isBookableDate = (date: Date, now: Date = new Date()) =>
  !isBefore(startOfDay(date), earliestBookingDate(now)) && !isClosedDay(date);

/** The "yyyy-MM-dd" the form stores and the webhook receives, in local time. */
export const toDateValue = (date: Date) => format(date, "yyyy-MM-dd");

export const fromDateValue = (value: string): Date | undefined => {
  if (!value) return undefined;
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : undefined;
};

export const BOOKING_DATE_HINT =
  `Earliest booking is ${LEAD_DAYS} days from today. ${CLOSED_WEEKDAYS_LABEL} are unavailable.`;
