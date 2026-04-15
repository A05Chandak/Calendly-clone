import { useLocation, Link } from "react-router-dom";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

export default function ConfirmationPage() {
  const { state } = useLocation();

  return (
    <div className="confirmation-shell">
      <section className="confirmation-card">
        <p className="eyebrow">Confirmed</p>
        <h1>Your meeting is booked</h1>
        {state ? (
          <>
            <p>{state.eventName} with {state.hostName}</p>
            <p>{dayjs(state.startAt).tz(state.viewerTimezone || state.timezone).format("dddd, MMMM D, YYYY · h:mm A")} ({state.viewerTimezone || state.timezone})</p>
            <p>{state.location}</p>
            <p>{state.inviteeName} · {state.inviteeEmail}</p>
            {state.inviteeNotes ? <p>Notes: {state.inviteeNotes}</p> : null}
          </>
        ) : (
          <p>Booking details are not available.</p>
        )}
        <Link to="/" className="button">Back to dashboard</Link>
      </section>
    </div>
  );
}
