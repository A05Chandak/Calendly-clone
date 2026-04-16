export default function ProfilePage() {
  return (
    <div className="page-stack">
      <section className="scheduling-header">
        <p className="hero-copy">A basic profile page for personal details, booking preferences, and workspace identity.</p>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Profile</p>
            <h2>Account details</h2>
            <p className="panel-subcopy">Use this page as the base for host profile settings and personal scheduling preferences.</p>
          </div>
        </div>
        <div className="profile-summary-card">
          <div className="profile-summary-avatar">AC</div>
          <div className="profile-summary-copy">
            <h3>Aditi Chandak</h3>
            <p>Owner</p>
            <p>aditi@example.com</p>
          </div>
        </div>
      </section>
    </div>
  );
}
