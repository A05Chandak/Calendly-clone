import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import http from "../api/http";

const getErrorMessage = (error, fallback) => error.response?.data?.message || fallback;

function MeetingSection({ title, meetings, onCancel }) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Meetings</p>
          <h2>{title}</h2>
        </div>
      </div>
      <div className="meeting-list">
        {meetings.length === 0 ? (
          <div className="empty-state">
            <p>No meetings in this section yet.</p>
          </div>
        ) : (
          meetings.map((meeting) => (
            <article key={meeting.id} className="meeting-record-card">
              <div className="meeting-record-main">
                <div className="meeting-record-title">
                  <span className="meeting-accent large" style={{ backgroundColor: meeting.colorHex }} />
                  <div>
                    <h3>{meeting.eventName}</h3>
                    <p>{meeting.inviteeName} · {meeting.inviteeEmail}</p>
                  </div>
                </div>
                <div className="meeting-record-meta">
                  <p>{dayjs(meeting.startAt).format("ddd, MMM D · h:mm A")} - {dayjs(meeting.endAt).format("h:mm A")}</p>
                  <p>{meeting.location}</p>
                  {meeting.inviteeNotes ? <p>Notes: {meeting.inviteeNotes}</p> : null}
                </div>
              </div>
              {onCancel ? (
                <button className="button button-secondary" onClick={() => onCancel(meeting.id)}>
                  Cancel
                </button>
              ) : null}
            </article>
          ))
        )}
      </div>
    </section>
  );
}

export default function MeetingsPage() {
  const [upcoming, setUpcoming] = useState([]);
  const [past, setPast] = useState([]);
  const [cancelled, setCancelled] = useState([]);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const totals = useMemo(
    () => ({
      upcoming: upcoming.length,
      past: past.length,
      cancelled: cancelled.length
    }),
    [cancelled.length, past.length, upcoming.length],
  );

  const fetchMeetings = async () => {
    try {
      const [upcomingResponse, pastResponse, cancelledResponse] = await Promise.all([
        http.get("/meetings?status=upcoming"),
        http.get("/meetings?status=past"),
        http.get("/meetings/cancelled")
      ]);

      setUpcoming(upcomingResponse.data);
      setPast(pastResponse.data);
      setCancelled(cancelledResponse.data);
    } catch (error) {
      setFeedback({ type: "error", message: getErrorMessage(error, "We could not load meetings.") });
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const handleCancel = async (id) => {
    try {
      await http.post(`/meetings/${id}/cancel`);
      setFeedback({ type: "success", message: "Meeting cancelled successfully." });
      fetchMeetings();
    } catch (error) {
      setFeedback({ type: "error", message: getErrorMessage(error, "We could not cancel this meeting.") });
    }
  };

  return (
    <div className="page-stack">
      <section className="scheduling-header">
        <div>
          <h1>Meetings</h1>
          <p className="hero-copy">Review upcoming, completed, and cancelled meetings in one place.</p>
        </div>
      </section>

      <section className="stats-row">
        <article className="stat-card">
          <span>Upcoming</span>
          <strong>{totals.upcoming}</strong>
        </article>
        <article className="stat-card">
          <span>Past</span>
          <strong>{totals.past}</strong>
        </article>
        <article className="stat-card">
          <span>Cancelled</span>
          <strong>{totals.cancelled}</strong>
        </article>
      </section>

      {feedback.message ? <p className={`feedback-banner ${feedback.type}`}>{feedback.message}</p> : null}

      <MeetingSection title="Upcoming" meetings={upcoming} onCancel={handleCancel} />
      <MeetingSection title="Past" meetings={past} />
      <MeetingSection title="Cancelled" meetings={cancelled} />
    </div>
  );
}
