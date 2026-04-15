import { useEffect, useState } from "react";
import { NavLink, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import AvailabilityPage from "./pages/AvailabilityPage";
import MeetingsPage from "./pages/MeetingsPage";
import RoutingPage from "./pages/RoutingPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import ContactsPage from "./pages/ContactsPage";
import WorkflowsPage from "./pages/WorkflowsPage";
import IntegrationsPage from "./pages/IntegrationsPage";
import AdminCenterPage from "./pages/AdminCenterPage";
import HelpPage from "./pages/HelpPage";
import UpgradePlanPage from "./pages/UpgradePlanPage";
import ProfilePage from "./pages/ProfilePage";
import BookingPage from "./pages/BookingPage";
import ConfirmationPage from "./pages/ConfirmationPage";
import http from "./api/http";

const primaryNavItems = [
  { to: "/", label: "Scheduling", icon: "↗", end: true },
  { to: "/meetings", label: "Meetings", icon: "◫" },
  { to: "/availability", label: "Availability", icon: "◔" }
];

const secondaryNavItems = [
  { to: "/contacts", label: "Contacts", icon: "⊡" },
  { to: "/workflows", label: "Workflows", icon: "⇄" },
  { to: "/integrations", label: "Integrations & apps", icon: "⌘" },
  { to: "/routing", label: "Routing", icon: "⇢" },
  { to: "/analytics", label: "Analytics", icon: "▣" },
  { to: "/admin-center", label: "Admin center", icon: "♛" },
  { to: "/help", label: "Help", icon: "?" }
];

const onboardingItems = [
  { title: "Get to know Calendly", subtitle: "1 video", icon: "◌" },
  { title: "Add team members", subtitle: "Invite collaborators", icon: "✓" },
  { title: "Using Calendly with a team", subtitle: "1 / 2 tasks", icon: "✦" },
  { title: "The perfect scheduling setup", subtitle: "2 tasks", icon: "☷" },
  { title: "Automate meeting prep and follow-up", subtitle: "2 tasks", icon: "✉" }
];

const pageTitleMap = {
  "/": "Scheduling",
  "/meetings": "Meetings",
  "/availability": "Availability",
  "/routing": "Routing",
  "/analytics": "Analytics",
  "/contacts": "Contacts",
  "/workflows": "Workflows",
  "/integrations": "Integrations & apps",
  "/admin-center": "Admin center",
  "/help": "Help",
  "/upgrade-plan": "Upgrade plan",
  "/profile": "Profile"
};

function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const [health, setHealth] = useState({ status: "checking", database: "unknown" });
  const [isRailOpen, setIsRailOpen] = useState(true);

  useEffect(() => {
    const loadHealth = async () => {
      try {
        const { data } = await http.get("/health");
        setHealth({ status: data.status, database: data.database });
      } catch {
        setHealth({ status: "error", database: "disconnected" });
      }
    };

    loadHealth();
  }, []);

  const pageTitle = pageTitleMap[location.pathname] || "Scheduling";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup">
          <div className="brand-ring">
            <div className="brand-ring-inner">C</div>
          </div>
          <div className="brand-copy">
            <h1>Calendly</h1>
          </div>
        </div>

        <button className="create-button" onClick={() => navigate("/?new=1")}>
          <span>+</span>
          Create
        </button>

        <nav className="nav-links">
          {primaryNavItems.map((item) => (
            <NavLink
              key={item.to}
              end={item.end}
              to={item.to}
              className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="nav-section">
          {secondaryNavItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) => `nav-link nav-link-muted ${isActive ? "active" : ""}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>

        <button className="upgrade-button" type="button" onClick={() => navigate("/upgrade-plan")}>
          Upgrade plan
        </button>

        <button className="sidebar-footer sidebar-footer-button" type="button" onClick={() => navigate("/profile")}>
          <div className="mini-avatar">AC</div>
          <div>
            <strong>Aditi Chandak</strong>
            <p>Owner</p>
          </div>
        </button>
      </aside>

      <main className={`workspace-shell ${isRailOpen ? "rail-open" : "rail-closed"}`}>
        <section className="page-shell">
          <header className="topbar">
            <div>
              <p className="topbar-label">My Calendly</p>
              <h2>{pageTitle}</h2>
            </div>

            <div className="topbar-actions">
              <span className={`status-pill ${health.database === "connected" ? "ok" : "error"}`}>
                {health.database === "connected" ? "MySQL connected" : "MySQL disconnected"}
              </span>
              <button className="profile-chip" type="button" onClick={() => navigate("/profile")}>
                <span className="profile-avatar">A</span>
                <span>Workspace</span>
              </button>
              <button className="button" onClick={() => navigate("/?new=1")}>+ Create</button>
            </div>
          </header>

          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/availability" element={<AvailabilityPage />} />
            <Route path="/meetings" element={<MeetingsPage />} />
            <Route path="/routing" element={<RoutingPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/contacts" element={<ContactsPage />} />
            <Route path="/workflows" element={<WorkflowsPage />} />
            <Route path="/integrations" element={<IntegrationsPage />} />
            <Route path="/admin-center" element={<AdminCenterPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/upgrade-plan" element={<UpgradePlanPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </section>

        {isRailOpen ? (
          <aside className="right-rail">
            <div className="rail-header">
              <h3>Get started</h3>
              <button type="button" className="rail-close" onClick={() => setIsRailOpen(false)}>×</button>
            </div>
            <div className="rail-list">
              {onboardingItems.map((item) => (
                <article key={item.title} className="rail-card">
                  <div className="rail-icon">{item.icon}</div>
                  <div>
                    <h4>{item.title}</h4>
                    <p>{item.subtitle}</p>
                  </div>
                </article>
              ))}
            </div>
            <button type="button" className="rail-dismiss" onClick={() => setIsRailOpen(false)}>Don't show again</button>
          </aside>
        ) : (
          <button type="button" className="rail-reopen" onClick={() => setIsRailOpen(true)}>
            Open Get started
          </button>
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/book/:slug" element={<BookingPage />} />
      <Route path="/confirmation" element={<ConfirmationPage />} />
      <Route path="/*" element={<AppShell />} />
    </Routes>
  );
}
