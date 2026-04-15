import { query } from "../config/db.js";
import { createHttpError, isValidColorHex, isValidSlug } from "../utils/http.js";

const adminUserId = 1;

const normalizeEventPayload = (body) => {
  const payload = {
    name: body.name?.trim(),
    slug: body.slug?.trim().toLowerCase(),
    durationMinutes: Number(body.durationMinutes),
    description: body.description?.trim() || null,
    location: body.location?.trim() || "Google Meet",
    colorHex: body.colorHex || "#006bff",
    isActive: Boolean(body.isActive)
  };

  if (!payload.name) {
    throw createHttpError(400, "Event name is required.");
  }

  if (!payload.slug || !isValidSlug(payload.slug)) {
    throw createHttpError(400, "Slug must use lowercase letters, numbers, and hyphens only.");
  }

  if (!Number.isInteger(payload.durationMinutes) || payload.durationMinutes < 15) {
    throw createHttpError(400, "Duration must be at least 15 minutes.");
  }

  if (!payload.location) {
    throw createHttpError(400, "Location is required.");
  }

  if (!isValidColorHex(payload.colorHex)) {
    throw createHttpError(400, "Color must be a valid hex value.");
  }

  return payload;
};

export const listEventTypes = async (_req, res, next) => {
  try {
    const rows = await query(
      `SELECT
          id,
          name,
          slug,
          duration_minutes AS durationMinutes,
          description,
          location,
          color_hex AS colorHex,
          is_active AS isActive,
          created_at AS createdAt
       FROM event_types
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [adminUserId],
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

export const createEventType = async (req, res, next) => {
  try {
    const { name, slug, durationMinutes, description, location, colorHex, isActive } = normalizeEventPayload(req.body);
    const result = await query(
      `INSERT INTO event_types (user_id, name, slug, duration_minutes, description, location, color_hex, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [adminUserId, name, slug, durationMinutes, description || null, location || "Google Meet", colorHex, isActive],
    );
    const [created] = await query(
      `SELECT
          id,
          name,
          slug,
          duration_minutes AS durationMinutes,
          description,
          location,
          color_hex AS colorHex,
          is_active AS isActive,
          created_at AS createdAt
       FROM event_types
       WHERE id = ?`,
      [result.insertId],
    );
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
};

export const updateEventType = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, slug, durationMinutes, description, location, colorHex, isActive } = normalizeEventPayload(req.body);
    const result = await query(
      `UPDATE event_types
       SET name = ?, slug = ?, duration_minutes = ?, description = ?, location = ?, color_hex = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [name, slug, durationMinutes, description || null, location || "Google Meet", colorHex, isActive, id, adminUserId],
    );

    if (result.affectedRows === 0) {
      throw createHttpError(404, "Event type not found.");
    }

    const [updated] = await query(
      `SELECT
          id,
          name,
          slug,
          duration_minutes AS durationMinutes,
          description,
          location,
          color_hex AS colorHex,
          is_active AS isActive,
          created_at AS createdAt
       FROM event_types
       WHERE id = ?`,
      [id],
    );
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const deleteEventType = async (req, res, next) => {
  try {
    const result = await query("DELETE FROM event_types WHERE id = ? AND user_id = ?", [req.params.id, adminUserId]);
    if (result.affectedRows === 0) {
      throw createHttpError(404, "Event type not found.");
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
