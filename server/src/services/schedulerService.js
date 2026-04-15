import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import customParseFormat from "dayjs/plugin/customParseFormat.js";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore.js";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
dayjs.extend(isSameOrBefore);

const SLOT_FORMAT = "YYYY-MM-DD HH:mm:ss";

const buildTime = (date, time, zone) => dayjs.tz(`${date} ${time}`, SLOT_FORMAT, zone);

export const createSlotsForDate = ({
  date,
  timezone: zone,
  durationMinutes,
  availabilityRules,
  bookedSlots,
  includePast = false
}) => {
  const weekday = dayjs.tz(`${date} 00:00:00`, SLOT_FORMAT, zone).day();
  const rule = availabilityRules.find(
    (entry) => entry.day_of_week === weekday && entry.is_enabled,
  );

  if (!rule) {
    return [];
  }

  const now = dayjs().tz(zone);
  const booked = new Set(bookedSlots);
  const slots = [];
  let current = buildTime(date, rule.start_time, zone);
  const endBoundary = buildTime(date, rule.end_time, zone);

  while (current.add(durationMinutes, "minute").isSameOrBefore(endBoundary)) {
    const next = current.add(durationMinutes, "minute");
    const isoValue = current.utc().format("YYYY-MM-DD HH:mm:ss");

    if ((includePast || current.isAfter(now)) && !booked.has(isoValue)) {
      slots.push({
        label: current.format("h:mm A"),
        startAt: current.toISOString(),
        endAt: next.toISOString(),
        utcStartAt: isoValue
      });
    }

    current = next;
  }

  return slots;
};

export const buildMonthAvailability = ({
  month,
  timezone: zone,
  durationMinutes,
  availabilityRules,
  bookedSlots
}) => {
  const startOfMonth = dayjs.tz(`${month}-01 00:00:00`, SLOT_FORMAT, zone).startOf("month");
  const endOfMonth = startOfMonth.endOf("month");
  const days = [];

  for (let cursor = startOfMonth; cursor.isSameOrBefore(endOfMonth, "day"); cursor = cursor.add(1, "day")) {
    const date = cursor.format("YYYY-MM-DD");
    const slots = createSlotsForDate({
      date,
      timezone: zone,
      durationMinutes,
      availabilityRules,
      bookedSlots
    });

    days.push({
      date,
      availableCount: slots.length,
      firstSlots: slots.slice(0, 3)
    });
  }

  return days;
};
