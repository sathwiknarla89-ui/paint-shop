import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import Loader from '../components/Loader';
import { toast } from 'react-toastify';

const CustomerDetails = () => {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomerDetails = async () => {
      try {
        const response = await axios.get(`/api/customers/${id}`);
        setCustomer(response.data);
      } catch (err) {
        console.error('Error fetching customer details:', err);
        toast.error('Failed to load customer profile history');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerDetails();
  }, [id]);

  if (loading) return <Loader message="Fetching client account history..." />;

  if (!customer) {
    return (
      <div className="alert alert-danger shadow-sm border-0 rounded-4 p-4 text-center">
        <i className="bi bi-x-circle fs-1 mb-2"></i>
        <h5 className="fw-bold">Customer Account Not Found</h5>
        <p className="mb-0">The requested customer record does not exist or has been deleted.</p>
        <Link to="/customers" className="btn btn-outline-danger btn-sm mt-3 px-4 rounded-pill">
          Back to Directory
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Navigation Header */}
      <div className="d-flex align-items-center mb-4">
        <Link to="/customers" className="btn btn-light rounded-circle p-2 me-3 shadow-sm no-print" style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="bi bi-arrow-left"></i>
        </Link>
        <h4 className="fw-bold mb-0 text-dark">Customer Account Ledger</h4>
      </div>

      <div className="row g-4 mb-4">
        {/* Customer Profile Card */}
        <div className="col-12 col-md-5">
          <div className="card border-0 shadow-sm p-4 bg-white h-100" style={{ borderRadius: '16px' }}>
            <div className="d-flex align-items-center gap-3 mb-4">
              <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold fs-4" style={{ width: '56px', height: '56px' }}>
                {customer.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h5 className="fw-bold mb-1 text-dark">{customer.name}</h5>
                {customer.phone ? (
                  <span className="text-secondary small fw-medium">
                    <i className="bi bi-telephone-fill me-1"></i>
                    {customer.phone}
                  </span>
                ) : (
                  <span className="text-muted small italic">No phone contact saved</span>
                )}
              </div>
            </div>

            <div className="d-flex flex-column gap-3">
              <div className="d-flex justify-content-between align-items-center border-bottom pb-2">
                <span className="text-muted small fw-medium">Lifetime Revenue:</span>
                <span className="fw-bold text-success fs-5">${customer.totalPurchases.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center border-bottom pb-2">
                <span className="text-muted small fw-medium">Total Invoices Settled:</span>
                <span className="badge bg-light text-dark border px-2.5 py-1.5 fw-semibold">{customer.bills?.length || 0} Bills</span>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-muted small fw-medium">Last Purchase Date:</span>
                <span className="fw-medium text-dark">
                  {customer.lastPurchaseDate ? (
                    new Date(customer.lastPurchaseDate).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  ) : (
                    'N/A'
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Aggregate helper block */}
        <div className="col-12 col-md-7">
          <div className="card border-0 shadow-sm p-4 bg-white h-100 d-flex flex-column justify-content-center" style={{ borderRadius: '16px' }}>
            <h6 className="fw-bold text-muted small text-uppercase">Valued Client Note</h6>
            <blockquote className="blockquote text-secondary mt-2 fs-6" style={{ borderLeft: '3px solid var(--primary-color)', paddingLeft: '15px' }}>
              "Total purchases are calculated as the sum of all checked-out receipts. Deleted invoices will automatically update customer historical tallies."
            </blockquote>
          </div>
        </div>
      </div>

      {/* Transaction History Invoice Table */}
      <div className="card border-0 shadow-sm p-4 bg-white" style={{ borderRadius: '16px' }}>
        <h5 className="fw-bold text-dark mb-4">Invoice Billing History</h5>

        {customer.bills?.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-file-earmark-x fs-1 text-muted"></i>
            <h6 className="fw-bold text-dark mt-3">No Billings Registered</h6>
            <p className="text-muted small">No transactions are associated with this client profile.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="table-responsive border-0 shadow-none d-none d-md-block">
              <table className="table align-middle table-hover">
                <thead className="table-light">
                  <tr>
                    <th>Invoice Number</th>
                    <th>Date</th>
                    <th>Products Purchased</th>
                    <th>Subtotal</th>
                    <th>GST Amount</th>
                    <th>Grand Total</th>
                    <th className="text-end">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {customer.bills.map((bill) => (
                    <tr key={bill._id}>
                      <td>
                        <Link to={`/invoices/${bill._id}`} className="fw-bold text-primary text-decoration-none">
                          {bill.invoiceNumber}
                        </Link>
                      </td>
                      <td>
                        <span className="small text-muted">
                          {new Date(bill.date).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </td>
                      <td>
                        <div className="text-truncate" style={{ maxWidth: '200px' }} title={bill.products?.map((p) => `${p.name} (x${p.quantity})`).join(', ')}>
                          <span className="small fw-medium text-dark">
                            {bill.products?.map((p) => `${p.name} (x${p.quantity})`).join(', ')}
                          </span>
                        </div>
                      </td>
                      <td>${bill.subtotal?.toFixed(2)}</td>
                      <td>
                        <span className="text-muted small">${bill.gstAmount?.toFixed(2)} ({bill.gstPercent}%)</span>
                      </td>
                      <td className="fw-bold text-success">${bill.grandTotal?.toFixed(2)}</td>
                      <td className="text-end">
                        <Link to={`/invoices/${bill._id}`} className="btn btn-outline-secondary btn-sm rounded-pill px-3 fw-medium">
                          <i className="bi bi-eye-fill me-1"></i>
                          Open Receipt
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="d-block d-md-none">
              {customer.bills.map((bill) => (
                <div key={bill._id} className="mobile-card">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <Link to={`/invoices/${bill._id}`} className="fw-bold text-primary text-decoration-none">
                      {bill.invoiceNumber}
                    </Link>
                    <span className="small text-muted">
                      {new Date(bill.date).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>

                  <div className="mobile-card-field">
                    <span className="mobile-card-label">Products</span>
                    <span className="mobile-card-value text-end text-truncate" style={{ maxWidth: '65%' }} title={bill.products?.map((p) => `${p.name} (x${p.quantity})`).join(', ')}>
                      {bill.products?.map((p) => `${p.name} (x${p.quantity})`).join(', ')}
                    </span>
                  </div>

                  <div className="mobile-card-field">
                    <span className="mobile-card-label">Subtotal</span>
                    <span className="mobile-card-value">${bill.subtotal?.toFixed(2)}</span>
                  </div>

                  <div className="mobile-card-field">
                    <span className="mobile-card-label">GST ({bill.gstPercent}%)</span>
                    <span className="mobile-card-value text-muted">${bill.gstAmount?.toFixed(2)}</span>
                  </div>

                  <div className="mobile-card-field">
                    <span className="mobile-card-label">Grand Total</span>
                    <span className="mobile-card-value text-success fw-bold">${bill.grandTotal?.toFixed(2)}</span>
                  </div>

                  <div className="mobile-card-actions">
                    <Link to={`/invoices/${bill._id}`} className="btn btn-outline-primary btn-sm rounded-pill w-100 text-center py-2 fw-medium">
                      <i className="bi bi-eye-fill me-1"></i>
                      Open Receipt
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CustomerDetails;
