import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { LayoutDashboard, Home, Users, ArrowLeftRight, FileText, Receipt, BarChart3, Crown, Wrench, MessageSquare, BellRing } from "lucide-react";
import DashboardShell from "../DashboardShell";
import api from "../../api/client";

const NAV = [
  { to: "/owner", end: true, label: "Dashboard", icon: LayoutDashboard },
  { to: "/owner/properties", label: "Property", icon: Home },
  { to: "/owner/tenants", label: "Tenants", icon: Users },
  { to: "/owner/assignments", label: "Room Assignments", icon: ArrowLeftRight },
  { to: "/owner/agreements", label: "Agreements", icon: FileText },
  { to: "/owner/invoices", label: "Invoices & Payments", icon: Receipt },
  { to: "/owner/maintenance", label: "Maintenance", icon: Wrench },
  { to: "/owner/messages", label: "Messages", icon: MessageSquare },
  { to: "/owner/reports", label: "Reports", icon: BarChart3 },
  { to: "/owner/reminders", label: "Reminder Settings", icon: BellRing },
  { to: "/owner/subscription", label: "Subscription", icon: Crown },
];

export default function OwnerLayout() {
  return (
    <DashboardShell nav={NAV} title="Owner Portal" subtitle="Property & tenant management">
      <Outlet />
    </DashboardShell>
  );
}
