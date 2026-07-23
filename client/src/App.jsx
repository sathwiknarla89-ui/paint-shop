import React, { useContext, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Components
import Sidebar from './components/Sidebar';
import Header from './components/Header';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import AddEditProduct from './pages/AddEditProduct';
import Billing from './pages/Billing';
import Customers from './pages/Customers';
import CustomerDetails from './pages/CustomerDetails';
import SalesHistory from './pages/SalesHistory';
import InvoiceDetails from './pages/InvoiceDetails';
import NotFound from './pages/NotFound';

// Private Route Wrapper Component
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
        <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Validating credentials...</span>
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Main App Layout Wrapper
const AppLayout = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setMobileSidebarOpen(!mobileSidebarOpen);
  };

  return (
    <div className="main-wrapper">
      {/* Mobile Sidebar overlay backdrop */}
      {mobileSidebarOpen && (
        <div
          className="modal-backdrop fade show d-lg-none"
          style={{ zIndex: 998 }}
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Sidebar Navigation */}
      <div
        className={`sidebar-container d-lg-block ${mobileSidebarOpen ? 'show' : ''}`}
        style={{
          position: 'relative',
          zIndex: 999,
        }}
      >
        <Sidebar closeSidebar={() => setMobileSidebarOpen(false)} />
      </div>

      {/* Primary Page Panel */}
      <div className="content-wrapper d-flex flex-column" style={{ minWidth: 0 }}>
        <Header toggleSidebar={toggleSidebar} />
        
        {/* Main nested route page container */}
        <div className="container-fluid px-0 flex-grow-1">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/add" element={<AddEditProduct />} />
            <Route path="/products/edit/:id" element={<AddEditProduct />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/customers/:id" element={<CustomerDetails />} />
            <Route path="/sales" element={<SalesHistory />} />
            <Route path="/invoices/:id" element={<InvoiceDetails />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Authentication Gate */}
          <Route path="/login" element={<Login />} />
          
          {/* Private Management Screens */}
          <Route
            path="/*"
            element={
              <PrivateRoute>
                <AppLayout />
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </AuthProvider>
  );
};

export default App;
