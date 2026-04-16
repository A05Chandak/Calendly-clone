export default function ContactsPage() {
  return (
    <div className="page-stack">
      <section className="scheduling-header">
        <p className="hero-copy">A basic contacts page for invitees, leads, and people you meet with regularly.</p>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Contacts</p>
            <h2>People directory</h2>
            <p className="panel-subcopy">You can expand this later with search, recent invitees, and CRM syncing.</p>
          </div>
        </div>
        <div className="empty-state">
          <h3>No saved contacts yet</h3>
          <p>Booked invitees and imported leads can appear here in a future version.</p>
        </div>
      </section>
    </div>
  );
}
