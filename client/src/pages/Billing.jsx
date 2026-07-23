import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Loader from '../components/Loader';
import { toast } from 'react-toastify';

const Billing = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  
  // Billing form state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [gstPercent, setGstPercent] = useState('18'); // Default standard GST
  const [selectedProductId, setSelectedProductId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Cart state
  const [cart, setCart] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Load products and prefill invoice details if in edit mode
  useEffect(() => {
    const initBilling = async () => {
      setLoadingProducts(true);
      try {
        // Load products without pagination to show in dropdown
        const prodResponse = await axios.get('/api/products', {
          params: { page: 1, limit: 100 }, // Fetch up to 100 items for selection
        });
        const allProducts = prodResponse.data.products;
        
        // Filter products that have at least 1 item in stock
        const inStockItems = allProducts.filter((p) => p.quantity > 0);
        setAvailableProducts(inStockItems);

        if (isEditMode) {
          const invResponse = await axios.get(`/api/invoices/${id}`);
          const inv = invResponse.data;
          setCustomerName(inv.customerName);
          setCustomerPhone(inv.customerPhone || '');
          setGstPercent(inv.gstPercent.toString());
          setInvoiceNumber(inv.invoiceNumber);

          const mappedCart = inv.products.map((item) => {
            const dbProduct = allProducts.find((p) => p._id === item.product);
            const currentDbQty = dbProduct ? dbProduct.quantity : 0;
            return {
              product: item.product,
              name: item.name,
              brand: item.brand,
              colour: item.colour,
              size: item.size,
              sellingPrice: item.sellingPrice,
              maxQuantity: currentDbQty + item.quantity,
              quantity: item.quantity,
              total: item.total,
            };
          });
          setCart(mappedCart);
        }
      } catch (err) {
        console.error('Billing setup failed:', err);
        toast.error('Failed to initialize billing screen');
      } finally {
        setLoadingProducts(false);
      }
    };

    initBilling();
  }, [id, isEditMode]);

  // Add selected product to cart
  const handleAddItem = () => {
    if (!selectedProductId) {
      toast.error('Please select a paint product to add');
      return;
    }

    const productToAdd = availableProducts.find((p) => p._id === selectedProductId);
    if (!productToAdd) return;

    // Check if already in cart
    const isAlreadyInCart = cart.find((item) => item.product === selectedProductId);
    if (isAlreadyInCart) {
      toast.info(`"${productToAdd.name}" is already in the cart. You can adjust its quantity in the list.`);
      return;
    }

    // Add to cart with default qty 1
    const newItem = {
      product: productToAdd._id,
      name: productToAdd.name,
      brand: productToAdd.brand,
      colour: productToAdd.colour,
      size: productToAdd.size,
      sellingPrice: productToAdd.sellingPrice,
      maxQuantity: productToAdd.quantity, // Save max stock level
      quantity: 1,
      total: productToAdd.sellingPrice,
    };

    setCart([...cart, newItem]);
    setSelectedProductId('');
    setSearchQuery('');
    toast.success(`Added "${productToAdd.name}" to cart`);
  };

  // Modify item quantity inside cart
  const handleQtyChange = (productId, newQty) => {
    if (newQty === '' || isNaN(newQty)) {
      setCart(cart.map((item) => (item.product === productId ? { ...item, quantity: '' } : item)));
      return;
    }

    const qty = parseInt(newQty);
    
    setCart(
      cart.map((item) => {
        if (item.product === productId) {
          // Validate quantity bounds
          if (qty < 1) {
            toast.error('Quantity must be at least 1');
            return item;
          }
          if (qty > item.maxQuantity) {
            toast.error(`Only ${item.maxQuantity} units are available in stock.`);
            return { ...item, quantity: item.maxQuantity, total: item.maxQuantity * item.sellingPrice };
          }
          return {
            ...item,
            quantity: qty,
            total: qty * item.sellingPrice,
          };
        }
        return item;
      })
    );
  };

  // Remove item from cart
  const handleRemoveItem = (productId) => {
    setCart(cart.filter((item) => item.product !== productId));
    toast.info('Item removed from cart');
  };

  // Calculate Subtotal
  const subtotal = cart.reduce((sum, item) => sum + (Number(item.total) || 0), 0);

  // Calculate GST
  const gstRate = parseFloat(gstPercent) || 0;
  const gstAmount = (subtotal * gstRate) / 100;

  // Calculate Grand Total
  const grandTotal = subtotal + gstAmount;

  // Process checkout
  const handleCheckout = async (e) => {
    e.preventDefault();

    if (!customerName.trim()) {
      toast.error('Please enter a customer name');
      return;
    }

    if (cart.length === 0) {
      toast.error('Please add at least one item to the cart');
      return;
    }

    // Verify no empty quantities
    const hasEmptyQty = cart.some((item) => item.quantity === '' || item.quantity <= 0);
    if (hasEmptyQty) {
      toast.error('Please fill in valid quantities for all cart items');
      return;
    }

    setSubmitting(true);
    const invoicePayload = {
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      gstPercent: gstRate,
      products: cart.map((item) => ({
        product: item.product,
        quantity: item.quantity,
        sellingPrice: item.sellingPrice,
      })),
    };

    try {
      let response;
      if (isEditMode) {
        response = await axios.put(`/api/invoices/${id}`, invoicePayload);
        toast.success('Invoice updated successfully!');
      } else {
        response = await axios.post('/api/invoices', invoicePayload);
        toast.success('Invoice checked out and recorded successfully!');
      }
      
      // Redirect to invoice receipt screen
      navigate(`/invoices/${response.data._id}`);
    } catch (err) {
      console.error('Error during checkout:', err);
      toast.error(err.response?.data?.message || 'Failed to save invoice');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingProducts) return <Loader message="Setting up billing registers..." />;

  return (
    <div className="d-flex flex-column gap-4">
      {isEditMode && (
        <div className="alert alert-warning border-0 shadow-sm rounded-4 p-3 d-flex align-items-center justify-content-between mb-0" style={{ zIndex: 1 }}>
          <div className="d-flex align-items-center gap-2">
            <span className="fs-4">✏️</span>
            <div>
              <h6 className="fw-bold mb-0">Invoice Edit Mode</h6>
              <small className="text-muted">You are modifying invoice <strong>{invoiceNumber}</strong>. Product quantities and customer records will be automatically adjusted.</small>
            </div>
          </div>
          <button onClick={() => navigate(`/invoices/${id}`)} className="btn btn-outline-dark btn-sm rounded-pill px-3 fw-medium">
            Cancel Edit
          </button>
        </div>
      )}
      <div className="row g-4">
      {/* Product Selection & Customer Info Form */}
      <div className="col-12 col-xl-4">
        <div className="d-flex flex-column gap-4">
          {/* Customer Card */}
          <div className="card border-0 shadow-sm p-4 bg-white card-hover-effect" style={{ borderRadius: '16px' }}>
            <h5 className="fw-bold text-dark mb-3">
              <i className="bi bi-person-lines-fill text-primary me-2"></i>
              Customer Details
            </h5>
            <div className="mb-3">
              <label htmlFor="customerName" className="form-label small fw-semibold text-muted">Customer Name*</label>
              <input
                type="text"
                className="form-control bg-light py-2"
                id="customerName"
                placeholder="Enter customer name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
            </div>
            <div className="mb-2">
              <label htmlFor="customerPhone" className="form-label small fw-semibold text-muted">Phone Number (Optional)</label>
              <input
                type="tel"
                className="form-control bg-light py-2"
                id="customerPhone"
                placeholder="Enter phone number"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>
          </div>

          {/* Add Product Card */}
          <div className="card border-0 shadow-sm p-4 bg-white card-hover-effect" style={{ borderRadius: '16px' }}>
            <h5 className="fw-bold text-dark mb-3">
              <i className="bi bi-cart-plus-fill text-secondary me-2"></i>
              Add Items to Bill
            </h5>
            <div className="mb-4 position-relative">
              <label htmlFor="productSearch" className="form-label small fw-semibold text-muted">Search Paint Product*</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  id="productSearch"
                  className="form-control bg-light border-start-0 py-2"
                  placeholder={availableProducts.length === 0 ? "No stock available..." : "Type product name, brand, color..."}
                  value={searchQuery}
                  disabled={availableProducts.length === 0}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                    if (!e.target.value) {
                      setSelectedProductId('');
                    }
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  autoComplete="off"
                />
                {searchQuery && (
                  <button
                    className="btn btn-outline-secondary border-start-0 bg-light"
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedProductId('');
                    }}
                  >
                    <i className="bi bi-x-lg text-muted small"></i>
                  </button>
                )}
              </div>

              {/* Suggestions dropdown overlay */}
              {showSuggestions && availableProducts.length > 0 && (
                <div className="suggestions-dropdown shadow-lg">
                  {availableProducts.filter((p) => {
                    const q = searchQuery.toLowerCase();
                    return (
                      p.name.toLowerCase().includes(q) ||
                      p.brand.toLowerCase().includes(q) ||
                      p.colour.toLowerCase().includes(q) ||
                      p.size.toLowerCase().includes(q) ||
                      p.category.toLowerCase().includes(q)
                    );
                  }).length === 0 ? (
                    <div className="text-center text-muted p-3 small">
                      <i className="bi bi-info-circle me-1"></i> No matching products in stock
                    </div>
                  ) : (
                    availableProducts
                      .filter((p) => {
                        const q = searchQuery.toLowerCase();
                        return (
                          p.name.toLowerCase().includes(q) ||
                          p.brand.toLowerCase().includes(q) ||
                          p.colour.toLowerCase().includes(q) ||
                          p.size.toLowerCase().includes(q) ||
                          p.category.toLowerCase().includes(q)
                        );
                      })
                      .map((p) => {
                        const isSelected = selectedProductId === p._id;
                        return (
                          <div
                            key={p._id}
                            className={`suggestion-item ${isSelected ? 'active' : ''}`}
                            onClick={() => {
                              setSelectedProductId(p._id);
                              setSearchQuery(`${p.name} - ${p.brand} (${p.colour}, ${p.size})`);
                              setShowSuggestions(false);
                            }}
                          >
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <span className="fw-bold text-dark small">{p.name}</span>
                              <span className={`badge ${p.quantity < 5 ? 'bg-danger' : 'bg-success'} rounded-pill`} style={{ fontSize: '0.65rem' }}>
                                Stock: {p.quantity}
                              </span>
                            </div>
                            <div className="d-flex justify-content-between align-items-center text-muted" style={{ fontSize: '0.75rem' }}>
                              <span>{p.brand} • {p.colour} • {p.size}</span>
                              <span className="fw-bold text-primary">₹{p.sellingPrice.toFixed(2)}</span>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              )}

              {availableProducts.length === 0 && (
                <div className="text-danger small mt-2">
                  <i className="bi bi-exclamation-circle-fill me-1"></i>
                  No products are currently in stock. Add product quantity in Stock.
                </div>
              )}
            </div>
            <button
              onClick={handleAddItem}
              className="btn btn-primary w-100 rounded-pill py-2.5 fw-semibold d-flex align-items-center justify-content-center gap-2"
              disabled={availableProducts.length === 0}
            >
              <i className="bi bi-plus-lg"></i>
              Add Item to Cart
            </button>
          </div>
        </div>
      </div>

      {/* Cart Summary & Total Calculations */}
      <div className="col-12 col-xl-8">
        <div className="card border-0 shadow-sm p-4 bg-white h-100 d-flex flex-column justify-content-between card-hover-effect" style={{ borderRadius: '16px' }}>
          <div>
            <h5 className="fw-bold text-dark mb-4">
              <i className="bi bi-cart4 text-success me-2"></i>
              Billing Cart Checklist
            </h5>

            {cart.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-cart-x fs-1 text-muted"></i>
                <h6 className="fw-bold text-dark mt-3">Your Billing Cart is Empty</h6>
                <p className="text-muted small">Select items from the left side panel to populate customer invoice.</p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="table-responsive border-0 shadow-none mb-4 d-none d-md-block">
                  <table className="table align-middle">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: '40%' }}>Paint Details</th>
                        <th style={{ width: '15%' }}>Price</th>
                        <th style={{ width: '20%' }}>Quantity</th>
                        <th style={{ width: '15%' }}>Total</th>
                        <th style={{ width: '10%' }} className="text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.map((item) => (
                        <tr key={item.product}>
                          <td>
                            <div className="fw-bold text-dark">{item.name}</div>
                            <div className="text-muted small">
                              {item.brand} • {item.colour} • {item.size}
                            </div>
                          </td>
                          <td>₹{item.sellingPrice.toFixed(2)}</td>
                          <td>
                            <div className="input-group input-group-sm" style={{ maxWidth: '110px' }}>
                              <input
                                type="number"
                                className="form-control text-center"
                                value={item.quantity}
                                min="1"
                                max={item.maxQuantity}
                                onChange={(e) => handleQtyChange(item.product, e.target.value)}
                              />
                              <span className="input-group-text bg-light text-muted small" title="Max stock limit" style={{ fontSize: '0.65rem' }}>
                                /{item.maxQuantity}
                              </span>
                            </div>
                          </td>
                          <td className="fw-bold text-success">₹{(Number(item.total) || 0).toFixed(2)}</td>
                          <td className="text-center">
                            <button
                              onClick={() => handleRemoveItem(item.product)}
                              className="btn btn-outline-danger btn-sm rounded-circle p-1"
                              title="Remove Item"
                              style={{ width: '28px', height: '28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <i className="bi bi-x-lg" style={{ fontSize: '0.8rem' }}></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="d-block d-md-none mb-4">
                  {cart.map((item) => (
                    <div key={item.product} className="mobile-card">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <div className="mobile-card-title">{item.name}</div>
                          <div className="mobile-card-subtitle text-muted" style={{ fontSize: '0.8rem' }}>
                            {item.brand} • {item.colour} • {item.size}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(item.product)}
                          className="btn btn-outline-danger btn-sm rounded-circle"
                          title="Remove Item"
                          style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <i className="bi bi-x-lg"></i>
                        </button>
                      </div>

                      <div className="mobile-card-field">
                        <span className="mobile-card-label">Price</span>
                        <span className="mobile-card-value">₹{item.sellingPrice.toFixed(2)}</span>
                      </div>

                      <div className="mobile-card-field">
                        <span className="mobile-card-label">Quantity</span>
                        <span className="mobile-card-value">
                          <div className="input-group input-group-sm" style={{ maxWidth: '120px' }}>
                            <input
                              type="number"
                              className="form-control text-center"
                              value={item.quantity}
                              min="1"
                              max={item.maxQuantity}
                              onChange={(e) => handleQtyChange(item.product, e.target.value)}
                            />
                            <span className="input-group-text bg-light text-muted small" title="Max stock limit" style={{ fontSize: '0.65rem' }}>
                              /{item.maxQuantity}
                            </span>
                          </div>
                        </span>
                      </div>

                      <div className="mobile-card-field">
                        <span className="mobile-card-label">Total</span>
                        <span className="mobile-card-value fw-bold text-success">₹{(Number(item.total) || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Pricing calculations footer */}
          {cart.length > 0 && (
            <div className="border-top pt-4 mt-auto">
              <div className="row g-3 justify-content-end mb-4">
                <div className="col-12 col-md-5">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="text-muted small fw-medium">Subtotal Amount:</span>
                    <span className="fw-bold text-dark">₹{subtotal.toFixed(2)}</span>
                  </div>

                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="text-muted small fw-medium">GST Rate:</span>
                    <div className="input-group input-group-sm" style={{ width: '90px' }}>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        className="form-control text-center"
                        value={gstPercent}
                        onChange={(e) => setGstPercent(e.target.value)}
                      />
                      <span className="input-group-text">%</span>
                    </div>
                  </div>

                  <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                    <span className="text-muted small fw-medium">GST Amount:</span>
                    <span className="fw-semibold text-muted">₹{gstAmount.toFixed(2)}</span>
                  </div>

                  <div className="d-flex align-items-center justify-content-between">
                    <span className="h6 fw-bold mb-0">Grand Total:</span>
                    <span className="h5 fw-bold text-success mb-0">₹{grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-end gap-3">
                <button
                  onClick={() => setCart([])}
                  className="btn btn-light rounded-pill px-4 py-2.5 fw-medium"
                  disabled={submitting}
                >
                  Clear Cart
                </button>
                <button
                  onClick={handleCheckout}
                  className="btn btn-success rounded-pill px-5 py-2.5 fw-bold d-flex align-items-center gap-2"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      {isEditMode ? 'Saving Changes...' : 'Checking out...'}
                    </>
                  ) : (
                    <>
                      <i className={isEditMode ? 'bi bi-check-circle-fill' : 'bi bi-wallet2'}></i>
                      {isEditMode ? 'Update & Save Changes' : 'Checkout & Print Invoice'}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
  );
};

export default Billing;
