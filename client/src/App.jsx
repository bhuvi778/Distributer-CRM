import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import CanAccess from './components/common/CanAccess';
import Layout from './components/layout/Layout';

// ── Core pages ──────────────────────────────────────────────────
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LiveTracking from './pages/LiveTracking';
import Attendance from './pages/Attendance';
import VanSales from './pages/VanSales';
import Targets from './pages/Targets';
import Payments from './pages/Payments';
import Invoices from './pages/Invoices';
import Orders from './pages/Orders';
import Purchases from './pages/Purchases';
import Production from './pages/Production';
import Reports from './pages/Reports';
import SettingsPage from './pages/Settings';
import Support from './pages/Support';
import Employees from './pages/Employees';
import Admins from './pages/Admins';
import Leads from './pages/Leads';

// ── Inventory ────────────────────────────────────────────────────
import Items from './pages/inventory/Items';
import Warehouses from './pages/inventory/Warehouses';
import PriceList from './pages/inventory/PriceList';
import TransferOrders from './pages/inventory/TransferOrders';

// ── Parties ─────────────────────────────────────────────────────
import Customers from './pages/parties/Customers';
import Distributors from './pages/parties/Distributors';
import SuperStockers from './pages/parties/SuperStockers';
import Suppliers from './pages/parties/Suppliers';
import Visited from './pages/parties/Visited';

// ── Sales ────────────────────────────────────────────────────────
import Estimates from './pages/sales/Estimates';
import DeliveryChallans from './pages/sales/DeliveryChallans';
import SalesReturns from './pages/sales/SalesReturns';

// ── Routes ───────────────────────────────────────────────────────
import Regions from './pages/routes/Regions';
import Cities from './pages/routes/Cities';
import Areas from './pages/routes/Areas';

// ── Guards ──────────────────────────────────────────────────────
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-[#9e9e9e] text-sm">Loading…</div>;
  return user ? children : <Navigate to="/login" replace />;
}

function RoleRoute({ path, children }) {
  return <CanAccess path={path}>{children}</CanAccess>;
}

function AppIndexRedirect() {
  const { defaultPath } = useAuth();
  return <Navigate to={defaultPath} replace />;
}

function RootRedirect() {
  const { user, loading, defaultPath } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-[#9e9e9e] text-sm">Loading…</div>;
  return <Navigate to={user ? defaultPath : '/login'} replace />;
}

// Wrap a page with so-page padding
function P({ children }) {
  return <div className="p-5 max-w-full">{children}</div>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />

      <Route path="/app" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<AppIndexRedirect />} />

        {/* Dashboard */}
        <Route path="dashboard" element={<RoleRoute path="/app/dashboard"><Dashboard /></RoleRoute>} />

        {/* Live Location */}
        <Route path="tracking" element={<RoleRoute path="/app/tracking"><LiveTracking /></RoleRoute>} />

        {/* ── INVENTORY ── */}
        <Route path="inventory">
          <Route index element={<Navigate to="items" replace />} />
          <Route path="items"      element={<RoleRoute path="/app/inventory/items"><P><Items /></P></RoleRoute>} />
          <Route path="warehouses" element={<RoleRoute path="/app/inventory/warehouses"><P><Warehouses /></P></RoleRoute>} />
          <Route path="price-list" element={<RoleRoute path="/app/inventory/price-list"><P><PriceList /></P></RoleRoute>} />
          <Route path="transfers"  element={<RoleRoute path="/app/inventory/transfers"><P><TransferOrders /></P></RoleRoute>} />
        </Route>

        {/* Leads */}
        <Route path="leads" element={<RoleRoute path="/app/leads"><P><Leads /></P></RoleRoute>} />

        {/* ── PARTIES ── */}
        <Route path="parties">
          <Route index element={<Navigate to="customers" replace />} />
          <Route path="customers"      element={<RoleRoute path="/app/parties/customers"><P><Customers /></P></RoleRoute>} />
          <Route path="distributors"   element={<RoleRoute path="/app/parties/distributors"><P><Distributors /></P></RoleRoute>} />
          <Route path="super-stockers" element={<RoleRoute path="/app/parties/super-stockers"><P><SuperStockers /></P></RoleRoute>} />
          <Route path="suppliers"      element={<RoleRoute path="/app/parties/suppliers"><P><Suppliers /></P></RoleRoute>} />
          <Route path="visited"        element={<RoleRoute path="/app/parties/visited"><P><Visited /></P></RoleRoute>} />
        </Route>

        {/* ── SALES ── */}
        <Route path="sales">
          <Route index element={<Navigate to="estimates" replace />} />
          <Route path="estimates"         element={<RoleRoute path="/app/sales/estimates"><P><Estimates /></P></RoleRoute>} />
          <Route path="orders"            element={<RoleRoute path="/app/sales/orders"><P><Orders /></P></RoleRoute>} />
          <Route path="invoices"          element={<RoleRoute path="/app/sales/invoices"><P><Invoices /></P></RoleRoute>} />
          <Route path="delivery-challans" element={<RoleRoute path="/app/sales/delivery-challans"><P><DeliveryChallans /></P></RoleRoute>} />
          <Route path="returns"           element={<RoleRoute path="/app/sales/returns"><P><SalesReturns /></P></RoleRoute>} />
        </Route>

        {/* ── PURCHASES ── */}
        <Route path="purchases"  element={<RoleRoute path="/app/purchases"><Purchases /></RoleRoute>} />
        <Route path="production" element={<RoleRoute path="/app/production"><Production /></RoleRoute>} />

        {/* Van Sales */}
        <Route path="van-sales" element={<RoleRoute path="/app/van-sales"><VanSales /></RoleRoute>} />

        {/* Finance */}
        <Route path="payments" element={<RoleRoute path="/app/payments"><Payments /></RoleRoute>} />
        <Route path="invoices"  element={<RoleRoute path="/app/invoices"><Invoices /></RoleRoute>} />
        <Route path="reports"   element={<RoleRoute path="/app/reports"><Reports /></RoleRoute>} />

        {/* ── ROUTES ── */}
        <Route path="routes">
          <Route index element={<Navigate to="regions" replace />} />
          <Route path="regions" element={<RoleRoute path="/app/routes/regions"><P><Regions /></P></RoleRoute>} />
          <Route path="cities"  element={<RoleRoute path="/app/routes/cities"><P><Cities /></P></RoleRoute>} />
          <Route path="areas"   element={<RoleRoute path="/app/routes/areas"><P><Areas /></P></RoleRoute>} />
        </Route>

        {/* Attendance */}
        <Route path="attendance" element={<RoleRoute path="/app/attendance"><Attendance /></RoleRoute>} />

        {/* Users & Targets */}
        <Route path="employees" element={<RoleRoute path="/app/employees"><Employees /></RoleRoute>} />
        <Route path="admins"    element={<RoleRoute path="/app/admins"><Admins /></RoleRoute>} />
        <Route path="targets"   element={<RoleRoute path="/app/targets"><Targets /></RoleRoute>} />

        {/* Settings & Support */}
        <Route path="settings" element={<RoleRoute path="/app/settings"><SettingsPage /></RoleRoute>} />
        <Route path="support"  element={<RoleRoute path="/app/support"><Support /></RoleRoute>} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
