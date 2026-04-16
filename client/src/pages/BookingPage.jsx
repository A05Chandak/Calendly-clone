import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import http from "../api/http";

dayjs.extend(utc);
dayjs.extend(timezone);

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const viewerTimezoneDefault = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata";

const buildBookingFromState = (booking, meetingId, slug) => {
  if (!booking) {
    return null;
  }

  return {
    ...booking,
    meetingId: booking.meetingId || booking.id || Number(meetingId),
    slug: booking.slug || slug
  };
};

export default function BookingPage() {
  const { slug } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rescheduleId = searchParams.get("reschedule");
  const isRescheduling = Boolean(rescheduleId);
  const existingBookingFromState = useMemo(
    () => buildBookingFromState(state?.existingBooking, rescheduleId, slug),
    [rescheduleId, slug, state?.existingBooking],
  );
  const [eventType, setEventType] = useState(null);
  const [existingBooking, setExistingBooking] = useState(existingBookingFromState);
  const [month, setMonth] = useState(dayjs().format("YYYY-MM"));
  const [calendarDays, setCalendarDays] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [viewerTimezone, setViewerTimezone] = useState(viewerTimezoneDefault);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [loadingExistingBooking, setLoadingExistingBooking] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [form, setForm] = useState({
    inviteeName: "",
    inviteeEmail: "",
    inviteeNotes: ""
  });

  useEffect(() => {
    const loadEvent = async () => {
      setLoadingEvent(true);
      setErrorMessage("");

      try {
        const { data } = await http.get(`/public/event-types/${slug}`);
        setEventType(data);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "We could not load this booking page.");
      } finally {
        setLoadingEvent(false);
      }
    };

    loadEvent();
  }, [slug]);

  useEffect(() => {
    if (!isRescheduling) {
      setExistingBooking(null);
      return;
    }

    const hydrateBooking = (booking) => {
      const normalizedBooking = buildBookingFromState(booking, rescheduleId, slug);
      const bookingDate = dayjs(normalizedBooking.startAt);

      setExistingBooking(normalizedBooking);
      setForm({
        inviteeName: normalizedBooking.inviteeName || "",
        inviteeEmail: normalizedBooking.inviteeEmail || "",
        inviteeNotes: normalizedBooking.inviteeNotes || ""
      });
      setMonth(bookingDate.format("YYYY-MM"));
      setSelectedDate(bookingDate.format("YYYY-MM-DD"));
      setSelectedSlot(dayjs(normalizedBooking.startAt).toISOString());
    };

    if (existingBookingFromState) {
      hydrateBooking(existingBookingFromState);
    }

    const loadBooking = async () => {
      setLoadingExistingBooking(!existingBookingFromState);
      setErrorMessage("");

      try {
        const { data } = await http.get(`/public/bookings/${rescheduleId}`);
        hydrateBooking(data);
      } catch (error) {
        if (!existingBookingFromState) {
          setErrorMessage(error.response?.data?.message || "We could not load this booking for rescheduling.");
        }
      } finally {
        setLoadingExistingBooking(false);
      }
    };

    loadBooking();
  }, [existingBookingFromState, isRescheduling, rescheduleId, slug]);

  useEffect(() => {
    if (!eventType) {
      return;
    }

    const loadMonth = async () => {
      const query = new URLSearchParams({ month });

      if (rescheduleId) {
        query.set("excludeMeetingId", rescheduleId);
      }

      const { data } = await http.get(`/public/event-types/${slug}/calendar?${query.toString()}`);
      setCalendarDays(data);
      const firstAvailable = data.find((day) => day.availableCount > 0);

      setSelectedDate((current) => {
        if (current && data.some((day) => day.date === current && day.availableCount > 0)) {
          return current;
        }

        if (isRescheduling && existingBooking?.startAt) {
          const currentBookingDate = dayjs(existingBooking.startAt).format("YYYY-MM-DD");
          if (data.some((day) => day.date === currentBookingDate && day.availableCount > 0)) {
            return currentBookingDate;
          }
        }

        return firstAvailable?.date || "";
      });
    };

    loadMonth();
  }, [eventType, existingBooking, isRescheduling, month, rescheduleId, slug]);

  useEffect(() => {
    if (!selectedDate) {
      setSlots([]);
      setSelectedSlot("");
      return;
    }

    const loadSlots = async () => {
      setLoadingSlots(true);

      try {
        const query = new URLSearchParams({ date: selectedDate });

        if (rescheduleId) {
          query.set("excludeMeetingId", rescheduleId);
        }

        const { data } = await http.get(`/public/event-types/${slug}/slots?${query.toString()}`);
        setSlots(data);
        setSelectedSlot((current) => {
          if (current && data.some((slot) => slot.startAt === current)) {
            return current;
          }

          if (isRescheduling && existingBooking?.startAt) {
            const originalSlot = dayjs(existingBooking.startAt).toISOString();
            if (data.some((slot) => slot.startAt === originalSlot)) {
              return originalSlot;
            }
          }

          return data[0]?.startAt || "";
        });
      } finally {
        setLoadingSlots(false);
      }
    };

    loadSlots();
  }, [existingBooking, isRescheduling, rescheduleId, selectedDate, slug]);

  const monthLabel = useMemo(() => dayjs(`${month}-01`).format("MMMM YYYY"), [month]);
  const calendarGrid = useMemo(() => {
    const offset = dayjs(`${month}-01`).day();
    const leading = Array.from({ length: offset }, (_, index) => ({ key: `empty-${index}`, empty: true }));

    return [
      ...leading,
      ...calendarDays.map((day) => ({
        ...day,
        key: day.date,
        empty: false
      }))
    ];
  }, [calendarDays, month]);

  const selectedSlotDetails = useMemo(
    () => slots.find((slot) => slot.startAt === selectedSlot),
    [selectedSlot, slots],
  );

  const handleBooking = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");

    const payload = {
      slug,
      date: selectedDate,
      startAt: selectedSlot,
      inviteeName: form.inviteeName,
      inviteeEmail: form.inviteeEmail,
      inviteeNotes: form.inviteeNotes
    };

    try {
      let data;

      if (isRescheduling) {
        try {
          const response = await http.post(`/public/bookings/${rescheduleId}/reschedule`, payload);
          data = response.data;
        } catch (error) {
          if (error.response?.status === 404) {
            const createResponse = await http.post("/public/bookings", payload);
            data = {
              ...createResponse.data,
              status: "rescheduled"
            };

            try {
              await http.post(`/public/bookings/${rescheduleId}/cancel`);
            } catch (cancelError) {
              if (cancelError.response?.status === 404) {
                await http.post(`/meetings/${rescheduleId}/cancel`);
              } else {
                throw cancelError;
              }
            }
          } else {
            throw error;
          }
        }
      } else {
        const response = await http.post("/public/bookings", payload);
        data = response.data;
      }

      navigate("/confirmation", { state: { ...data, viewerTimezone } });
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "We could not complete the booking.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingEvent || loadingExistingBooking) {
    return (
      <div className="booking-shell">
        <section className="booking-card booking-card-loading">
          <p>{isRescheduling ? "Loading meeting details..." : "Loading booking page..."}</p>
        </section>
      </div>
    );
  }

  if (errorMessage && !eventType) {
    return (
      <div className="booking-shell">
        <section className="booking-card booking-card-loading">
          <p>{errorMessage}</p>
        </section>
      </div>
    );
  }

  return (
    <div className="booking-shell">
      <section className="booking-card">
        <div className="booking-summary">
          <p className="eyebrow">{isRescheduling ? "Reschedule meeting" : "Calendly"}</p>
          <div className="booking-host">
            <span className="booking-event-dot" style={{ backgroundColor: eventType?.colorHex || "#006bff" }} />
            <span>{eventType?.hostName}</span>
          </div>
          <h1>{eventType?.name}</h1>
          <ul className="booking-meta">
            <li>{eventType?.durationMinutes} min</li>
            <li>{eventType?.location}</li>
            <li>Host timezone: {eventType?.timezone}</li>
          </ul>
          <p>{isRescheduling ? "Pick a new time and update any invitee details if needed." : eventType?.description}</p>
          <div className="booking-steps">
            <span className={selectedDate ? "active" : ""}>1. Select a date</span>
            <span className={selectedSlot ? "active" : ""}>2. Pick a time</span>
            <span className={form.inviteeName && form.inviteeEmail ? "active" : ""}>3. Confirm details</span>
          </div>
        </div>

        <div className="booking-calendar">
          <div className="calendar-header">
            <button type="button" className="button button-icon" onClick={() => setMonth(dayjs(`${month}-01`).subtract(1, "month").format("YYYY-MM"))}>
              {"<"}
            </button>
            <h2>{monthLabel}</h2>
            <button type="button" className="button button-icon" onClick={() => setMonth(dayjs(`${month}-01`).add(1, "month").format("YYYY-MM"))}>
              {">"}
            </button>
          </div>
          <div className="weekday-grid">
            {weekdays.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="date-grid">
            {calendarGrid.map((day) =>
              day.empty ? (
                <div key={day.key} className="date-cell placeholder" />
              ) : (
                <button
                  key={day.date}
                  type="button"
                  className={`date-cell ${selectedDate === day.date ? "selected" : ""}`}
                  disabled={day.availableCount === 0}
                  onClick={() => setSelectedDate(day.date)}
                >
                  <span>{dayjs(day.date).date()}</span>
                </button>
              ),
            )}
          </div>
        </div>

        <div className="booking-sidebar">
          <div className="slot-panel">
            <div className="slot-panel-heading">
              <h2>{selectedDate ? dayjs(selectedDate).format("dddd, MMM D") : "Available times"}</h2>
              <label>
                Timezone
                <select value={viewerTimezone} onChange={(event) => setViewerTimezone(event.target.value)}>
                  {Intl.supportedValuesOf("timeZone").map((zone) => (
                    <option key={zone} value={zone}>{zone}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="slot-list">
              {loadingSlots ? <p>Loading slots...</p> : null}
              {!loadingSlots && slots.length === 0 ? <p>No times are available on this day.</p> : null}
              {slots.map((slot) => (
                <button
                  key={slot.startAt}
                  type="button"
                  className={`slot-chip ${selectedSlot === slot.startAt ? "selected" : ""}`}
                  onClick={() => setSelectedSlot(slot.startAt)}
                >
                  {dayjs(slot.startAt).tz(viewerTimezone).format("h:mm A")}
                </button>
              ))}
            </div>
          </div>

          <form className="booking-form" onSubmit={handleBooking}>
            <h2>{isRescheduling ? "Update booking details" : "Enter details"}</h2>
            {selectedSlotDetails ? (
              <p className="booking-selected-time">
                {dayjs(selectedSlotDetails.startAt).tz(viewerTimezone).format("dddd, MMMM D · h:mm A")} ({viewerTimezone})
              </p>
            ) : null}
            <label>
              Name
              <input
                value={form.inviteeName}
                onChange={(event) => setForm((current) => ({ ...current, inviteeName: event.target.value }))}
                required
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={form.inviteeEmail}
                onChange={(event) => setForm((current) => ({ ...current, inviteeEmail: event.target.value }))}
                required
              />
            </label>
            <label>
              Share anything to prepare
              <textarea
                rows="4"
                value={form.inviteeNotes}
                onChange={(event) => setForm((current) => ({ ...current, inviteeNotes: event.target.value }))}
                placeholder="Agenda, goals, links, or context"
              />
            </label>
            {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
            <button className="button" type="submit" disabled={!selectedSlot || submitting}>
              {submitting ? (isRescheduling ? "Rescheduling..." : "Confirming...") : isRescheduling ? "Reschedule meeting" : "Confirm"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
