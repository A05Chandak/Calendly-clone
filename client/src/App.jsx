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
  { to: "/", label: "Scheduling", icon: "->", end: true },
  { to: "/meetings", label: "Meetings", icon: "[]" },
  { to: "/availability", label: "Availability", icon: "o" }
];

const secondaryNavItems = [
  { to: "/contacts", label: "Contacts", icon: "*" },
  { to: "/workflows", label: "Workflows", icon: "<>" },
  { to: "/integrations", label: "Integrations & apps", icon: "+" },
  { to: "/routing", label: "Routing", icon: "=>" },
  { to: "/analytics", label: "Analytics", icon: "#" },
  { to: "/admin-center", label: "Admin center", icon: "^" },
  { to: "/help", label: "Help", icon: "?" }
];

const onboardingItems = [
  {
    title: "Get to know Calendly",
    subtitle: "1 video",
    description: "Start with a quick overview of the workspace so the main scheduling flow, booking links, and settings feel familiar.",
    icon: "o"
  },
  {
    title: "Add team members",
    subtitle: "Invite collaborators",
    description: "Bring teammates into the workspace so ownership, coverage, and shared scheduling can grow beyond a single host.",
    icon: "+"
  },
  {
    title: "Using Calendly with a team",
    subtitle: "1 / 2 tasks",
    description: "Set up shared habits for booking, event ownership, and follow-through so the team experience stays organized.",
    icon: "*"
  },
  {
    title: "The perfect scheduling setup",
    subtitle: "2 tasks",
    description: "Fine-tune event types, availability, and booking rules so invitees move through a clean and reliable flow.",
    icon: "@"
  },
  {
    title: "Automate meeting prep and follow-up",
    subtitle: "2 tasks",
    description: "Use reminders and follow-ups to reduce manual work before meetings and keep momentum after each conversation.",
    icon: "M"
  }
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedOnboardingItem, setExpandedOnboardingItem] = useState(onboardingItems[0].title);

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

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setIsSidebarOpen(false);
  }, [location.pathname, location.search]);

  const pageTitle = pageTitleMap[location.pathname] || "Scheduling";
  const handleCreate = () => navigate(`/?new=${Date.now()}`);

  return (
    <div className={`app-shell ${isSidebarOpen ? "sidebar-open" : ""}`}>
      <button
        type="button"
        className="sidebar-backdrop"
        aria-label="Close navigation"
        onClick={() => setIsSidebarOpen(false)}
      />

      <aside className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
        <div className="brand-lockup">
          <div className="brand-ring">
            <div className="brand-ring-inner">AC</div>
          </div>
          <div className="brand-copy">
            <h1>Calendly</h1>
          </div>
          <button
            type="button"
            className="sidebar-close-mobile"
            aria-label="Close navigation"
            onClick={() => setIsSidebarOpen(false)}
          >
            x
          </button>
        </div>

        <button className="create-button" onClick={handleCreate}>
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
            <div className="topbar-main">
              <button
                className="mobile-nav-toggle"
                type="button"
                aria-label="Open navigation"
                onClick={() => setIsSidebarOpen(true)}
              >
                <span />
                <span />
                <span />
              </button>
              <div>
                <p className="topbar-label">My Calendly</p>
                <h2>{pageTitle}</h2>
              </div>
            </div>

            <div className="topbar-actions">
              <span className={`status-pill ${health.database === "connected" ? "ok" : "error"}`}>
                {health.database === "connected" ? "MySQL connected" : "MySQL disconnected"}
              </span>
              <button className="profile-chip" type="button" onClick={() => navigate("/profile")}>
                <span className="profile-avatar">AC</span>
                <span>Workspace</span>
              </button>
              <button className="button" onClick={handleCreate}>+ Create</button>
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
              <button type="button" className="rail-close" onClick={() => setIsRailOpen(false)}>x</button>
            </div>
            <div className="rail-list">
              {onboardingItems.map((item) => (
                <article key={item.title} className="rail-card">
                  <button
                    type="button"
                    className="rail-toggle"
                    onClick={() =>
                      setExpandedOnboardingItem((current) => (current === item.title ? "" : item.title))
                    }
                  >
                    <div className="rail-toggle-main">
                      <div className="rail-icon">{item.icon}</div>
                      <h4>{item.title}</h4>
                    </div>
                    <span className={`rail-toggle-indicator ${expandedOnboardingItem === item.title ? "open" : ""}`}>
                      +
                    </span>
                  </button>
                  {expandedOnboardingItem === item.title ? (
                    <div className="rail-card-body">
                      <p>{item.subtitle}</p>
                      <p className="rail-description">{item.description}</p>
                    </div>
                  ) : null}
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
