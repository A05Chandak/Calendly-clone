import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import EventTypeForm from "../components/EventTypeForm";
import http from "../api/http";

const dashboardTabs = ["Event types", "Single-use links", "Meeting polls"];
const getErrorMessage = (error, fallback) => error.response?.data?.message || fallback;

export default function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const formRef = useRef(null);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data } = await http.get("/event-types");
      setEvents(data);
    } catch (error) {
      setFeedback({ type: "error", message: getErrorMessage(error, "We could not load your event types.") });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (searchParams.has("new")) {
      setSelectedEvent(null);
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesSearch =
        event.name.toLowerCase().includes(search.toLowerCase()) ||
        event.location.toLowerCase().includes(search.toLowerCase()) ||
        event.slug.toLowerCase().includes(search.toLowerCase());

      const matchesFilter =
        filter === "all" ||
        (filter === "active" && event.isActive) ||
        (filter === "hidden" && !event.isActive);

      return matchesSearch && matchesFilter;
    });
  }, [events, filter, search]);

  const activeEvents = events.filter((event) => event.isActive).length;

  const handleSave = async (payload) => {
    setSaving(true);
    setFeedback({ type: "", message: "" });

    try {
      if (selectedEvent) {
        await http.put(`/event-types/${selectedEvent.id}`, payload);
        setFeedback({ type: "success", message: "Event type updated successfully." });
      } else {
        await http.post("/event-types", payload);
        setFeedback({ type: "success", message: "Event type created successfully." });
      }

      setSelectedEvent(null);
      await fetchEvents();
    } catch (error) {
      setFeedback({ type: "error", message: getErrorMessage(error, "We could not save this event type.") });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await http.delete(`/event-types/${id}`);
      if (selectedEvent?.id === id) {
        setSelectedEvent(null);
      }
      setFeedback({ type: "success", message: "Event type deleted successfully." });
      await fetchEvents();
    } catch (error) {
      setFeedback({ type: "error", message: getErrorMessage(error, "We could not delete this event type.") });
    }
  };

  const handleCopyLink = async (slug) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/book/${slug}`);
      setFeedback({ type: "success", message: "Booking link copied to clipboard." });
    } catch {
      setFeedback({ type: "error", message: "Clipboard access was blocked by the browser." });
    }
  };

  return (
    <div className="page-stack">
      <section className="scheduling-header">
        <p className="hero-copy">Manage event types, booking links, and the workspace flow from one place.</p>
      </section>

      <div className="tab-row">
        {dashboardTabs.map((tab, index) => (
          <button key={tab} type="button" className={`tab-button ${index === 0 ? "active" : ""}`}>
            {tab}
          </button>
        ))}
      </div>

      <section className="toolbar-card">
        <div className="toolbar-row">
          <button type="button" className="toolbar-pill">My Calendly</button>
          <div className="toolbar-search">
            <span>⌕</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search event types"
            />
          </div>
          <select className="toolbar-filter" value={filter} onChange={(event) => setFilter(event.target.value)}>
            <option value="all">Filter: All</option>
            <option value="active">Filter: Active</option>
            <option value="hidden">Filter: Hidden</option>
          </select>
        </div>
      </section>

      {feedback.message ? <p className={`feedback-banner ${feedback.type}`}>{feedback.message}</p> : null}

      <section className="dashboard-layout">
        <section className="scheduling-column">
          <div className="workspace-owner-row">
            <div className="owner-chip">
              <span className="mini-avatar owner-avatar">AC</span>
              <strong>Aditi Chandak</strong>
            </div>
            <a href="/" onClick={(event) => event.preventDefault()} className="landing-link">
              View landing page
            </a>
          </div>

          {loading ? <div className="empty-state"><p>Loading event types...</p></div> : null}

          {!loading && filteredEvents.length === 0 ? (
            <div className="empty-state">
              <h3>No matching event types</h3>
              <p>Try another search or create a new event type.</p>
            </div>
          ) : null}

          {!loading && filteredEvents.length > 0 ? (
            <div className="event-list">
              {filteredEvents.map((event) => (
                <article key={event.id} className="event-type-card">
                  <div className="event-type-stripe" style={{ backgroundColor: event.colorHex }} />
                  <div className="event-type-main">
                    <div className="event-type-summary">
                      <h3>{event.name}</h3>
                      <p>{event.durationMinutes} min • {event.location} • One-on-One</p>
                      <p>{event.isActive ? "Public booking is enabled" : "Hidden from booking page"}</p>
                    </div>
                    <div className="event-type-actions">
                      <button className="button button-secondary" onClick={() => handleCopyLink(event.slug)} disabled={!event.isActive}>
                        Copy link
                      </button>
                      <button className="icon-action" type="button" onClick={() => setSelectedEvent(event)}>
                        Edit
                      </button>
                      <button
                        className="icon-action"
                        type="button"
                        onClick={() => window.open(`/book/${event.slug}`, "_blank", "noopener,noreferrer")}
                        disabled={!event.isActive}
                      >
                        View
                      </button>
                      <button className="icon-action danger" type="button" onClick={() => handleDelete(event.id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : null}

          <div className="info-banner">
            <span>📣</span>
            <p>
              You have <strong>{activeEvents}</strong> active event types ready for sharing.
            </p>
          </div>
        </section>

        <aside className="editor-column" ref={formRef}>
          <EventTypeForm
            selectedEvent={selectedEvent}
            onSave={handleSave}
            onCancel={() => setSelectedEvent(null)}
            isSaving={saving}
          />
        </aside>
      </section>
    </div>
  );
}
