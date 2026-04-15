import { useEffect, useState } from "react";

const initialForm = {
  name: "",
  slug: "",
  durationMinutes: 30,
  description: "",
  location: "Google Meet",
  colorHex: "#006bff",
  isActive: true
};

const toSlug = (value) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

export default function EventTypeForm({ selectedEvent, onSave, onCancel, isSaving = false }) {
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    if (selectedEvent) {
      setForm(selectedEvent);
    } else {
      setForm(initialForm);
    }
  }, [selectedEvent]);

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave({
      ...form,
      slug: form.slug.trim().toLowerCase().replace(/\s+/g, "-")
    });
  };

  return (
    <form className="panel form-panel" onSubmit={handleSubmit}>
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Event Setup</p>
          <h2>{selectedEvent ? "Edit event type" : "Create event type"}</h2>
          <p className="panel-subcopy">
            Configure the event details guests will see before they book a time with you.
          </p>
        </div>
      </div>

      <label>
        Event name
        <input
          value={form.name}
          onChange={(e) => {
            const nextName = e.target.value;
            setForm((current) => ({
              ...current,
              name: nextName,
              slug: selectedEvent ? current.slug : toSlug(nextName)
            }));
          }}
          required
        />
      </label>

      <label>
        URL slug
        <input value={form.slug} onChange={(e) => handleChange("slug", toSlug(e.target.value))} required />
      </label>

      <label>
        Duration (minutes)
        <input
          type="number"
          min="15"
          step="15"
          value={form.durationMinutes}
          onChange={(e) => handleChange("durationMinutes", Number(e.target.value))}
          required
        />
      </label>

      <label>
        Location
        <input value={form.location} onChange={(e) => handleChange("location", e.target.value)} required />
      </label>

      <label>
        Brand color
        <input type="color" value={form.colorHex} onChange={(e) => handleChange("colorHex", e.target.value)} />
      </label>

      <label className="toggle">
        <input
          type="checkbox"
          checked={Boolean(form.isActive)}
          onChange={(e) => handleChange("isActive", e.target.checked)}
        />
        <span>Show this event publicly</span>
      </label>

      <label>
        Description
        <textarea rows="4" value={form.description || ""} onChange={(e) => handleChange("description", e.target.value)} />
      </label>

      <div className="form-actions">
        {selectedEvent && (
          <button type="button" className="button button-secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="button" disabled={isSaving}>
          {isSaving ? "Saving..." : selectedEvent ? "Save changes" : "Create event"}
        </button>
      </div>
    </form>
  );
}
