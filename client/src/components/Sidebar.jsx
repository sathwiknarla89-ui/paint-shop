import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Sidebar = () => {
  const { logout, user } = useContext(AuthContext);

  return (
    <div className="sidebar-wrapper d-flex flex-column no-print">
      <div className="sidebar-brand d-flex align-items-center">
        <span className="fs-4 me-2">🎨</span>
        <div>
          <h5 className="mb-0 fw-bold text-white">PaintShop</h5>
          <small className="text-muted" style={{ fontSize: '0.75rem' }}>Management System</small>
        </div>
      </div>

      <ul className="sidebar-menu flex-grow-1">
        <li>
          <NavLink to="/" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} end>
            <i className="bi bi-speedometer2"></i>
            <span>Dashboard</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/products" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <i className="bi bi-paint-bucket"></i>
            <span>Stock Management</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/billing" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <i className="bi bi-receipt-cutoff"></i>
            <span>Billing</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/customers" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <i className="bi bi-people-fill"></i>
            <span>Customers</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/sales" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <i className="bi bi-bar-chart-line-fill"></i>
            <span>Sales History</span>
          </NavLink>
        </li>
      </ul>

      <div className="p-3 border-top border-secondary border-opacity-25">
        <div className="d-flex align-items-center mb-3">
          <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center text-white fw-bold me-2" style={{ width: '36px', height: '36px' }}>
            {user?.username?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div className="overflow-hidden">
            <h6 className="mb-0 text-white text-truncate" style={{ fontSize: '0.9rem' }}>{user?.username || 'Admin'}</h6>
            <span className="text-muted" style={{ fontSize: '0.75rem' }}>Authorized User</span>
          </div>
        </div>
        <button
          onClick={logout}
          className="btn btn-outline-danger btn-sm w-100 rounded-pill py-2 fw-medium d-flex align-items-center justify-content-center gap-2"
        >
          <i className="bi bi-box-arrow-right"></i>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
