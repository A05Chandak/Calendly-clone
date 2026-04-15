export default function AdminCenterPage() {
  return (
    <div className="page-stack">
      <section className="scheduling-header">
        <div>
          <h1>Admin center</h1>
          <p className="hero-copy">A simple admin area for workspace settings, permissions, and management controls.</p>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Admin</p>
            <h2>Workspace management</h2>
            <p className="panel-subcopy">This placeholder gives you a navigable section for admin functionality.</p>
          </div>
        </div>
        <div className="empty-state">
          <h3>No admin tools configured yet</h3>
          <p>Add roles, team settings, workspace controls, and security settings here later.</p>
        </div>
      </section>
    </div>
  );
}
