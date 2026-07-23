import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Header = ({ toggleSidebar }) => {
  const { logout, user } = useContext(AuthContext);
  const location = useLocation();

  // Determine current page title based on path
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard Overview';
    if (path.startsWith('/products/add')) return 'Add Paint Product';
    if (path.startsWith('/products/edit')) return 'Edit Paint Product';
    if (path.startsWith('/products')) return 'Paint Stock Management';
    if (path.startsWith('/billing/edit')) return 'Edit Invoice Details';
    if (path.startsWith('/billing')) return 'Invoice Billing Desk';
    if (path.startsWith('/customers/')) return 'Customer Transaction Details';
    if (path.startsWith('/customers')) return 'Customer Transaction Directory';
    if (path.startsWith('/sales')) return 'Sales Billing Ledger';
    if (path.startsWith('/invoices/')) return 'Invoice Details Receipt';
    return 'Management Portal';
  };

  return (
    <nav className="navbar navbar-expand-lg top-navbar no-print">
      <div className="container-fluid px-0">
        {/* Toggle Button for Mobile Sidebar */}
        <button
          className="btn btn-light d-lg-none me-3"
          type="button"
          onClick={toggleSidebar}
          aria-label="Toggle Sidebar"
        >
          <i className="bi bi-list fs-4"></i>
        </button>

        {/* Dynamic Title */}
        <span className="navbar-brand mb-0 h1 fw-bold text-dark d-none d-sm-inline-block">
          {getPageTitle()}
        </span>
        <span className="navbar-brand mb-0 h2 fw-bold text-dark d-sm-none" style={{ fontSize: '1.1rem' }}>
          {getPageTitle()}
        </span>

        {/* Right Side Icons & Profile */}
        <div className="ms-auto d-flex align-items-center gap-3">
          {/* Quick Stats Notification (e.g. low stock warning) */}
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-light text-dark border rounded-pill px-3 py-2 fw-medium d-none d-md-flex align-items-center gap-1">
              <i className="bi bi-calendar3 text-primary"></i>
              {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>

          <div className="vr d-none d-md-block" style={{ height: '24px' }}></div>

          <div className="dropdown">
            <button
              className="btn btn-light rounded-pill dropdown-toggle d-flex align-items-center gap-2 px-3 py-1.5"
              type="button"
              id="userMenuButton"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <i className="bi bi-person-circle fs-5 text-primary"></i>
              <span className="fw-medium" style={{ fontSize: '0.9rem' }}>{user?.username}</span>
            </button>
            <ul className="dropdown-menu dropdown-menu-end shadow border-0 mt-2" aria-labelledby="userMenuButton" style={{ borderRadius: '12px' }}>
              <li>
                <div className="dropdown-header text-muted">Signed in as <br /><strong className="text-dark">{user?.username}</strong></div>
              </li>
              <li><hr className="dropdown-divider" /></li>
              <li>
                <Link to="/" className="dropdown-item d-flex align-items-center gap-2">
                  <i className="bi bi-speedometer2 text-muted"></i>
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/products" className="dropdown-item d-flex align-items-center gap-2">
                  <i className="bi bi-paint-bucket text-muted"></i>
                  Manage Stock
                </Link>
              </li>
              <li><hr className="dropdown-divider" /></li>
              <li>
                <button
                  onClick={logout}
                  className="dropdown-item text-danger d-flex align-items-center gap-2"
                >
                  <i className="bi bi-box-arrow-right"></i>
                  Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
