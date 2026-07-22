import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center py-5 text-center min-vh-100 bg-light">
      <div className="card p-5 border-0 shadow-lg text-center" style={{ maxWidth: '480px', borderRadius: '20px' }}>
        <span className="fs-1 d-block mb-3">🎨</span>
        <h1 className="display-4 fw-bold text-primary mb-2">404</h1>
        <h4 className="fw-bold text-dark mb-3">Page Not Found</h4>
        <p className="text-muted small mb-4">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        <Link to="/" className="btn btn-primary rounded-pill py-2.5 px-4 fw-semibold d-inline-flex align-items-center gap-2 justify-content-center">
          <i className="bi bi-house-door-fill"></i>
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
