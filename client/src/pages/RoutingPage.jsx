export default function RoutingPage() {
  return (
    <div className="page-stack">
      <section className="scheduling-header">
        <div>
          <h1>Routing</h1>
          <p className="hero-copy">Basic routing rules page for directing invitees to the right meeting flow.</p>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Routing</p>
            <h2>Lead routing rules</h2>
            <p className="panel-subcopy">This is a simple placeholder page you can extend later with form-based routing logic.</p>
          </div>
        </div>

        <div className="empty-state">
          <h3>No routing rules yet</h3>
          <p>Create future rules here to send bookings to different event types or team members based on answers.</p>
        </div>
      </section>
    </div>
  );
}
