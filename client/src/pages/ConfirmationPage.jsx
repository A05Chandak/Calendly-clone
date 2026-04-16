import { useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import http from "../api/http";

dayjs.extend(utc);
dayjs.extend(timezone);

export default function ConfirmationPage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [meetingStatus, setMeetingStatus] = useState(state?.status || "scheduled");
  const [menuOpen, setMenuOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const isCancelled = meetingStatus === "cancelled";
  const heading = meetingStatus === "rescheduled" ? "Your meeting is rescheduled" : isCancelled ? "Your meeting is cancelled" : "Your meeting is booked";
  const eyebrow = meetingStatus === "rescheduled" ? "Rescheduled" : isCancelled ? "Cancelled" : "Confirmed";

  const handleCancel = async () => {
    if (!state?.meetingId || isCancelled) {
      return;
    }

    setIsCancelling(true);
    setFeedback("");

    try {
      await http.post(`/public/bookings/${state.meetingId}/cancel`);
      setFeedback("Meeting cancelled successfully.");
      setMeetingStatus("cancelled");
    } catch (error) {
      setFeedback(error.response?.data?.message || "We could not cancel this meeting.");
    } finally {
      setIsCancelling(false);
      setMenuOpen(false);
    }
  };

  const handleReschedule = () => {
    if (!state?.meetingId || !state?.slug) {
      return;
    }

    navigate(`/book/${state.slug}?reschedule=${state.meetingId}`);
  };

  return (
    <div className="confirmation-shell">
      <section className="confirmation-card">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{heading}</h1>
        {state ? (
          <>
            <p>{state.eventName} with {state.hostName}</p>
            <p>{dayjs(state.startAt).tz(state.viewerTimezone || state.timezone).format("dddd, MMMM D, YYYY · h:mm A")} ({state.viewerTimezone || state.timezone})</p>
            <p>{state.location}</p>
            <p>{state.inviteeName} · {state.inviteeEmail}</p>
            {state.inviteeNotes ? <p>Notes: {state.inviteeNotes}</p> : null}
            {feedback ? <p className="confirmation-feedback">{feedback}</p> : null}
            {!isCancelled ? (
              <div className="confirmation-actions">
                <button type="button" className="button button-secondary" onClick={handleReschedule}>
                  Reschedule
                </button>
                <div className="confirmation-menu">
                  <button type="button" className="button button-secondary" onClick={() => setMenuOpen((current) => !current)}>
                    More
                  </button>
                  {menuOpen ? (
                    <div className="confirmation-menu-popover">
                      <button type="button" className="confirmation-menu-item" onClick={handleReschedule}>
                        Reschedule meeting
                      </button>
                      <button type="button" className="confirmation-menu-item danger" onClick={handleCancel} disabled={isCancelling}>
                        {isCancelling ? "Cancelling..." : "Cancel meeting"}
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <p>Booking details are not available.</p>
        )}
        <Link to="/" className="button">Back to dashboard</Link>
      </section>
    </div>
  );
}
