import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Loader from '../components/Loader';
import ConfirmModal from '../components/ConfirmModal';
import { toast } from 'react-toastify';

const SalesHistory = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering states
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Delete modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/invoices', {
        params: {
          search: searchTerm,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        },
      });
      setInvoices(response.data);
    } catch (err) {
      console.error('Error fetching invoices:', err);
      toast.error('Failed to load transaction billing history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [searchTerm, startDate, endDate]);

  const handleDeleteClick = (invoice) => {
    setInvoiceToDelete(invoice);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!invoiceToDelete) return;
    try {
      await axios.delete(`/api/invoices/${invoiceToDelete._id}`);
      toast.success('Invoice deleted and product stock quantities restored');
      setDeleteModalOpen(false);
      setInvoiceToDelete(null);
      fetchInvoices();
    } catch (err) {
      console.error('Error deleting invoice:', err);
      toast.error(err.response?.data?.message || 'Failed to delete invoice');
      setDeleteModalOpen(false);
    }
  };

  return (
    <div>
      {/* Search and Date Filter controls */}
      <div className="card border-0 shadow-sm p-4 mb-4" style={{ borderRadius: '16px' }}>
        <h5 className="fw-bold mb-3 text-dark">Filter Billing Ledger</h5>
        <div className="row g-3">
          {/* Text Search */}
          <div className="col-12 col-md-4">
            <label className="form-label small fw-semibold text-muted">Search Receipts</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0 rounded-start-pill ps-3">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control bg-light border-start-0 rounded-end-pill py-2"
                placeholder="Invoice #, customer name, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Start Date */}
          <div className="col-6 col-md-3">
            <label htmlFor="startDate" className="form-label small fw-semibold text-muted">From Date</label>
            <input
              type="date"
              id="startDate"
              className="form-control bg-light py-2 rounded-pill px-3"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          {/* End Date */}
          <div className="col-6 col-md-3">
            <label htmlFor="endDate" className="form-label small fw-semibold text-muted">To Date</label>
            <input
              type="date"
              id="endDate"
              className="form-control bg-light py-2 rounded-pill px-3"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          {/* Clear Button */}
          <div className="col-12 col-md-2 d-flex align-items-end">
            <button
              onClick={() => { setSearchTerm(''); setStartDate(''); setEndDate(''); }}
              className="btn btn-light w-100 rounded-pill py-2 fw-medium border shadow-sm"
              disabled={!searchTerm && !startDate && !endDate}
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Invoices List Table */}
      {loading && invoices.length === 0 ? (
        <Loader message="Fetching historical records..." />
      ) : invoices.length === 0 ? (
        <div className="card border-0 shadow-sm text-center py-5 rounded-4 bg-white">
          <div className="py-4">
            <i className="bi bi-journal-x fs-1 text-muted"></i>
            <h5 className="fw-bold text-dark mt-3">No Billings Found</h5>
            <p className="text-muted small">No transactions matched your specified search filters.</p>
          </div>
        </div>
      ) : (
          <>
            {/* Desktop Table View */}
            <div className="table-responsive border-0 shadow-sm rounded-4 d-none d-md-block">
              <table className="table table-hover align-middle mb-0 bg-white">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Invoice Number</th>
                    <th>Customer Name</th>
                    <th>Cart Volume</th>
                    <th>Grand Total</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice._id}>
                      <td>
                        <div className="fw-bold text-dark">
                          {new Date(invoice.date).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                        <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                          {new Date(invoice.date).toLocaleTimeString(undefined, {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>
                      <td>
                        <Link to={`/invoices/${invoice._id}`} className="fw-bold text-primary text-decoration-none">
                          {invoice.invoiceNumber}
                        </Link>
                      </td>
                      <td>
                        <div className="fw-medium text-dark">{invoice.customerName}</div>
                        {invoice.customerPhone && (
                          <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                            <i className="bi bi-telephone-fill me-1"></i>
                            {invoice.customerPhone}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border px-2.5 py-1.5 fw-medium">
                          {invoice.products?.reduce((sum, p) => sum + p.quantity, 0)} Items
                        </span>
                      </td>
                      <td>
                        <span className="fw-bold text-success" style={{ fontSize: '0.95rem' }}>
                          ${invoice.grandTotal.toFixed(2)}
                        </span>
                      </td>
                      <td className="text-end">
                        <div className="d-flex justify-content-end gap-2">
                          <Link
                            to={`/invoices/${invoice._id}`}
                            className="btn btn-outline-secondary btn-sm rounded-circle p-2"
                            title="View Full Invoice details"
                            style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <i className="bi bi-eye"></i>
                          </Link>
                          <button
                            onClick={() => handleDeleteClick(invoice)}
                            className="btn btn-outline-danger btn-sm rounded-circle p-2"
                            title="Delete and Revert Invoice"
                            style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="d-block d-md-none mb-3">
              {invoices.map((invoice) => (
                <div key={invoice._id} className="mobile-card">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <Link to={`/invoices/${invoice._id}`} className="fw-bold text-primary text-decoration-none">
                      {invoice.invoiceNumber}
                    </Link>
                    <span className="small text-muted">
                      {new Date(invoice.date).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>

                  <div className="mobile-card-field">
                    <span className="mobile-card-label">Customer</span>
                    <span className="mobile-card-value text-dark fw-semibold">
                      {invoice.customerName}
                    </span>
                  </div>

                  {invoice.customerPhone && (
                    <div className="mobile-card-field">
                      <span className="mobile-card-label">Phone</span>
                      <span className="mobile-card-value">
                        <a href={`tel:${invoice.customerPhone}`} className="fw-medium text-secondary text-decoration-none">
                          <i className="bi bi-telephone-fill me-1 small"></i>
                          {invoice.customerPhone}
                        </a>
                      </span>
                    </div>
                  )}

                  <div className="mobile-card-field">
                    <span className="mobile-card-label">Cart Items</span>
                    <span className="mobile-card-value badge bg-light text-dark border fw-medium" style={{ fontSize: '0.75rem' }}>
                      {invoice.products?.reduce((sum, p) => sum + p.quantity, 0)} Items
                    </span>
                  </div>

                  <div className="mobile-card-field">
                    <span className="mobile-card-label">Grand Total</span>
                    <span className="mobile-card-value text-success fw-bold">
                      ${invoice.grandTotal.toFixed(2)}
                    </span>
                  </div>

                  <div className="mobile-card-actions">
                    <Link
                      to={`/invoices/${invoice._id}`}
                      className="btn btn-outline-secondary btn-sm rounded-pill px-3 py-1.5 d-flex align-items-center gap-1"
                    >
                      <i className="bi bi-eye"></i> View Details
                    </Link>
                    <button
                      onClick={() => handleDeleteClick(invoice)}
                      className="btn btn-outline-danger btn-sm rounded-pill px-3 py-1.5 d-flex align-items-center gap-1"
                    >
                      <i className="bi bi-trash"></i> Revert & Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

      {/* Delete and Revert invoice confirmation modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Cancel & Revert Invoice"
        message={`Are you sure you want to delete invoice "${invoiceToDelete?.invoiceNumber}" billed to "${invoiceToDelete?.customerName}"? Deleting this receipt will automatically restore the quantities of the products inside back to stock inventory.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => { setDeleteModalOpen(false); setInvoiceToDelete(null); }}
      />
    </div>
  );
};

export default SalesHistory;
