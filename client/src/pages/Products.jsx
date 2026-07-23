import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Loader from '../components/Loader';
import ConfirmModal from '../components/ConfirmModal';
import { toast } from 'react-toastify';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  
  // Inline edit state
  const [editingId, setEditingId] = useState(null);
  const [editQty, setEditQty] = useState(0);

  // Deletion modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/products', {
        params: {
          page,
          limit: 10,
          search: searchTerm,
          lowStock: lowStockFilter,
        },
      });
      setProducts(response.data.products);
      setTotalPages(response.data.pages);
      setTotalProducts(response.data.totalProducts);
    } catch (err) {
      console.error('Error loading products:', err);
      toast.error('Failed to load paint products');
    } finally {
      setLoading(false);
    }
  };

  // Debounced search trigger (fetching when filters change)
  useEffect(() => {
    // Reset page to 1 when search or filter changes to avoid empty pages
    setPage(1);
  }, [searchTerm, lowStockFilter]);

  useEffect(() => {
    fetchProducts();
  }, [page, searchTerm, lowStockFilter]);

  // Handle deletion confirmation
  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    try {
      await axios.delete(`/api/products/${productToDelete._id}`);
      toast.success(`Product "${productToDelete.name}" deleted successfully`);
      setDeleteModalOpen(false);
      setProductToDelete(null);
      // Reload products
      if (products.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        fetchProducts();
      }
    } catch (err) {
      console.error('Error deleting product:', err);
      toast.error(err.response?.data?.message || 'Failed to delete product');
      setDeleteModalOpen(false);
    }
  };

  // Start inline editing of quantity
  const startEditQty = (product) => {
    setEditingId(product._id);
    setEditQty(product.quantity);
  };

  // Save inline quantity adjustment
  const saveQtyUpdate = async (id) => {
    if (editQty === '' || isNaN(editQty) || parseInt(editQty) < 0) {
      toast.error('Please enter a valid non-negative quantity');
      return;
    }

    try {
      const response = await axios.patch(`/api/products/${id}/quantity`, {
        quantity: parseInt(editQty),
      });
      toast.success('Stock quantity updated successfully');
      setEditingId(null);
      
      // Update local state
      setProducts(products.map((p) => (p._id === id ? { ...p, quantity: response.data.quantity } : p)));
    } catch (err) {
      console.error('Error updating quantity:', err);
      toast.error(err.response?.data?.message || 'Failed to update stock levels');
    }
  };

  return (
    <div>
      {/* Control Panel: Add, Search, Filters */}
      <div className="card border-0 shadow-sm p-4 mb-4" style={{ borderRadius: '16px' }}>
        <div className="row g-3 align-items-center">
          {/* Add Product Button */}
          <div className="col-12 col-md-3">
            <Link to="/products/add" className="btn btn-primary w-100 rounded-pill py-2 fw-semibold d-flex align-items-center justify-content-center gap-2">
              <i className="bi bi-plus-circle"></i>
              Add New Paint
            </Link>
          </div>
          
          {/* Search Box */}
          <div className="col-12 col-md-5">
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0 rounded-start-pill ps-3">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control bg-light border-start-0 rounded-end-pill py-2"
                placeholder="Search by name, brand, category, colour..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Filters */}
          <div className="col-12 col-md-4 d-flex justify-content-md-end align-items-center">
            <div className="form-check form-switch bg-light rounded-pill px-4 py-2 border shadow-sm">
              <input
                className="form-check-input ms-0 me-2"
                type="checkbox"
                role="switch"
                id="lowStockSwitch"
                checked={lowStockFilter}
                onChange={(e) => setLowStockFilter(e.target.checked)}
              />
              <label className="form-check-label small fw-semibold text-danger" htmlFor="lowStockSwitch">
                <i className="bi bi-exclamation-triangle-fill me-1"></i>
                Low Stock Only (&lt; 10)
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Main Stock Table */}
      {loading && products.length === 0 ? (
        <Loader message="Loading paint inventory..." />
      ) : products.length === 0 ? (
        <div className="card border-0 shadow-sm text-center py-5 rounded-4 bg-white">
          <div className="py-4">
            <i className="bi bi-folder-x fs-1 text-muted"></i>
            <h5 className="fw-bold text-dark mt-3">No Products Found</h5>
            <p className="text-muted small">Try modifying your search criteria or register a new product.</p>
            {searchTerm || lowStockFilter ? (
              <button
                className="btn btn-outline-primary btn-sm rounded-pill px-4 mt-2"
                onClick={() => { setSearchTerm(''); setLowStockFilter(false); }}
              >
                Clear Filters
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="table-responsive border-0 shadow-sm rounded-4 mb-4 d-none d-md-block">
            <table className="table table-hover align-middle mb-0 bg-white">
              <thead>
                <tr>
                  <th>Product Details</th>
                  <th>Category</th>
                  <th>Colour</th>
                  <th>Size</th>
                  <th>Buying / Selling</th>
                  <th>Stock Quantity</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const isLowStock = product.quantity < 10;
                  const isEditing = editingId === product._id;

                  return (
                    <tr key={product._id} className={isLowStock ? 'low-stock-alert-row' : ''}>
                      <td>
                        <div className="fw-bold text-dark">{product.name}</div>
                        <div className="text-muted small">
                          Brand: <span className="fw-medium">{product.brand}</span> | Supplier: <span className="fw-medium">{product.supplier}</span>
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border px-2.5 py-1.5 fw-medium text-capitalize">
                          {product.category}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-1.5">
                          <span
                            className="d-inline-block rounded-circle border border-secondary"
                            style={{
                              width: '12px',
                              height: '12px',
                              backgroundColor: product.colour.toLowerCase().replace(/\s/g, ''),
                            }}
                          ></span>
                          <span className="text-capitalize">{product.colour}</span>
                        </div>
                      </td>
                      <td>
                        <span className="fw-semibold text-muted">{product.size}</span>
                      </td>
                      <td>
                        <div className="small text-muted">
                          Buy: <span className="text-dark fw-medium">₹{product.buyingPrice.toFixed(2)}</span>
                        </div>
                        <div className="small">
                          Sell: <span className="text-success fw-bold">₹{product.sellingPrice.toFixed(2)}</span>
                        </div>
                      </td>
                      <td>
                        {isEditing ? (
                          <div className="input-group input-group-sm" style={{ width: '130px' }}>
                            <input
                              type="number"
                              className="form-control"
                              value={editQty}
                              min="0"
                              onChange={(e) => setEditQty(e.target.value)}
                              autoFocus
                              onKeyDown={(e) => e.key === 'Enter' && saveQtyUpdate(product._id)}
                            />
                            <button
                              className="btn btn-success"
                              type="button"
                              onClick={() => saveQtyUpdate(product._id)}
                              title="Save"
                            >
                              <i className="bi bi-check-lg"></i>
                            </button>
                            <button
                              className="btn btn-outline-secondary"
                              type="button"
                              onClick={() => setEditingId(null)}
                              title="Cancel"
                            >
                              <i className="bi bi-x-lg"></i>
                            </button>
                          </div>
                        ) : (
                          <div className="d-flex align-items-center gap-2">
                            <span className={`badge ${isLowStock ? (product.quantity === 0 ? 'bg-danger' : 'bg-warning') : 'bg-success'} text-dark fw-bold rounded-pill px-3 py-1.5`}>
                              {product.quantity} units
                            </span>
                            <button
                              className="btn btn-link btn-sm text-primary p-0"
                              onClick={() => startEditQty(product)}
                              title="Quick Update Quantity"
                            >
                              <i className="bi bi-pencil-square fs-5"></i>
                            </button>
                          </div>
                        )}
                        {isLowStock && (
                          <div className="text-danger small fw-semibold mt-1" style={{ fontSize: '0.7rem' }}>
                            <i className="bi bi-exclamation-triangle-fill me-1"></i>
                            {product.quantity === 0 ? 'Out of Stock' : 'Low Stock Alert'}
                          </div>
                        )}
                      </td>
                      <td className="text-end">
                        <div className="d-flex justify-content-end gap-2">
                          <Link
                            to={`/products/edit/${product._id}`}
                            className="btn btn-outline-secondary btn-sm rounded-circle p-2"
                            title="Edit Product details"
                            style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <i className="bi bi-pencil"></i>
                          </Link>
                          <button
                            onClick={() => handleDeleteClick(product)}
                            className="btn btn-outline-danger btn-sm rounded-circle p-2"
                            title="Delete Product"
                            style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="d-block d-md-none mb-4">
            {products.map((product) => {
              const isLowStock = product.quantity < 10;
              const isEditing = editingId === product._id;

              return (
                <div key={product._id} className="mobile-card">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <div className="mobile-card-title">{product.name}</div>
                      <div className="mobile-card-subtitle text-muted" style={{ fontSize: '0.8rem' }}>
                        Brand: <span className="fw-semibold text-dark">{product.brand}</span>
                      </div>
                    </div>
                    <span className="badge bg-light text-dark border px-2.5 py-1 fw-medium text-capitalize" style={{ fontSize: '0.75rem' }}>
                      {product.category}
                    </span>
                  </div>

                  <div className="mobile-card-field">
                    <span className="mobile-card-label">Colour</span>
                    <span className="mobile-card-value">
                      <div className="d-flex align-items-center gap-1.5">
                        <span
                          className="d-inline-block rounded-circle border border-secondary"
                          style={{
                            width: '12px',
                            height: '12px',
                            backgroundColor: product.colour.toLowerCase().replace(/\s/g, ''),
                          }}
                        ></span>
                        <span className="text-capitalize">{product.colour}</span>
                      </div>
                    </span>
                  </div>

                  <div className="mobile-card-field">
                    <span className="mobile-card-label">Size</span>
                    <span className="mobile-card-value text-muted fw-bold">{product.size}</span>
                  </div>

                  <div className="mobile-card-field">
                    <span className="mobile-card-label">Buying / Selling</span>
                    <span className="mobile-card-value">
                      <span className="text-muted small">Buy:</span> <strong className="text-dark me-2">₹{product.buyingPrice.toFixed(2)}</strong>
                      <span className="text-muted small">Sell:</span> <strong className="text-success">₹{product.sellingPrice.toFixed(2)}</strong>
                    </span>
                  </div>

                  <div className="mobile-card-field">
                    <span className="mobile-card-label">Stock Quantity</span>
                    <span className="mobile-card-value">
                      {isEditing ? (
                        <div className="input-group input-group-sm" style={{ width: '130px' }}>
                          <input
                            type="number"
                            className="form-control"
                            value={editQty}
                            min="0"
                            onChange={(e) => setEditQty(e.target.value)}
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && saveQtyUpdate(product._id)}
                          />
                          <button
                            className="btn btn-success"
                            type="button"
                            onClick={() => saveQtyUpdate(product._id)}
                            title="Save"
                          >
                            <i className="bi bi-check-lg"></i>
                          </button>
                          <button
                            className="btn btn-outline-secondary"
                            type="button"
                            onClick={() => setEditingId(null)}
                            title="Cancel"
                          >
                            <i className="bi bi-x-lg"></i>
                          </button>
                        </div>
                      ) : (
                        <div className="d-flex align-items-center gap-2">
                          <span className={`badge ${isLowStock ? (product.quantity === 0 ? 'bg-danger' : 'bg-warning') : 'bg-success'} text-dark fw-bold rounded-pill px-3 py-1.5`}>
                            {product.quantity} units
                          </span>
                          <button
                            className="btn btn-link btn-sm text-primary p-0"
                            onClick={() => startEditQty(product)}
                            title="Quick Update Quantity"
                          >
                            <i className="bi bi-pencil-square fs-5"></i>
                          </button>
                        </div>
                      )}
                    </span>
                  </div>

                  <div className="mobile-card-field">
                    <span className="mobile-card-label">Supplier</span>
                    <span className="mobile-card-value small">{product.supplier || 'N/A'}</span>
                  </div>

                  {isLowStock && (
                    <div className="text-danger small fw-bold mt-2" style={{ fontSize: '0.75rem' }}>
                      <i className="bi bi-exclamation-triangle-fill me-1"></i>
                      {product.quantity === 0 ? 'Out of Stock' : 'Low Stock Alert'}
                    </div>
                  )}

                  <div className="mobile-card-actions">
                    <Link
                      to={`/products/edit/${product._id}`}
                      className="btn btn-outline-secondary btn-sm rounded-pill px-3 py-1.5 d-flex align-items-center gap-1"
                    >
                      <i className="bi bi-pencil"></i> Edit Details
                    </Link>
                    <button
                      onClick={() => handleDeleteClick(product)}
                      className="btn btn-outline-danger btn-sm rounded-pill px-3 py-1.5 d-flex align-items-center gap-1"
                    >
                      <i className="bi bi-trash"></i> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center px-2">
              <span className="small text-muted">
                Showing page <strong className="text-dark">{page}</strong> of <strong className="text-dark">{totalPages}</strong> ({totalProducts} total products)
              </span>
              <nav aria-label="Product inventory navigation">
                <ul className="pagination pagination-sm mb-0">
                  <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                    <button className="page-link rounded-start-pill px-3" onClick={() => setPage(page - 1)}>
                      Previous
                    </button>
                  </li>
                  {[...Array(totalPages)].map((_, i) => (
                    <li key={i} className={`page-item ${page === i + 1 ? 'active' : ''}`}>
                      <button className="page-link" onClick={() => setPage(i + 1)}>
                        {i + 1}
                      </button>
                    </li>
                  ))}
                  <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                    <button className="page-link rounded-end-pill px-3" onClick={() => setPage(page + 1)}>
                      Next
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Remove Paint Product"
        message={`Are you sure you want to remove "${productToDelete?.name}" (${productToDelete?.size}) from the stock registry? This will permanently delete the item records.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => { setDeleteModalOpen(false); setProductToDelete(null); }}
      />
    </div>
  );
};

export default Products;
