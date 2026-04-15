export default function WorkflowsPage() {
  return (
    <div className="page-stack">
      <section className="scheduling-header">
        <div>
          <h1>Workflows</h1>
          <p className="hero-copy">A simple workflows area for reminders, follow-ups, and booking automation.</p>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Workflows</p>
            <h2>Automations</h2>
            <p className="panel-subcopy">Use this placeholder page as the base for email reminders and meeting follow-ups.</p>
          </div>
        </div>
        <div className="empty-state">
          <h3>No workflows configured</h3>
          <p>Create reminder emails, post-meeting follow-ups, and other automations here later.</p>
        </div>
      </section>
    </div>
  );
}
