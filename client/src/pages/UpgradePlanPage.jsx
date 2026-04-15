export default function UpgradePlanPage() {
  return (
    <div className="page-stack">
      <section className="scheduling-header">
        <div>
          <h1>Upgrade plan</h1>
          <p className="hero-copy">A dummy upgrade page for premium features, advanced scheduling, and team capabilities.</p>
        </div>
      </section>

      <section className="stats-row">
        <article className="stat-card">
          <span>Current plan</span>
          <strong>Free</strong>
        </article>
        <article className="stat-card">
          <span>Suggested plan</span>
          <strong>Professional</strong>
        </article>
        <article className="stat-card">
          <span>Extras</span>
          <strong>Teams + workflows</strong>
        </article>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Upgrade</p>
            <h2>Plan options</h2>
            <p className="panel-subcopy">This page is intentionally simple but keeps the Upgrade action fully clickable.</p>
          </div>
        </div>
        <div className="empty-state">
          <h3>No payment flow attached</h3>
          <p>Add pricing cards, billing management, and checkout integration here if you want to extend the product.</p>
        </div>
      </section>
    </div>
  );
}
