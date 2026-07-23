import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import Loader from '../components/Loader';
import { toast } from 'react-toastify';

const InvoiceDetails = () => {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoiceDetails = async () => {
      try {
        const response = await axios.get(`/api/invoices/${id}`);
        setInvoice(response.data);
      } catch (err) {
        console.error('Error fetching invoice details:', err);
        toast.error('Failed to load invoice receipt details');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoiceDetails();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <Loader message="Fetching transaction invoice..." />;

  if (!invoice) {
    return (
      <div className="alert alert-danger shadow-sm border-0 rounded-4 p-4 text-center">
        <i className="bi bi-x-circle fs-1 mb-2"></i>
        <h5 className="fw-bold">Invoice Not Found</h5>
        <p className="mb-0">The requested invoice number does not exist or has been deleted.</p>
        <Link to="/sales" className="btn btn-outline-danger btn-sm mt-3 px-4 rounded-pill">
          Back to Sales Ledger
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Control Buttons (no-print) */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4 no-print">
        <div className="d-flex align-items-center">
          <Link to="/sales" className="btn btn-light rounded-circle p-2 me-3 shadow-sm" style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="bi bi-arrow-left"></i>
          </Link>
          <h4 className="fw-bold mb-0 text-dark">Invoice Details</h4>
        </div>
        <div className="d-flex gap-2 w-100 w-sm-auto justify-content-end">
          <Link
            to={`/billing/edit/${invoice._id}`}
            className="btn btn-warning rounded-pill px-3 px-sm-4 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2 flex-grow-1 flex-sm-grow-0 text-dark"
          >
            <i className="bi bi-pencil-square"></i>
            Edit Invoice
          </Link>
          <button
            onClick={handlePrint}
            className="btn btn-primary rounded-pill px-3 px-sm-4 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2 flex-grow-1 flex-sm-grow-0"
          >
            <i className="bi bi-printer"></i>
            Print Receipt
          </button>
          <button
            onClick={handlePrint}
            className="btn btn-outline-dark rounded-pill px-3 px-sm-4 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2 flex-grow-1 flex-sm-grow-0"
            title="Saves invoice as PDF using browser printing dialog"
          >
            <i className="bi bi-file-earmark-pdf"></i>
            Save PDF
          </button>
        </div>
      </div>

      {/* Professional Invoice Template */}
      <div className="card border-0 shadow p-3 p-sm-4 p-md-5 bg-white mx-auto" style={{ borderRadius: '20px', maxWidth: '850px' }}>
        {/* Invoice Header */}
        <div className="row g-4 justify-content-between align-items-start border-bottom pb-4 mb-4">
          <div className="col-12 col-md-6">
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="fs-3">🎨</span>
              <h3 className="fw-bold text-dark mb-0">Paint Master Store</h3>
            </div>
            <p className="text-secondary small mb-0">
              108 Rainbow Enclave, Retail Sector 3,<br />
              Commercial Zone, NY 10001<br />
              Phone: +1 (555) 019-2834 | Email: billing@paintmaster.com
            </p>
          </div>
          <div className="col-12 col-md-5 text-md-end">
            <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-3 py-1.5 fw-bold mb-2">
              PAID RECEIPT
            </span>
            <h4 className="fw-bold text-dark mb-1">INVOICE</h4>
            <h6 className="fw-semibold text-primary">{invoice.invoiceNumber}</h6>
            <div className="text-muted small mt-2">
              Date: <span className="text-dark fw-medium">{new Date(invoice.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span><br />
              Time: <span className="text-dark fw-medium">{new Date(invoice.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </div>

        {/* Customer Details */}
        <div className="row g-4 mb-4">
          <div className="col-12">
            <h6 className="text-uppercase text-muted small fw-bold mb-2">Billed To:</h6>
            <h5 className="fw-bold text-dark mb-1">{invoice.customerName}</h5>
            {invoice.customerPhone ? (
              <span className="text-secondary small fw-medium">
                <i className="bi bi-telephone-fill me-1"></i>
                {invoice.customerPhone}
              </span>
            ) : (
              <span className="text-muted small italic">No contact phone number provided</span>
            )}
          </div>
        </div>

        {/* Products Table (Desktop) */}
        <div className="table-responsive border-0 shadow-none mb-4 d-none d-md-block" style={{ borderRadius: '0' }}>
          <table className="table align-middle">
            <thead className="table-light">
              <tr>
                <th className="ps-2">Paint details</th>
                <th className="text-center" style={{ width: '15%' }}>Size</th>
                <th className="text-center" style={{ width: '15%' }}>Rate</th>
                <th className="text-center" style={{ width: '15%' }}>Quantity</th>
                <th className="text-end pe-2" style={{ width: '20%' }}>Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.products?.map((item) => (
                <tr key={item._id}>
                  <td className="ps-2">
                    <div className="fw-bold text-dark">{item.name}</div>
                    <div className="text-muted small">{item.brand} | Colour: {item.colour}</div>
                  </td>
                  <td className="text-center fw-semibold text-muted">{item.size}</td>
                  <td className="text-center">₹{item.sellingPrice.toFixed(2)}</td>
                  <td className="text-center fw-medium">{item.quantity}</td>
                  <td className="text-end fw-bold text-dark pe-2">₹{item.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Products List (Mobile) */}
        <div className="d-block d-md-none mb-4">
          <h6 className="text-uppercase text-muted small fw-bold mb-3 border-bottom pb-2">Purchased Items</h6>
          {invoice.products?.map((item) => (
            <div key={item._id} className="py-2.5 border-bottom border-light">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="fw-bold text-dark" style={{ fontSize: '0.95rem' }}>{item.name}</div>
                  <div className="text-muted small">
                    {item.brand} | Colour: {item.colour}
                  </div>
                  <div className="small text-secondary mt-1">
                    Qty: <strong className="text-dark">{item.quantity}</strong> @ ₹{item.sellingPrice.toFixed(2)} ({item.size})
                  </div>
                </div>
                <div className="text-end fw-bold text-dark mt-1" style={{ fontSize: '0.95rem' }}>
                  ₹{item.total.toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Totals Breakdown */}
        <div className="row g-3 justify-content-end mb-4 pt-3 border-top">
          <div className="col-12 col-md-5">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted small fw-medium">Subtotal:</span>
              <span className="fw-semibold text-dark">₹{invoice.subtotal.toFixed(2)}</span>
            </div>
            {invoice.gstPercent > 0 && (
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-muted small fw-medium">GST ({invoice.gstPercent}%):</span>
                <span className="fw-semibold text-muted">₹{invoice.gstAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="d-flex justify-content-between align-items-center border-top pt-2 mt-2">
              <span className="h6 fw-bold text-dark mb-0">Grand Total:</span>
              <span className="h5 fw-bold text-success mb-0">₹{invoice.grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Invoice Footer / Terms */}
        <div className="text-center text-secondary small mt-5 pt-4 border-top">
          <h6 className="fw-bold text-dark mb-1">Thank you for your business!</h6>
          <p className="mb-0 text-muted" style={{ fontSize: '0.75rem' }}>
            Goods once sold cannot be returned. Please inspect products for matching colour codes before application.<br />
            For any queries, please refer to invoice details above.
          </p>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetails;
