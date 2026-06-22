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
import PurchaseInvoices from './pages/purchases/PurchaseInvoices';
import PurchaseReturns from './pages/purchases/PurchaseReturns';
import Production from './pages/Production';
import Reports from './pages/Reports';
import SettingsPage from './pages/Settings';
import Support from './pages/Support';
import Employees from './pages/Employees';
import Admins from './pages/Admins';
import Leads from './pages/Leads';
import Expenses from './pages/Expenses';

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
import Groups from './pages/parties/Groups';

// ── Sales ────────────────────────────────────────────────────────
import Estimates from './pages/sales/Estimates';
import SalesInvoices from './pages/sales/SalesInvoices';
import DeliveryChallans from './pages/sales/DeliveryChallans';
import SalesReturns from './pages/sales/SalesReturns';
import CreditNote from './pages/sales/CreditNote';

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
  return <div className="so-module-page so-legacy-page">{children}</div>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />

      <Route path="/app" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<AppIndexRedirect />} />

        {/* Dashboard */}
        <Route path="dashboard" element={<RoleRoute path="/app/dashboard"><P><Dashboard /></P></RoleRoute>} />

        {/* Live Location */}
        <Route path="tracking" element={<RoleRoute path="/app/tracking"><P><LiveTracking /></P></RoleRoute>} />

        {/* ── INVENTORY ── */}
        <Route path="inventory">
          <Route index element={<Navigate to="items" replace />} />
          <Route path="items"      element={<RoleRoute path="/app/inventory/items"><Items /></RoleRoute>} />
          <Route path="warehouses" element={<RoleRoute path="/app/inventory/warehouses"><Warehouses /></RoleRoute>} />
          <Route path="price-list" element={<RoleRoute path="/app/inventory/price-list"><PriceList /></RoleRoute>} />
          <Route path="transfers"  element={<RoleRoute path="/app/inventory/transfers"><TransferOrders /></RoleRoute>} />
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
          <Route path="groups"         element={<RoleRoute path="/app/parties/groups"><P><Groups /></P></RoleRoute>} />
        </Route>

        {/* ── SALES ── */}
        <Route path="sales">
          <Route index element={<Navigate to="estimates" replace />} />
          <Route path="estimates"         element={<RoleRoute path="/app/sales/estimates"><P><Estimates /></P></RoleRoute>} />
          <Route path="orders"            element={<RoleRoute path="/app/sales/orders"><P><Orders /></P></RoleRoute>} />
          <Route path="invoices"          element={<RoleRoute path="/app/sales/invoices"><P><SalesInvoices /></P></RoleRoute>} />
          <Route path="delivery-challans" element={<RoleRoute path="/app/sales/delivery-challans"><P><DeliveryChallans /></P></RoleRoute>} />
          <Route path="returns"           element={<RoleRoute path="/app/sales/returns"><P><SalesReturns /></P></RoleRoute>} />
          <Route path="credit-note"       element={<RoleRoute path="/app/sales/credit-note"><P><CreditNote /></P></RoleRoute>} />
        </Route>

        {/* ── PURCHASES ── */}
        <Route path="purchases">
          <Route index element={<Navigate to="orders" replace />} />
          <Route path="orders"   element={<RoleRoute path="/app/purchases/orders"><P><Purchases /></P></RoleRoute>} />
          <Route path="invoices" element={<RoleRoute path="/app/purchases/invoices"><P><PurchaseInvoices /></P></RoleRoute>} />
          <Route path="returns"  element={<RoleRoute path="/app/purchases/returns"><P><PurchaseReturns /></P></RoleRoute>} />
        </Route>
        <Route path="production">
          <Route index element={<Navigate to="production-orders" replace />} />
          <Route path="grm" element={<RoleRoute path="/app/production"><P><Production /></P></RoleRoute>} />
          <Route path="bom" element={<RoleRoute path="/app/production"><P><Production /></P></RoleRoute>} />
          <Route path="work-orders" element={<RoleRoute path="/app/production"><P><Production /></P></RoleRoute>} />
          <Route path="production-orders" element={<RoleRoute path="/app/production"><P><Production /></P></RoleRoute>} />
        </Route>

        {/* Van Sales */}
        <Route path="van-sales" element={<RoleRoute path="/app/van-sales"><P><VanSales /></P></RoleRoute>} />

        {/* Finance */}
        <Route path="payments">
          <Route index element={<Navigate to="in" replace />} />
          <Route path="in"  element={<RoleRoute path="/app/payments"><P><Payments /></P></RoleRoute>} />
          <Route path="out" element={<RoleRoute path="/app/payments"><P><Payments /></P></RoleRoute>} />
        </Route>
        <Route path="invoices"  element={<RoleRoute path="/app/invoices"><P><Invoices /></P></RoleRoute>} />
        <Route path="reports"   element={<RoleRoute path="/app/reports"><P><Reports /></P></RoleRoute>} />

        {/* ── ROUTES ── */}
        <Route path="routes">
          <Route index element={<Navigate to="regions" replace />} />
          <Route path="regions" element={<RoleRoute path="/app/routes/regions"><P><Regions /></P></RoleRoute>} />
          <Route path="cities"  element={<RoleRoute path="/app/routes/cities"><P><Cities /></P></RoleRoute>} />
          <Route path="areas"   element={<RoleRoute path="/app/routes/areas"><P><Areas /></P></RoleRoute>} />
        </Route>

        {/* Attendance */}
        <Route path="attendance" element={<RoleRoute path="/app/attendance"><P><Attendance /></P></RoleRoute>} />

        {/* Users & Targets */}
        <Route path="employees" element={<RoleRoute path="/app/employees"><P><Employees /></P></RoleRoute>} />
        <Route path="admins"    element={<RoleRoute path="/app/admins"><P><Admins /></P></RoleRoute>} />
        <Route path="targets"   element={<RoleRoute path="/app/targets"><P><Targets /></P></RoleRoute>} />

        {/* Settings & Support */}
        <Route path="settings" element={<RoleRoute path="/app/settings"><P><SettingsPage /></P></RoleRoute>} />
        <Route path="support"  element={<RoleRoute path="/app/support"><P><Support /></P></RoleRoute>} />
        <Route path="expenses" element={<RoleRoute path="/app/expenses"><P><Expenses /></P></RoleRoute>} />
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
