import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Menu, Bell, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const GRADIENTS = {
  owner: "bg-brand-gradient",
  tenant: "bg-tenant-gradient",
  admin: "bg-admin-gradient",
};

export default function DashboardShell({ nav, title, subtitle, children, unreadCount = 0 }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const gradient = GRADIENTS[user?.role] || GRADIENTS.owner;

  return (
    <div className="min-h-screen flex bg-surface">
      {/* Sidebar */}
      <aside
        className={`${collapsed ? "w-20" : "w-64"} shrink-0 transition-all duration-200 ${gradient} text-white flex flex-col`}
      >
        <div className="flex items-center gap-2.5 px-5 h-16 shrink-0">
          <div className="h-8 w-8 rounded-lg bg-white/15 backdrop-blur flex items-center justify-center font-display font-extrabold text-sm">
            R
          </div>
          {!collapsed && <span className="font-display font-extrabold text-lg tracking-tight">RentalOS</span>}
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? "bg-white/15 text-white shadow-inner" : "text-white/75 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <item.icon size={18} strokeWidth={2} className="shrink-0" />
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && item.badge > 0 && (
                <span className="ml-auto rounded-full bg-white text-brand-700 text-[10px] font-bold px-1.5 py-0.5">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/75 hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogOut size={18} />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 shrink-0 bg-white border-b border-slate-100 flex items-center justify-between px-6 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button onClick={() => setCollapsed((c) => !c)} className="text-slate-400 hover:text-ink">
              <Menu size={20} />
            </button>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-600">{title}</p>
              {subtitle && <p className="text-xs text-slate-400 -mt-0.5">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {(user?.role === "owner" || user?.role === "tenant") && (
              <button
                onClick={() => navigate(user.role === "owner" ? "/owner/messages" : "/tenant/notifications")}
                className="relative text-slate-400 hover:text-ink"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
            )}
            <div className="relative">
              <button onClick={() => setMenuOpen((o) => !o)} className="flex items-center gap-2.5">
                <div className={`h-9 w-9 rounded-full ${gradient} text-white flex items-center justify-center text-sm font-bold`}>
                  {user?.full_name?.[0]?.toUpperCase()}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-semibold text-ink leading-tight">{user?.full_name}</p>
                  <p className="text-xs text-slate-400 leading-tight">{user?.email}</p>
                </div>
                <ChevronDown size={16} className="text-slate-400" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-44 rounded-xl bg-white shadow-card-hover border border-slate-100 py-1.5 z-30">
                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 max-w-[1400px] w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
