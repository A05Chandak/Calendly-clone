import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import { getConnection, query } from "../config/db.js";
import { buildMonthAvailability, createSlotsForDate } from "../services/schedulerService.js";
import { createHttpError } from "../utils/http.js";

dayjs.extend(utc);
dayjs.extend(timezone);

const getEventTypeWithAvailability = async (slug) => {
  const [eventType] = await query(
    `SELECT
        event_types.id,
        event_types.name,
        event_types.slug,
        event_types.duration_minutes AS durationMinutes,
        event_types.description,
        event_types.location,
        event_types.color_hex AS colorHex,
        event_types.is_active AS isActive,
        users.name AS hostName,
        availability_settings.timezone
     FROM event_types
     INNER JOIN users ON users.id = event_types.user_id
     INNER JOIN availability_settings ON availability_settings.user_id = event_types.user_id
     WHERE event_types.slug = ?`,
    [slug],
  );

  if (!eventType) {
    return null;
  }

  if (!eventType.isActive) {
    return null;
  }

  const availabilityRules = await query(
    `SELECT day_of_week, is_enabled, start_time, end_time
     FROM availability_rules
     WHERE user_id = (
       SELECT user_id FROM event_types WHERE slug = ?
     )
     ORDER BY day_of_week`,
    [slug],
  );

  return { eventType, availabilityRules };
};

const getBookedSlotsForMonth = async (eventTypeId, month) => {
  const start = `${month}-01`;
  const end = dayjs(start).endOf("month").format("YYYY-MM-DD");
  const rows = await query(
    `SELECT DATE_FORMAT(start_at, '%Y-%m-%d %H:%i:%s') AS startAt
     FROM meetings
     WHERE event_type_id = ?
       AND status <> 'cancelled'
       AND DATE(start_at) BETWEEN ? AND ?`,
    [eventTypeId, start, end],
  );
  return rows.map((row) => row.startAt);
};

export const getPublicEventType = async (req, res, next) => {
  try {
    const data = await getEventTypeWithAvailability(req.params.slug);
    if (!data) {
      return res.status(404).json({ message: "Event type not found" });
    }
    res.json(data.eventType);
  } catch (error) {
    next(error);
  }
};

export const getMonthSlots = async (req, res, next) => {
  try {
    const month = req.query.month || dayjs().format("YYYY-MM");
    if (!/^\d{4}-\d{2}$/.test(month)) {
      throw createHttpError(400, "Month must use YYYY-MM format.");
    }

    const data = await getEventTypeWithAvailability(req.params.slug);
    if (!data) {
      return res.status(404).json({ message: "Event type not found" });
    }

    const bookedSlots = await getBookedSlotsForMonth(data.eventType.id, month);
    const days = buildMonthAvailability({
      month,
      timezone: data.eventType.timezone,
      durationMinutes: data.eventType.durationMinutes,
      availabilityRules: data.availabilityRules,
      bookedSlots
    });

    res.json(days);
  } catch (error) {
    next(error);
  }
};

export const getDateSlots = async (req, res, next) => {
  try {
    const date = req.query.date;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw createHttpError(400, "Date must use YYYY-MM-DD format.");
    }

    const data = await getEventTypeWithAvailability(req.params.slug);
    if (!data) {
      return res.status(404).json({ message: "Event type not found" });
    }

    const rows = await query(
      `SELECT DATE_FORMAT(start_at, '%Y-%m-%d %H:%i:%s') AS startAt
       FROM meetings
       WHERE event_type_id = ?
         AND status <> 'cancelled'
         AND DATE(start_at) = ?`,
      [data.eventType.id, date],
    );

    const slots = createSlotsForDate({
      date,
      timezone: data.eventType.timezone,
      durationMinutes: data.eventType.durationMinutes,
      availabilityRules: data.availabilityRules,
      bookedSlots: rows.map((row) => row.startAt)
    });

    res.json(slots);
  } catch (error) {
    next(error);
  }
};

export const createBooking = async (req, res, next) => {
  const connection = await getConnection();
  let transactionStarted = false;

  try {
    const { slug, date, startAt, inviteeName, inviteeEmail, inviteeNotes } = req.body;
    if (!slug || !date || !startAt || !inviteeName?.trim() || !inviteeEmail?.trim()) {
      connection.release();
      return next(createHttpError(400, "Name, email, date, event, and time are required."));
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      connection.release();
      return next(createHttpError(400, "Date must use YYYY-MM-DD format."));
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteeEmail.trim())) {
      connection.release();
      return next(createHttpError(400, "Please enter a valid email address."));
    }

    const data = await getEventTypeWithAvailability(slug);

    if (!data) {
      connection.release();
      return res.status(404).json({ message: "Event type not found" });
    }

    const slotDate = dayjs(startAt).tz(data.eventType.timezone);
    const validSlots = createSlotsForDate({
      date,
      timezone: data.eventType.timezone,
      durationMinutes: data.eventType.durationMinutes,
      availabilityRules: data.availabilityRules,
      bookedSlots: [],
      includePast: false
    });
    const selectedSlot = validSlots.find((slot) => slot.startAt === startAt);

    if (!selectedSlot) {
      connection.release();
      return res.status(400).json({ message: "The selected slot is no longer available" });
    }

    const utcStartAt = dayjs(startAt).utc().format("YYYY-MM-DD HH:mm:ss");
    const [existingMeetings] = await connection.execute(
      `SELECT id
       FROM meetings
       WHERE event_type_id = ?
         AND start_at = ?
         AND status <> 'cancelled'
       LIMIT 1`,
      [data.eventType.id, utcStartAt],
    );

    if (existingMeetings.length > 0) {
      connection.release();
      return res.status(409).json({ message: "That time slot has already been booked." });
    }

    await connection.beginTransaction();
    transactionStarted = true;
    await connection.execute(
      `INSERT INTO meetings (
        event_type_id,
        host_user_id,
        invitee_name,
        invitee_email,
        invitee_notes,
        start_at,
        end_at,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled')`,
      [
        data.eventType.id,
        1,
        inviteeName,
        inviteeEmail,
        inviteeNotes || null,
        utcStartAt,
        slotDate.add(data.eventType.durationMinutes, "minute").utc().format("YYYY-MM-DD HH:mm:ss")
      ],
    );
    await connection.commit();
    connection.release();

    res.status(201).json({
      eventName: data.eventType.name,
      hostName: data.eventType.hostName,
      location: data.eventType.location,
      timezone: data.eventType.timezone,
      inviteeName,
      inviteeEmail,
      inviteeNotes: inviteeNotes || "",
      startAt
    });
  } catch (error) {
    if (transactionStarted) {
      await connection.rollback();
    }
    connection.release();
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "That time slot has already been booked." });
    }
    next(error);
  }
};
