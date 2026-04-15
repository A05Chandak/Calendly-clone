import { query } from "../config/db.js";
import { createHttpError } from "../utils/http.js";

const adminUserId = 1;

export const listMeetings = async (req, res, next) => {
  try {
    const status = req.query.status === "past" ? "past" : "upcoming";
    const comparator = status === "past" ? "<" : ">=";
    const statusFilter = status === "past" ? "meetings.status <> 'cancelled'" : "meetings.status = 'scheduled'";
    const rows = await query(
      `SELECT
          meetings.id,
          meetings.invitee_name AS inviteeName,
          meetings.invitee_email AS inviteeEmail,
          meetings.invitee_notes AS inviteeNotes,
          meetings.start_at AS startAt,
          meetings.end_at AS endAt,
          meetings.status,
          meetings.created_at AS createdAt,
          event_types.name AS eventName,
          event_types.slug,
          event_types.location,
          event_types.color_hex AS colorHex
       FROM meetings
       INNER JOIN event_types ON event_types.id = meetings.event_type_id
       WHERE meetings.host_user_id = ?
         AND meetings.start_at ${comparator} UTC_TIMESTAMP()
         AND ${statusFilter}
       ORDER BY meetings.start_at ${status === "past" ? "DESC" : "ASC"}`,
      [adminUserId],
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

export const cancelMeeting = async (req, res, next) => {
  try {
    const result = await query(
      `UPDATE meetings
       SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP
       WHERE id = ? AND host_user_id = ? AND status = 'scheduled'`,
      [req.params.id, adminUserId],
    );

    if (result.affectedRows === 0) {
      throw createHttpError(404, "Meeting not found or already cancelled.");
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const listCancelledMeetings = async (_req, res, next) => {
  try {
    const rows = await query(
      `SELECT
          meetings.id,
          meetings.invitee_name AS inviteeName,
          meetings.invitee_email AS inviteeEmail,
          meetings.invitee_notes AS inviteeNotes,
          meetings.start_at AS startAt,
          meetings.end_at AS endAt,
          meetings.cancelled_at AS cancelledAt,
          event_types.name AS eventName,
          event_types.slug,
          event_types.location,
          event_types.color_hex AS colorHex
       FROM meetings
       INNER JOIN event_types ON event_types.id = meetings.event_type_id
       WHERE meetings.host_user_id = ?
         AND meetings.status = 'cancelled'
       ORDER BY meetings.cancelled_at DESC, meetings.start_at DESC`,
      [adminUserId],
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
};
