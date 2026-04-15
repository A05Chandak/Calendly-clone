import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import http from "../api/http";

dayjs.extend(utc);
dayjs.extend(timezone);

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const viewerTimezoneDefault = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata";

export default function BookingPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [eventType, setEventType] = useState(null);
  const [month, setMonth] = useState(dayjs().format("YYYY-MM"));
  const [calendarDays, setCalendarDays] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [viewerTimezone, setViewerTimezone] = useState(viewerTimezoneDefault);
  const [loadingEvent, setLoadingEvent] = useState(true);
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
    if (!eventType) {
      return;
    }

    const loadMonth = async () => {
      const { data } = await http.get(`/public/event-types/${slug}/calendar?month=${month}`);
      setCalendarDays(data);
      const firstAvailable = data.find((day) => day.availableCount > 0);

      setSelectedDate((current) => {
        if (current && data.some((day) => day.date === current && day.availableCount > 0)) {
          return current;
        }

        return firstAvailable?.date || "";
      });
    };

    loadMonth();
  }, [eventType, month, slug]);

  useEffect(() => {
    if (!selectedDate) {
      setSlots([]);
      setSelectedSlot("");
      return;
    }

    const loadSlots = async () => {
      setLoadingSlots(true);
      try {
        const { data } = await http.get(`/public/event-types/${slug}/slots?date=${selectedDate}`);
        setSlots(data);
        setSelectedSlot((current) => (current && data.some((slot) => slot.startAt === current) ? current : data[0]?.startAt || ""));
      } finally {
        setLoadingSlots(false);
      }
    };

    loadSlots();
  }, [selectedDate, slug]);

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

    try {
      const { data } = await http.post("/public/bookings", {
        slug,
        date: selectedDate,
        startAt: selectedSlot,
        inviteeName: form.inviteeName,
        inviteeEmail: form.inviteeEmail,
        inviteeNotes: form.inviteeNotes
      });

      navigate("/confirmation", { state: { ...data, viewerTimezone } });
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "We could not complete the booking.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingEvent) {
    return (
      <div className="booking-shell">
        <section className="booking-card booking-card-loading">
          <p>Loading booking page...</p>
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
          <p className="eyebrow">Calendly</p>
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
          <p>{eventType?.description}</p>
          <div className="booking-steps">
            <span className={selectedDate ? "active" : ""}>1. Select a date</span>
            <span className={selectedSlot ? "active" : ""}>2. Pick a time</span>
            <span className={form.inviteeName && form.inviteeEmail ? "active" : ""}>3. Confirm details</span>
          </div>
        </div>

        <div className="booking-calendar">
          <div className="calendar-header">
            <button className="button button-icon" onClick={() => setMonth(dayjs(`${month}-01`).subtract(1, "month").format("YYYY-MM"))}>
              {"<"}
            </button>
            <h2>{monthLabel}</h2>
            <button className="button button-icon" onClick={() => setMonth(dayjs(`${month}-01`).add(1, "month").format("YYYY-MM"))}>
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
                  className={`slot-chip ${selectedSlot === slot.startAt ? "selected" : ""}`}
                  onClick={() => setSelectedSlot(slot.startAt)}
                >
                  {dayjs(slot.startAt).tz(viewerTimezone).format("h:mm A")}
                </button>
              ))}
            </div>
          </div>

          <form className="booking-form" onSubmit={handleBooking}>
            <h2>Enter details</h2>
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
              {submitting ? "Confirming..." : "Confirm"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
