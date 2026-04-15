export default function IntegrationsPage() {
  return (
    <div className="page-stack">
      <section className="scheduling-header">
        <div>
          <h1>Integrations & apps</h1>
          <p className="hero-copy">Connect video, calendar, CRM, and automation tools from one place.</p>
        </div>
      </section>

      <section className="stats-row">
        <article className="stat-card">
          <span>Calendar sync</span>
          <strong>Ready</strong>
        </article>
        <article className="stat-card">
          <span>Video apps</span>
          <strong>Ready</strong>
        </article>
        <article className="stat-card">
          <span>CRM tools</span>
          <strong>Coming soon</strong>
        </article>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Integrations</p>
            <h2>Connected tools</h2>
            <p className="panel-subcopy">This page is intentionally basic, but now the sidebar flow is complete.</p>
          </div>
        </div>
        <div className="empty-state">
          <h3>No additional apps connected</h3>
          <p>Add Google Calendar, Outlook, Zoom, Stripe, or CRM integrations here when you expand the project.</p>
        </div>
      </section>
    </div>
  );
}
