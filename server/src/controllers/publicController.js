import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import { getConnection, query } from "../config/db.js";
import { buildMonthAvailability, createSlotsForDate } from "../services/schedulerService.js";
import { createHttpError } from "../utils/http.js";

dayjs.extend(utc);
dayjs.extend(timezone);

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

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

  if (!eventType || !eventType.isActive) {
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

const getMeetingDetails = async (meetingId) => {
  const [meeting] = await query(
    `SELECT
        meetings.id,
        meetings.event_type_id AS eventTypeId,
        meetings.host_user_id AS hostUserId,
        meetings.invitee_name AS inviteeName,
        meetings.invitee_email AS inviteeEmail,
        meetings.invitee_notes AS inviteeNotes,
        meetings.start_at AS startAt,
        meetings.end_at AS endAt,
        meetings.status,
        event_types.name AS eventName,
        event_types.slug,
        event_types.duration_minutes AS durationMinutes,
        event_types.location,
        event_types.color_hex AS colorHex,
        users.name AS hostName,
        availability_settings.timezone
     FROM meetings
     INNER JOIN event_types ON event_types.id = meetings.event_type_id
     INNER JOIN users ON users.id = meetings.host_user_id
     INNER JOIN availability_settings ON availability_settings.user_id = meetings.host_user_id
     WHERE meetings.id = ?
     LIMIT 1`,
    [meetingId],
  );

  return meeting || null;
};

const getBookedSlotsForMonth = async (eventTypeId, month, excludeMeetingId = null) => {
  const start = `${month}-01`;
  const end = dayjs(start).endOf("month").format("YYYY-MM-DD");
  const rows = await query(
    `SELECT DATE_FORMAT(start_at, '%Y-%m-%d %H:%i:%s') AS startAt
     FROM meetings
     WHERE event_type_id = ?
       AND status <> 'cancelled'
       AND (? IS NULL OR id <> ?)
       AND DATE(start_at) BETWEEN ? AND ?`,
    [eventTypeId, excludeMeetingId, excludeMeetingId, start, end],
  );
  return rows.map((row) => row.startAt);
};

const getBookedSlotsForDate = async (eventTypeId, date, excludeMeetingId = null) => {
  const rows = await query(
    `SELECT DATE_FORMAT(start_at, '%Y-%m-%d %H:%i:%s') AS startAt
     FROM meetings
     WHERE event_type_id = ?
       AND status <> 'cancelled'
       AND (? IS NULL OR id <> ?)
       AND DATE(start_at) = ?`,
    [eventTypeId, excludeMeetingId, excludeMeetingId, date],
  );

  return rows.map((row) => row.startAt);
};

const buildBookingResponse = (meeting, overrides = {}) => ({
  meetingId: meeting.id,
  eventName: meeting.eventName,
  hostName: meeting.hostName,
  location: meeting.location,
  timezone: meeting.timezone,
  inviteeName: meeting.inviteeName,
  inviteeEmail: meeting.inviteeEmail,
  inviteeNotes: meeting.inviteeNotes || "",
  slug: meeting.slug,
  startAt: overrides.startAt || dayjs.utc(meeting.startAt).toISOString(),
  status: overrides.status || meeting.status || "scheduled"
});

const validateBookingInput = ({ slug, date, startAt, inviteeName, inviteeEmail }) => {
  if (!slug || !date || !startAt || !inviteeName?.trim() || !inviteeEmail?.trim()) {
    throw createHttpError(400, "Name, email, date, event, and time are required.");
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw createHttpError(400, "Date must use YYYY-MM-DD format.");
  }

  if (!isValidEmail(inviteeEmail)) {
    throw createHttpError(400, "Please enter a valid email address.");
  }
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
    const excludeMeetingId = req.query.excludeMeetingId ? Number(req.query.excludeMeetingId) : null;

    if (!/^\d{4}-\d{2}$/.test(month)) {
      throw createHttpError(400, "Month must use YYYY-MM format.");
    }

    const data = await getEventTypeWithAvailability(req.params.slug);
    if (!data) {
      return res.status(404).json({ message: "Event type not found" });
    }

    const bookedSlots = await getBookedSlotsForMonth(data.eventType.id, month, excludeMeetingId);
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
    const excludeMeetingId = req.query.excludeMeetingId ? Number(req.query.excludeMeetingId) : null;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw createHttpError(400, "Date must use YYYY-MM-DD format.");
    }

    const data = await getEventTypeWithAvailability(req.params.slug);
    if (!data) {
      return res.status(404).json({ message: "Event type not found" });
    }

    const bookedSlots = await getBookedSlotsForDate(data.eventType.id, date, excludeMeetingId);
    const slots = createSlotsForDate({
      date,
      timezone: data.eventType.timezone,
      durationMinutes: data.eventType.durationMinutes,
      availabilityRules: data.availabilityRules,
      bookedSlots
    });

    res.json(slots);
  } catch (error) {
    next(error);
  }
};

export const getPublicBooking = async (req, res, next) => {
  try {
    const meeting = await getMeetingDetails(req.params.id);

    if (!meeting || meeting.status === "cancelled") {
      throw createHttpError(404, "Booking not found.");
    }

    res.json(buildBookingResponse(meeting));
  } catch (error) {
    next(error);
  }
};

export const createBooking = async (req, res, next) => {
  const connection = await getConnection();
  let transactionStarted = false;

  try {
    const { slug, date, startAt, inviteeName, inviteeEmail, inviteeNotes } = req.body;
    validateBookingInput({ slug, date, startAt, inviteeName, inviteeEmail });

    const data = await getEventTypeWithAvailability(slug);

    if (!data) {
      throw createHttpError(404, "Event type not found");
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
      throw createHttpError(400, "The selected slot is no longer available");
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
      throw createHttpError(409, "That time slot has already been booked.");
    }

    await connection.beginTransaction();
    transactionStarted = true;

    const [result] = await connection.execute(
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
        inviteeName.trim(),
        inviteeEmail.trim(),
        inviteeNotes || null,
        utcStartAt,
        slotDate.add(data.eventType.durationMinutes, "minute").utc().format("YYYY-MM-DD HH:mm:ss")
      ],
    );

    await connection.commit();

    res.status(201).json({
      meetingId: result.insertId,
      eventName: data.eventType.name,
      hostName: data.eventType.hostName,
      location: data.eventType.location,
      timezone: data.eventType.timezone,
      inviteeName: inviteeName.trim(),
      inviteeEmail: inviteeEmail.trim(),
      inviteeNotes: inviteeNotes || "",
      slug,
      startAt,
      status: "scheduled"
    });
  } catch (error) {
    if (transactionStarted) {
      await connection.rollback();
    }
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "That time slot has already been booked." });
    }
    next(error);
  } finally {
    connection.release();
  }
};

export const cancelPublicBooking = async (req, res, next) => {
  try {
    const result = await query(
      `UPDATE meetings
       SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP
       WHERE id = ? AND status = 'scheduled'`,
      [req.params.id],
    );

    if (result.affectedRows === 0) {
      throw createHttpError(404, "Meeting not found or already cancelled.");
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const reschedulePublicBooking = async (req, res, next) => {
  const connection = await getConnection();
  let transactionStarted = false;

  try {
    const meeting = await getMeetingDetails(req.params.id);

    if (!meeting || meeting.status === "cancelled") {
      throw createHttpError(404, "Booking not found.");
    }

    const { date, startAt, inviteeName, inviteeEmail, inviteeNotes } = req.body;
    validateBookingInput({
      slug: meeting.slug,
      date,
      startAt,
      inviteeName: inviteeName || meeting.inviteeName,
      inviteeEmail: inviteeEmail || meeting.inviteeEmail
    });

    const data = await getEventTypeWithAvailability(meeting.slug);

    if (!data) {
      throw createHttpError(404, "Event type not found");
    }

    const bookedSlots = await getBookedSlotsForDate(meeting.eventTypeId, date, meeting.id);
    const validSlots = createSlotsForDate({
      date,
      timezone: data.eventType.timezone,
      durationMinutes: data.eventType.durationMinutes,
      availabilityRules: data.availabilityRules,
      bookedSlots,
      includePast: false
    });
    const selectedSlot = validSlots.find((slot) => slot.startAt === startAt);

    if (!selectedSlot) {
      throw createHttpError(400, "The selected slot is no longer available");
    }

    const utcStartAt = dayjs(startAt).utc().format("YYYY-MM-DD HH:mm:ss");
    const [existingMeetings] = await connection.execute(
      `SELECT id
       FROM meetings
       WHERE event_type_id = ?
         AND start_at = ?
         AND status <> 'cancelled'
         AND id <> ?
       LIMIT 1`,
      [meeting.eventTypeId, utcStartAt, meeting.id],
    );

    if (existingMeetings.length > 0) {
      throw createHttpError(409, "That time slot has already been booked.");
    }

    await connection.beginTransaction();
    transactionStarted = true;

    await connection.execute(
      `UPDATE meetings
       SET invitee_name = ?,
           invitee_email = ?,
           invitee_notes = ?,
           start_at = ?,
           end_at = ?,
           cancelled_at = NULL
       WHERE id = ?`,
      [
        (inviteeName || meeting.inviteeName).trim(),
        (inviteeEmail || meeting.inviteeEmail).trim(),
        inviteeNotes ?? meeting.inviteeNotes ?? null,
        utcStartAt,
        dayjs(startAt).tz(data.eventType.timezone).add(data.eventType.durationMinutes, "minute").utc().format("YYYY-MM-DD HH:mm:ss"),
        meeting.id
      ],
    );

    await connection.commit();

    res.json({
      ...buildBookingResponse(meeting, {
        startAt,
        status: "rescheduled"
      }),
      inviteeName: (inviteeName || meeting.inviteeName).trim(),
      inviteeEmail: (inviteeEmail || meeting.inviteeEmail).trim(),
      inviteeNotes: inviteeNotes ?? meeting.inviteeNotes ?? ""
    });
  } catch (error) {
    if (transactionStarted) {
      await connection.rollback();
    }
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "That time slot has already been booked." });
    }
    next(error);
  } finally {
    connection.release();
  }
};
