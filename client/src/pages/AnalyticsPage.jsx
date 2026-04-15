export default function AnalyticsPage() {
  return (
    <div className="page-stack">
      <section className="scheduling-header">
        <div>
          <h1>Analytics</h1>
          <p className="hero-copy">Basic reporting page for tracking bookings, activity, and cancelled meetings.</p>
        </div>
      </section>

      <section className="stats-row">
        <article className="stat-card">
          <span>Total bookings</span>
          <strong>Coming soon</strong>
        </article>
        <article className="stat-card">
          <span>Conversion</span>
          <strong>Coming soon</strong>
        </article>
        <article className="stat-card">
          <span>Cancellations</span>
          <strong>Coming soon</strong>
        </article>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Analytics</p>
            <h2>Scheduling insights</h2>
            <p className="panel-subcopy">This placeholder keeps the navigation functional and gives you room to add charts later.</p>
          </div>
        </div>

        <div className="empty-state">
          <h3>No analytics configured yet</h3>
          <p>Add booking metrics, event performance, and source tracking here when you want to grow this section.</p>
        </div>
      </section>
    </div>
  );
}
