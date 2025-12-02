
import React from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { db } from './services/mockDb';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Settings from './pages/Settings';
import Customers from './pages/Customers';
import Vendors from './pages/Vendors';
import Banks from './pages/Banks';
import Payroll from './pages/Payroll';
import Inventory from './pages/Inventory';
import Expenses from './pages/Expenses';
import Sales from './pages/Sales';
import Purchases from './pages/Purchases';
import DebitCreditNotes from './pages/DebitCreditNotes';
import Receipts from './pages/Receipts';
import Payments from './pages/Payments';
import Journal from './pages/Journal';
import Contra from './pages/Contra';
import FiscalRollover from './pages/FiscalRollover';
import Maintenance from './pages/Maintenance';
import Reports from './pages/Reports';

const ProtectedRoute = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  
  if (isLoading) return <div className="h-screen w-full flex items-center justify-center bg-[#22273B] text-white">Loading Nexus ERP...</div>;
  
  if (!user) return <Navigate to="/login" replace />;

  // 1. Check Company Profile Requirement
  // If user has no company linked, force them to Settings (which will handle the specific Profile tab lock)
  if (!user.companyId) {
      if (location.pathname !== '/settings') {
          return <Navigate to="/settings" replace />;
      }
      return <Outlet />; // Render Settings page (which has internal logic to force Profile)
  }

  // 2. Check Fiscal Year Status (Block access if expired)
  const fiscalStatus = db.checkFiscalStatus();
  
  if (fiscalStatus === 'expired') {
      // If Admin -> Go to Rollover Page
      if (user.role === 'admin') {
          if (location.pathname !== '/fiscal-rollover') {
              return <Navigate to="/fiscal-rollover" replace />;
          }
          return <Outlet />; // Render FiscalRollover
      } else {
          // If User -> Go to Maintenance Page
          if (location.pathname !== '/maintenance') {
              return <Navigate to="/maintenance" replace />;
          }
          return <Outlet />; // Render Maintenance
      }
  }

  // If status is active, ensure they aren't stuck on maintenance pages
  if ((location.pathname === '/fiscal-rollover' || location.pathname === '/maintenance') && fiscalStatus === 'active') {
      return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="/fiscal-rollover" element={<FiscalRollover />} />
            <Route path="/maintenance" element={<Maintenance />} />
            
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              
              {/* Accounting */}
              <Route path="/receipts" element={<Receipts />} />
              <Route path="/payments" element={<Payments />} />
              <Route path="/journal" element={<Journal />} />
              <Route path="/contra" element={<Contra />} />
              
              {/* Trading */}
              <Route path="/sales" element={<Sales />} />
              <Route path="/purchases" element={<Purchases />} />
              <Route path="/debit-credit-notes" element={<DebitCreditNotes />} />
              
              {/* People & Inventory */}
              <Route path="/customers" element={<Customers />} />
              <Route path="/vendors" element={<Vendors />} />
              <Route path="/inventory" element={<Inventory />} />
              
              {/* Payroll */}
              <Route path="/payroll" element={<Payroll />} />
              
              {/* Finance */}
              <Route path="/banks" element={<Banks />} />
              <Route path="/expenses" element={<Expenses />} />
              
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}

export default App;
