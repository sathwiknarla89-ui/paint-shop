import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Loader from '../components/Loader';
import { toast } from 'react-toastify';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchCustomers = async () => {
    try {
      const response = await axios.get('/api/customers', {
        params: { search: searchTerm },
      });
      setCustomers(response.data);
    } catch (err) {
      console.error('Error fetching customers:', err);
      toast.error('Failed to load customer profiles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [searchTerm]);

  if (loading && customers.length === 0) return <Loader message="Loading client database..." />;

  return (
    <div>
      {/* Search Header */}
      <div className="card border-0 shadow-sm p-4 mb-4" style={{ borderRadius: '16px' }}>
        <div className="row g-3 align-items-center">
          <div className="col-12 col-md-6">
            <h5 className="fw-bold mb-0 text-dark">Customer Directory & Ledgers</h5>
            <p className="text-muted small mb-0">Track customer loyalty, bill details, and aggregate purchases</p>
          </div>
          <div className="col-12 col-md-6">
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0 rounded-start-pill ps-3">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control bg-light border-start-0 rounded-end-pill py-2"
                placeholder="Search customers by name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Customers List Table */}
      {customers.length === 0 ? (
        <div className="card border-0 shadow-sm text-center py-5 rounded-4 bg-white">
          <div className="py-4">
            <i className="bi bi-people fs-1 text-muted"></i>
            <h5 className="fw-bold text-dark mt-3">No Customers Logged</h5>
            <p className="text-muted small">New customer accounts are automatically spawned when billing new invoices.</p>
            {searchTerm && (
              <button className="btn btn-outline-primary btn-sm rounded-pill px-4 mt-2" onClick={() => setSearchTerm('')}>
                Clear Search
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="table-responsive border-0 shadow-sm rounded-4 d-none d-md-block">
            <table className="table table-hover align-middle mb-0 bg-white">
              <thead>
                <tr>
                  <th>Customer Name</th>
                  <th>Phone Number</th>
                  <th>Invoices Settled</th>
                  <th>Lifetime Purchases</th>
                  <th>Last Purchase Date</th>
                  <th className="text-end">Ledger Account</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((cust) => (
                  <tr key={cust._id}>
                    <td>
                      <div className="fw-bold text-dark">{cust.name}</div>
                    </td>
                    <td>
                      {cust.phone ? (
                        <span className="fw-medium text-secondary">
                          <i className="bi bi-telephone-fill me-1 small"></i>
                          {cust.phone}
                        </span>
                      ) : (
                        <span className="text-muted small">N/A</span>
                      )}
                    </td>
                    <td>
                      <span className="badge bg-light text-primary border px-2.5 py-1.5 fw-semibold">
                        <i className="bi bi-file-earmark-text me-1"></i>
                        {cust.bills?.length || 0} Bills
                      </span>
                    </td>
                    <td>
                      <span className="fw-bold text-success" style={{ fontSize: '0.95rem' }}>
                        ${(cust.totalPurchases || 0).toFixed(2)}
                      </span>
                    </td>
                    <td>
                      {cust.lastPurchaseDate ? (
                        <div className="small fw-medium text-dark">
                          {new Date(cust.lastPurchaseDate).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                      ) : (
                        <span className="text-muted small">No purchases recorded</span>
                      )}
                    </td>
                    <td className="text-end">
                      <Link
                        to={`/customers/${cust._id}`}
                        className="btn btn-outline-primary btn-sm rounded-pill px-3 fw-medium"
                      >
                        <i className="bi bi-folder2-open me-1"></i>
                        View Bills
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="d-block d-md-none mb-3">
            {customers.map((cust) => (
              <div key={cust._id} className="mobile-card">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div className="mobile-card-title">{cust.name}</div>
                  <span className="badge bg-light text-primary border px-2.5 py-1 fw-semibold" style={{ fontSize: '0.75rem' }}>
                    <i className="bi bi-file-earmark-text me-1"></i>
                    {cust.bills?.length || 0} Bills
                  </span>
                </div>

                <div className="mobile-card-field">
                  <span className="mobile-card-label">Phone</span>
                  <span className="mobile-card-value">
                    {cust.phone ? (
                      <a href={`tel:${cust.phone}`} className="fw-medium text-secondary text-decoration-none">
                        <i className="bi bi-telephone-fill me-1 small"></i>
                        {cust.phone}
                      </a>
                    ) : (
                      <span className="text-muted small">N/A</span>
                    )}
                  </span>
                </div>

                <div className="mobile-card-field">
                  <span className="mobile-card-label">Lifetime Purchases</span>
                  <span className="mobile-card-value text-success fw-bold">
                    ${(cust.totalPurchases || 0).toFixed(2)}
                  </span>
                </div>

                <div className="mobile-card-field">
                  <span className="mobile-card-label">Last Purchase</span>
                  <span className="mobile-card-value text-muted small">
                    {cust.lastPurchaseDate ? (
                      new Date(cust.lastPurchaseDate).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    ) : (
                      <span>No purchases</span>
                    )}
                  </span>
                </div>

                <div className="mobile-card-actions">
                  <Link
                    to={`/customers/${cust._id}`}
                    className="btn btn-outline-primary btn-sm rounded-pill px-4 py-2 fw-medium w-100 text-center d-block"
                  >
                    <i className="bi bi-folder2-open me-1"></i>
                    View Bills & Ledger
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Customers;
