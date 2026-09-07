import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

import OwnerLayout from "./components/layouts/OwnerLayout";
import OwnerDashboard from "./pages/owner/Dashboard";
import Properties from "./pages/owner/Properties";
import Tenants from "./pages/owner/Tenants";
import RoomAssignments from "./pages/owner/RoomAssignments";
import Agreements from "./pages/owner/Agreements";
import Invoices from "./pages/owner/Invoices";
import InvoiceView from "./pages/owner/InvoiceView";
import OwnerProfile from "./pages/owner/Profile";
import Reports from "./pages/owner/Reports";
import Subscription from "./pages/owner/Subscription";
import Maintenance from "./pages/owner/Maintenance";
import Messages from "./pages/owner/Messages";
import ReminderSettings from "./pages/owner/ReminderSettings";

import TenantLayout from "./components/layouts/TenantLayout";
import TenantDashboard from "./pages/tenant/Dashboard";
import TenantProfile from "./pages/tenant/Profile";
import MyRoom from "./pages/tenant/MyRoom";
import TenantAgreements from "./pages/tenant/Agreements";
import TenantInvoices from "./pages/tenant/Invoices";
import Notifications from "./pages/tenant/Notifications";
import TenantMaintenance from "./pages/tenant/Maintenance";
import VacateRequest from "./pages/tenant/VacateRequest";
import TenantMessages from "./pages/tenant/Messages";

import AdminLayout from "./components/layouts/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import Owners from "./pages/admin/Owners";
import Plans from "./pages/admin/Plans";
import IntegrationSettings from "./pages/admin/Settings";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route element={<ProtectedRoute role="owner" />}>
            <Route path="/owner" element={<OwnerLayout />}>
              <Route index element={<OwnerDashboard />} />
              <Route path="properties" element={<Properties />} />
              <Route path="tenants" element={<Tenants />} />
              <Route path="assignments" element={<RoomAssignments />} />
              <Route path="agreements" element={<Agreements />} />
              <Route path="invoices" element={<Invoices />} />
              <Route path="invoices/:id" element={<InvoiceView />} />
              <Route path="profile" element={<OwnerProfile />} />
              <Route path="maintenance" element={<Maintenance />} />
              <Route path="messages" element={<Messages />} />
              <Route path="reports" element={<Reports />} />
              <Route path="reminders" element={<ReminderSettings />} />
              <Route path="subscription" element={<Subscription />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute role="tenant" />}>
            <Route path="/tenant" element={<TenantLayout />}>
              <Route index element={<TenantDashboard />} />
              <Route path="profile" element={<TenantProfile />} />
              <Route path="my-room" element={<MyRoom />} />
              <Route path="agreements" element={<TenantAgreements />} />
              <Route path="invoices" element={<TenantInvoices />} />
              <Route path="maintenance" element={<TenantMaintenance />} />
              <Route path="vacate" element={<VacateRequest />} />
              <Route path="messages" element={<TenantMessages />} />
              <Route path="notifications" element={<Notifications />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute role="admin" />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="owners" element={<Owners />} />
              <Route path="plans" element={<Plans />} />
              <Route path="settings" element={<IntegrationSettings />} />
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
