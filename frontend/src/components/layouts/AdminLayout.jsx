import { Outlet } from "react-router-dom";
import { LayoutDashboard, Building2, Crown, SlidersHorizontal } from "lucide-react";
import DashboardShell from "../DashboardShell";

const NAV = [
  { to: "/admin", end: true, label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/owners", label: "Owners", icon: Building2 },
  { to: "/admin/plans", label: "Subscription Plans", icon: Crown },
  { to: "/admin/settings", label: "Integration Settings", icon: SlidersHorizontal },
];

export default function AdminLayout() {
  return (
    <DashboardShell nav={NAV} title="Super Admin" subtitle="Platform control center">
      <Outlet />
    </DashboardShell>
  );
}
