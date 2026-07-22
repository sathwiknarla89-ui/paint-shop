import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Loader from '../components/Loader';
import SalesChart from '../components/SalesChart';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('/api/dashboard/stats');
        setStats(response.data);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError('Failed to fetch dashboard data. Make sure backend is running.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <Loader message="Fetching shop metrics..." />;

  if (error) {
    return (
      <div className="alert alert-danger shadow-sm border-0 rounded-4 p-4" role="alert">
        <h5 className="alert-heading fw-bold d-flex align-items-center gap-2">
          <i className="bi bi-exclamation-octagon-fill"></i>
          Connection Error
        </h5>
        <p className="mb-0 mt-2">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="btn btn-outline-danger btn-sm mt-3 px-3 rounded-pill fw-medium"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const {
    totalProducts,
    totalStock,
    todaySales,
    totalCustomers,
    lowStockProducts,
    monthlySales,
  } = stats;

  return (
    <div>
      {/* Metrics Row */}
      <div className="row g-4 mb-4">
        {/* Total Products */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card metric-card h-100 p-3">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted fw-semibold small text-uppercase">Total Catalog</span>
                <h3 className="mb-0 fw-bold mt-1 text-dark">{totalProducts}</h3>
                <small className="text-muted">Unique Paint Items</small>
              </div>
              <div className="metric-icon-box bg-primary bg-opacity-10 text-primary">
                <i className="bi bi-paint-bucket"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Total Stock Volume */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card metric-card secondary h-100 p-3">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted fw-semibold small text-uppercase">Total Stock Volume</span>
                <h3 className="mb-0 fw-bold mt-1 text-dark">{totalStock}</h3>
                <small className="text-muted">Liters/Units in Store</small>
              </div>
              <div className="metric-icon-box bg-secondary bg-opacity-10 text-secondary">
                <i className="bi bi-boxes"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Revenue */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card metric-card success h-100 p-3">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted fw-semibold small text-uppercase">Today's Revenue</span>
                <h3 className="mb-0 fw-bold mt-1 text-success">${todaySales.toFixed(2)}</h3>
                <small className="text-muted">Direct Counter Sales</small>
              </div>
              <div className="metric-icon-box bg-success bg-opacity-10 text-success">
                <i className="bi bi-currency-dollar"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Total Customers */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card metric-card info h-100 p-3">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted fw-semibold small text-uppercase">Total Customers</span>
                <h3 className="mb-0 fw-bold mt-1 text-dark">{totalCustomers}</h3>
                <small className="text-muted">Customer Accounts</small>
              </div>
              <div className="metric-icon-box bg-info bg-opacity-10 text-info">
                <i className="bi bi-people"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Sales Chart */}
        <div className="col-12 col-lg-8">
          <div className="card h-100 border-0 p-4 shadow-sm" style={{ borderRadius: '16px' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h5 className="fw-bold text-dark mb-1">Monthly Revenue Performance</h5>
                <p className="text-muted small mb-0">Overview of aggregated monthly counter collections</p>
              </div>
              <Link to="/sales" className="btn btn-light btn-sm rounded-pill px-3 fw-semibold">
                View Invoices
              </Link>
            </div>
            <div className="py-2">
              <SalesChart data={monthlySales} />
            </div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="col-12 col-lg-4">
          <div className="card h-100 border-0 p-4 shadow-sm" style={{ borderRadius: '16px' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="fw-bold text-dark mb-1">Low Stock Alerts</h5>
                <p className="text-muted small mb-0">Paint items with stock less than 10 units</p>
              </div>
              <span className="badge bg-danger bg-opacity-10 text-danger rounded-pill px-2.5 py-1.5 fw-semibold">
                {lowStockProducts.length} Alert{lowStockProducts.length !== 1 ? 's' : ''}
              </span>
            </div>

            {lowStockProducts.length === 0 ? (
              <div className="d-flex flex-column align-items-center justify-content-center flex-grow-1 text-center py-5">
                <i className="bi bi-check-circle-fill text-success fs-1 mb-2"></i>
                <h6 className="fw-bold text-dark">All Stock Levels Normal</h6>
                <p className="text-muted small mb-0">No paint items are currently running low.</p>
              </div>
            ) : (
              <div className="d-flex flex-column justify-content-between h-100">
                <div className="list-group list-group-flush overflow-auto" style={{ maxHeight: '230px' }}>
                  {lowStockProducts.map((prod) => (
                    <div key={prod._id} className="list-group-item px-0 py-2.5 border-bottom border-light">
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="text-truncate me-2">
                          <h6 className="mb-0 fw-semibold text-dark text-truncate" style={{ fontSize: '0.9rem' }}>
                            {prod.name}
                          </h6>
                          <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                            {prod.brand} • {prod.size} • {prod.colour}
                          </small>
                        </div>
                        <div className="text-end flex-shrink-0">
                          <span className={`badge ${prod.quantity === 0 ? 'bg-danger' : 'bg-warning'} text-dark fw-bold rounded-pill px-2.5 py-1`}>
                            {prod.quantity} Left
                          </span>
                          <div>
                            <Link to={`/products`} className="text-primary small text-decoration-none" style={{ fontSize: '0.75rem' }}>
                              Update Stock
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-top border-light">
                  <Link to="/products" className="btn btn-outline-primary btn-sm w-100 rounded-pill py-2 fw-medium">
                    Manage Inventory
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
