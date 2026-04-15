export default function HelpPage() {
  return (
    <div className="page-stack">
      <section className="scheduling-header">
        <div>
          <h1>Help</h1>
          <p className="hero-copy">A simple help page for setup guidance, FAQs, and support resources.</p>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Help</p>
            <h2>Support resources</h2>
            <p className="panel-subcopy">This section can later contain FAQs, onboarding docs, and troubleshooting steps.</p>
          </div>
        </div>
        <div className="empty-state">
          <h3>Need support?</h3>
          <p>Use this page later for documentation, contact links, product walkthroughs, and error guides.</p>
        </div>
      </section>
    </div>
  );
}
