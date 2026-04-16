import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import EventTypeForm from "../components/EventTypeForm";
import http from "../api/http";

const dashboardTabs = [
  { key: "event-types", label: "Event types" },
  { key: "single-use-links", label: "Single-use links" },
  { key: "meeting-polls", label: "Meeting polls" }
];

const getErrorMessage = (error, fallback) => error.response?.data?.message || fallback;

function SingleUseLinksPage() {
  return (
    <section className="panel tab-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Single-use links</p>
          <h2>Private booking links</h2>
          <p className="panel-subcopy">Create one-off links for special meetings, fast intros, or invite-only booking flows.</p>
        </div>
      </div>

      <div className="single-use-grid">
        <article className="empty-state">
          <h3>VIP intro link</h3>
          <p>Share a private booking link with one client or lead without exposing it on your public page.</p>
        </article>
        <article className="empty-state">
          <h3>Interview slot</h3>
          <p>Send a temporary slot link for a specific candidate, mentor session, or one-time follow-up.</p>
        </article>
      </div>
    </section>
  );
}

function MeetingPollsPage() {
  return (
    <section className="panel tab-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Meeting polls</p>
          <h2>Group scheduling polls</h2>
          <p className="panel-subcopy">Collect time preferences from multiple people before locking the final meeting slot.</p>
        </div>
      </div>

      <div className="single-use-grid">
        <article className="empty-state">
          <h3>Design review poll</h3>
          <p>Ask teammates to vote on the best time for a larger design review or planning discussion.</p>
        </article>
        <article className="empty-state">
          <h3>Client sync poll</h3>
          <p>Share a shortlist of time options and confirm the slot that works best for everyone involved.</p>
        </article>
      </div>
    </section>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const formRef = useRef(null);
  const tabContentRef = useRef(null);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const activeTab = searchParams.get("tab") || "event-types";

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
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        next.delete("new");
        return next;
      }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (activeTab !== "event-types") {
      tabContentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [activeTab]);

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
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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

  const handleEdit = (event) => {
    setSelectedEvent(event);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleTabChange = (tabKey) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set("tab", tabKey);
      return next;
    }, { replace: true });
  };

  const renderEventTypes = () => (
    <>
      <section className="toolbar-card">
        <div className="toolbar-row">
          <button type="button" className="toolbar-pill">My Calendly</button>
          <div className="toolbar-search">
            <span>Search</span>
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

      <section className="dashboard-layout" ref={tabContentRef}>
        <section className="scheduling-column">
          <div className="workspace-owner-row">
            <div className="owner-chip">
              <span className="mini-avatar owner-avatar">AC</span>
              <strong>Aditi Chandak</strong>
            </div>
            <button type="button" className="landing-link landing-link-button" onClick={() => navigate("/profile")}>
              View profile
            </button>
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
                      <p>{event.durationMinutes} min · {event.location} · One-on-One</p>
                      <p>{event.isActive ? "Public booking is enabled" : "Hidden from booking page"}</p>
                    </div>
                    <div className="event-type-actions">
                      <button className="button button-secondary" onClick={() => handleCopyLink(event.slug)} disabled={!event.isActive}>
                        Copy link
                      </button>
                      <button className="icon-action" type="button" onClick={() => handleEdit(event)}>
                        Edit
                      </button>
                      <button
                        className="icon-action"
                        type="button"
                        onClick={() => navigate(`/book/${event.slug}`)}
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
            <span>Info</span>
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
    </>
  );

  return (
    <div className="page-stack">
      <section className="scheduling-header">
        <p className="hero-copy">Manage event types, booking links, and the workspace flow from one place.</p>
      </section>

      <div className="tab-row">
        {dashboardTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`tab-button ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => handleTabChange(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "event-types" ? renderEventTypes() : null}
      {activeTab === "single-use-links" ? <SingleUseLinksPage /> : null}
      {activeTab === "meeting-polls" ? <MeetingPollsPage /> : null}
    </div>
  );
}
