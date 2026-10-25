import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ArrowLeftRight, BarChart3, Bell, LayoutDashboard, LogOut, Moon, PiggyBank, Plus, Search, Settings, Sun, Target } from 'lucide-react';
import { useAuth } from '../AuthContext.jsx';
import api from '../api';
import TransactionForm from './TransactionForm.jsx';
import { thisMonth } from '../utils';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/budgets', label: 'Budgets', icon: PiggyBank },
  { to: '/statistics', label: 'Statistics', icon: BarChart3 },
  { to: '/goals', label: 'Goals', icon: Target },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Layout() {
  const { user, logout, theme, toggleTheme } = useAuth();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [q, setQ] = useState('');
  const [alerts, setAlerts] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    api.get('/budgets', { params: { month: thisMonth() } }).then((r) => setAlerts(r.data.filter((b) => b.percent >= 75))).catch(() => {});
  }, [refreshKey]);

  const search = (e) => {
    e.preventDefault();
    navigate(`/transactions?search=${encodeURIComponent(q)}`);
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">S</div> SpendWise
        </div>
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <Icon size={19} /> <span>{label}</span>
          </NavLink>
        ))}
        <div className="sidebar-spacer" />
        <button className="nav-link logout" onClick={logout}>
          <LogOut size={19} /> <span>Log out</span>
        </button>
      </aside>

      <div className="main">
        <header className="topbar">
          <form className="search" onSubmit={search}>
            <Search size={18} color="var(--muted)" />
            <input placeholder="Search transactions" value={q} onChange={(e) => setQ(e.target.value)} />
          </form>
          <div className="topbar-spacer" />
          <button className="btn" onClick={() => setAdding(true)}>
            <Plus size={18} /> <span className="add-label">Add money</span>
          </button>
          <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <div className="notif-wrap">
            <button className="icon-btn" onClick={() => setOpen(!open)} aria-label="Notifications">
              <Bell size={18} />
              {alerts.length > 0 && <span className="badge-dot">{alerts.length}</span>}
            </button>
            {open && (
              <div className="dropdown">
                {alerts.length === 0 && <div className="item muted">No budget alerts</div>}
                {alerts.map((b) => (
                  <div className="item" key={b._id}>
                    <strong>{b.category}</strong>:{' '}
                    {b.percent > 100 ? `budget exceeded (${b.percent}% used)` : `${b.percent}% of budget used`}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="avatar" title={user.name}>{user.name[0].toUpperCase()}</div>
        </header>

        <Outlet context={{ refreshKey, refresh: () => setRefreshKey((k) => k + 1) }} />
      </div>

      {adding && (
        <TransactionForm
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
}
