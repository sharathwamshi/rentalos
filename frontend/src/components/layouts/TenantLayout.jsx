import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { LayoutDashboard, User, Home, FileText, Receipt, Bell, Wrench, DoorOpen, MessageSquare } from "lucide-react";
import DashboardShell from "../DashboardShell";
import api from "../../api/client";

export default function TenantLayout() {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const load = () => api.get("/tenant/notifications/unread-count").then((r) => setUnread(r.data.count)).catch(() => {});
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  const NAV = [
    { to: "/tenant", end: true, label: "Dashboard", icon: LayoutDashboard },
    { to: "/tenant/profile", label: "Profile", icon: User },
    { to: "/tenant/my-room", label: "My Room", icon: Home },
    { to: "/tenant/agreements", label: "Agreements", icon: FileText },
    { to: "/tenant/invoices", label: "Invoices & Billing", icon: Receipt },
    { to: "/tenant/maintenance", label: "Maintenance", icon: Wrench },
    { to: "/tenant/vacate", label: "Vacate Request", icon: DoorOpen },
    { to: "/tenant/messages", label: "Messages", icon: MessageSquare },
    { to: "/tenant/notifications", label: "Notifications", icon: Bell, badge: unread },
  ];

  return (
    <DashboardShell nav={NAV} title="Tenant Portal" subtitle="Your rent, room and requests" unreadCount={unread}>
      <Outlet />
    </DashboardShell>
  );
}
