import { useEffect, useState } from "react";
import http from "../api/http";

const dayLabels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const getErrorMessage = (error, fallback) => error.response?.data?.message || fallback;

export default function AvailabilityPage() {
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [weeklyHours, setWeeklyHours] = useState([]);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const enabledDays = weeklyHours.filter((item) => item.isEnabled).length;

  useEffect(() => {
    const loadAvailability = async () => {
      try {
        const { data } = await http.get("/availability");
        setTimezone(data.timezone);
        setWeeklyHours(data.weeklyHours);
      } catch (error) {
        setFeedback({ type: "error", message: getErrorMessage(error, "We could not load availability settings.") });
      }
    };

    loadAvailability();
  }, []);

  const handleUpdate = (dayOfWeek, field, value) => {
    setWeeklyHours((current) =>
      current.map((item) =>
        item.dayOfWeek === dayOfWeek ? { ...item, [field]: value } : item,
      ),
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setFeedback({ type: "", message: "" });

    try {
      await http.put("/availability", { timezone, weeklyHours });
      setFeedback({ type: "success", message: "Availability saved successfully." });
    } catch (error) {
      setFeedback({ type: "error", message: getErrorMessage(error, "We could not save availability.") });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-stack">
      <section className="scheduling-header">
        <p className="hero-copy">Control the days and times people can book with you.</p>
        <button className="button" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save availability"}
        </button>
      </section>

      <section className="stats-row">
        <article className="stat-card">
          <span>Enabled days</span>
          <strong>{enabledDays}</strong>
        </article>
        <article className="stat-card">
          <span>Timezone</span>
          <strong>{timezone}</strong>
        </article>
      </section>

      {feedback.message ? <p className={`feedback-banner ${feedback.type}`}>{feedback.message}</p> : null}

      <section className="panel availability-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Weekly hours</p>
            <h2>Set your weekly hours</h2>
            <p className="panel-subcopy">This is the schedule guests will see while choosing a time.</p>
          </div>
        </div>

        <label className="timezone-field">
          Timezone
          <select value={timezone} onChange={(e) => setTimezone(e.target.value)}>
            {Intl.supportedValuesOf("timeZone").map((zone) => (
              <option key={zone} value={zone}>{zone}</option>
            ))}
          </select>
        </label>

        <div className="availability-grid">
          {weeklyHours.map((item) => (
            <div key={item.dayOfWeek} className="availability-rule-card">
              <div className="availability-day">
                <strong>{dayLabels[item.dayOfWeek]}</strong>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={item.isEnabled}
                    onChange={(e) => handleUpdate(item.dayOfWeek, "isEnabled", e.target.checked)}
                  />
                  <span>{item.isEnabled ? "Enabled" : "Off"}</span>
                </label>
              </div>
              <div className="availability-time-row">
                <input
                  type="time"
                  value={item.startTime}
                  onChange={(e) => handleUpdate(item.dayOfWeek, "startTime", e.target.value)}
                  disabled={!item.isEnabled}
                />
                <span>to</span>
                <input
                  type="time"
                  value={item.endTime}
                  onChange={(e) => handleUpdate(item.dayOfWeek, "endTime", e.target.value)}
                  disabled={!item.isEnabled}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
